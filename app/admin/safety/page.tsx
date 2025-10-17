import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-guard";
import ActionsClient from "@/app/admin/safety/ActionsClient";

export const dynamic = "force-dynamic";

type SearchDict = { [key: string]: string | string[] | undefined };

function getStr(sp: SearchDict, key: string, def: string) {
  const v = sp[key];
  if (Array.isArray(v)) return v[0] ?? def;
  return (v as string) ?? def;
}
function getInt(sp: SearchDict, key: string, def: number) {
  const v = getStr(sp, key, String(def));
  const n = parseInt(v || "", 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}
function cloneParams(sp: SearchDict) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) p.set(k, v[0] as string);
    else if (typeof v === "string") p.set(k, v);
  }
  return p;
}
function withParams(sp: SearchDict, patch: Record<string, string | number | undefined>) {
  const p = cloneParams(sp);
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null) p.delete(k);
    else p.set(k, String(v));
  }
  return `/admin/safety?${p.toString()}`;
}

export default async function AdminSafetyPage({
  searchParams,
}: {
  searchParams: SearchDict;
}) {
  // AuthN/AuthZ
  const supa = createServerComponentClient({ cookies });
  const { data: { user } } = await supa.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold mb-2">Not authorized</h1>
        <p className="text-sm text-gray-600">
          This page is for admins only. Add your email to <code>ADMIN_EMAILS</code>.
        </p>
      </main>
    );
  }

  // ---------- Filters + Pagination (defaults) ----------
  // Panics
  const pStatus = getStr(searchParams, "p_status", "open"); // open | resolved | all
  const pPage = getInt(searchParams, "p_page", 1);
  const pSize = getInt(searchParams, "p_size", 10);
  const pFrom = (pPage - 1) * pSize;
  const pTo = pFrom + pSize - 1;

  // Reports
  const rStatus = getStr(searchParams, "r_status", "open"); // open | reviewing | resolved | all
  const rPage = getInt(searchParams, "r_page", 1);
  const rSize = getInt(searchParams, "r_size", 10);
  const rFrom = (rPage - 1) * rSize;
  const rTo = rFrom + rSize - 1;

  // Check-ins
  const cKind = getStr(searchParams, "c_kind", "all"); // on_the_way | arrived | safe | cancel | all
  const cPage = getInt(searchParams, "c_page", 1);
  const cSize = getInt(searchParams, "c_size", 10);
  const cFrom = (cPage - 1) * cSize;
  const cTo = cFrom + cSize - 1;

  // ---------- Queries (admin client, bypass RLS) ----------
  // Panics
  let panicsQ = supabaseAdmin
    .from("panic_events")
    .select("id, plan_id, user_id, note, lat, lng, status, created_at")
    .order("created_at", { ascending: false })
    .range(pFrom, pTo);
  if (pStatus !== "all") panicsQ = panicsQ.eq("status", pStatus);
  const panics = await panicsQ;

  // Reports
  let reportsQ = supabaseAdmin
    .from("user_reports")
    .select("id, reporter_user_id, reported_user_id, reason, details, status, created_at")
    .order("created_at", { ascending: false })
    .range(rFrom, rTo);
  if (rStatus !== "all") reportsQ = reportsQ.eq("status", rStatus);
  const reports = await reportsQ;

  // Check-ins
  let checkinsQ = supabaseAdmin
    .from("meeting_checkins")
    .select("id, plan_id, user_id, kind, note, created_at")
    .order("created_at", { ascending: false })
    .range(cFrom, cTo);
  if (cKind !== "all") checkinsQ = checkinsQ.eq("kind", cKind);
  const checkins = await checkinsQ;

  const pCanPrev = pPage > 1;
  const pCanNext = (panics.data ?? []).length === pSize;

  const rCanPrev = rPage > 1;
  const rCanNext = (reports.data ?? []).length === rSize;

  const cCanPrev = cPage > 1;
  const cCanNext = (checkins.data ?? []).length === cSize;

  return (
    <main className="p-6 space-y-10">
      <div>
        <h1 className="text-2xl font-semibold">Safety Admin</h1>
        <p className="text-sm text-gray-600">Signed in as {user.email}</p>
      </div>

      {/* -------- PANICS -------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium">PANIC events</h2>
          {/* Filter form (GET) */}
          <form method="get" className="flex items-center gap-2 text-sm">
            {/* preserve others */}
            <input type="hidden" name="r_status" value={rStatus} />
            <input type="hidden" name="r_page" value={rPage} />
            <input type="hidden" name="r_size" value={rSize} />
            <input type="hidden" name="c_kind" value={cKind} />
            <input type="hidden" name="c_page" value={cPage} />
            <input type="hidden" name="c_size" value={cSize} />

            <label className="flex items-center gap-1">
              <span>Status</span>
              <select name="p_status" defaultValue={pStatus} className="border rounded px-2 py-1">
                <option value="open">open</option>
                <option value="resolved">resolved</option>
                <option value="all">all</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              <span>Page size</span>
              <select name="p_size" defaultValue={pSize} className="border rounded px-2 py-1">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>
            {/* reset to page 1 on filter submit */}
            <input type="hidden" name="p_page" value={1} />
            <button className="border rounded px-2 py-1">Apply</button>
          </form>
        </div>

        {panics.error ? (
          <p className="text-sm text-red-600">Error: {panics.error.message}</p>
        ) : (
          <div className="space-y-2">
            {(panics.data || []).length === 0 ? (
              <p className="text-sm text-gray-600">No panic events.</p>
            ) : (
              (panics.data || []).map((p) => (
                <div key={p.id} className="border rounded p-3 text-sm">
                  <div className="font-medium">
                    #{p.id.slice(0, 8)} · plan {p.plan_id?.slice(0, 8)} · user {p.user_id?.slice(0, 8)}
                  </div>
                  <div className="text-gray-700">Status: {p.status}</div>
                  {p.note && <div className="text-gray-700">{p.note}</div>}
                  <div className="text-gray-500 mt-1">{new Date(p.created_at).toLocaleString()}</div>
                  {p.status === "open" && <ActionsClient type="panic" id={p.id} />}
                </div>
              ))
            )}

            <div className="flex items-center justify-between text-sm pt-2">
              <a
                className={`underline ${!pCanPrev ? "pointer-events-none opacity-40" : ""}`}
                href={pCanPrev ? withParams(searchParams, { p_page: pPage - 1 }) : "#"}
              >
                ← Prev
              </a>
              <div>Page {pPage}</div>
              <a
                className={`underline ${!pCanNext ? "pointer-events-none opacity-40" : ""}`}
                href={pCanNext ? withParams(searchParams, { p_page: pPage + 1 }) : "#"}
              >
                Next →
              </a>
            </div>
          </div>
        )}
      </section>

      {/* -------- REPORTS -------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium">User Reports</h2>
          <form method="get" className="flex items-center gap-2 text-sm">
            {/* preserve others */}
            <input type="hidden" name="p_status" value={pStatus} />
            <input type="hidden" name="p_page" value={pPage} />
            <input type="hidden" name="p_size" value={pSize} />
            <input type="hidden" name="c_kind" value={cKind} />
            <input type="hidden" name="c_page" value={cPage} />
            <input type="hidden" name="c_size" value={cSize} />

            <label className="flex items-center gap-1">
              <span>Status</span>
              <select name="r_status" defaultValue={rStatus} className="border rounded px-2 py-1">
                <option value="open">open</option>
                <option value="reviewing">reviewing</option>
                <option value="resolved">resolved</option>
                <option value="all">all</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              <span>Page size</span>
              <select name="r_size" defaultValue={rSize} className="border rounded px-2 py-1">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>
            <input type="hidden" name="r_page" value={1} />
            <button className="border rounded px-2 py-1">Apply</button>
          </form>
        </div>

        {reports.error ? (
          <p className="text-sm text-red-600">Error: {reports.error.message}</p>
        ) : (
          <div className="space-y-2">
            {(reports.data || []).length === 0 ? (
              <p className="text-sm text-gray-600">No reports.</p>
            ) : (
              (reports.data || []).map((r) => (
                <div key={r.id} className="border rounded p-3 text-sm">
                  <div className="font-medium">
                    #{r.id.slice(0, 8)} · {r.status} · reporter {r.reporter_user_id.slice(0, 8)} → user{" "}
                    {r.reported_user_id.slice(0, 8)}
                  </div>
                  <div className="text-gray-700">Reason: {r.reason}</div>
                  {r.details && <div className="text-gray-700">Details: {r.details}</div>}
                  <div className="text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()}</div>
                  <ActionsClient type="report" id={r.id} currentStatus={r.status} />
                </div>
              ))
            )}

            <div className="flex items-center justify-between text-sm pt-2">
              <a
                className={`underline ${!rCanPrev ? "pointer-events-none opacity-40" : ""}`}
                href={rCanPrev ? withParams(searchParams, { r_page: rPage - 1 }) : "#"}
              >
                ← Prev
              </a>
              <div>Page {rPage}</div>
              <a
                className={`underline ${!rCanNext ? "pointer-events-none opacity-40" : ""}`}
                href={rCanNext ? withParams(searchParams, { r_page: rPage + 1 }) : "#"}
              >
                Next →
              </a>
            </div>
          </div>
        )}
      </section>

      {/* -------- CHECK-INS -------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-medium">Latest Check-ins</h2>
          <form method="get" className="flex items-center gap-2 text-sm">
            {/* preserve others */}
            <input type="hidden" name="p_status" value={pStatus} />
            <input type="hidden" name="p_page" value={pPage} />
            <input type="hidden" name="p_size" value={pSize} />
            <input type="hidden" name="r_status" value={rStatus} />
            <input type="hidden" name="r_page" value={rPage} />
            <input type="hidden" name="r_size" value={rSize} />

            <label className="flex items-center gap-1">
              <span>Kind</span>
              <select name="c_kind" defaultValue={cKind} className="border rounded px-2 py-1">
                <option value="all">all</option>
                <option value="on_the_way">on_the_way</option>
                <option value="arrived">arrived</option>
                <option value="safe">safe</option>
                <option value="cancel">cancel</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              <span>Page size</span>
              <select name="c_size" defaultValue={cSize} className="border rounded px-2 py-1">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </label>
            <input type="hidden" name="c_page" value={1} />
            <button className="border rounded px-2 py-1">Apply</button>
          </form>
        </div>

        {checkins.error ? (
          <p className="text-sm text-red-600">Error: {checkins.error.message}</p>
        ) : (
          <div className="space-y-2">
            {(checkins.data || []).length === 0 ? (
              <p className="text-sm text-gray-600">No check-ins.</p>
            ) : (
              (checkins.data || []).map((c) => (
                <div key={c.id} className="border rounded p-3 text-sm">
                  <div className="font-medium">
                    {c.kind} · plan {c.plan_id?.slice(0, 8)} · user {c.user_id?.slice(0, 8)}
                  </div>
                  {c.note && <div className="text-gray-700">{c.note}</div>}
                  <div className="text-gray-500 mt-1">{new Date(c.created_at).toLocaleString()}</div>
                </div>
              ))
            )}

            <div className="flex items-center justify-between text-sm pt-2">
              <a
                className={`underline ${!cCanPrev ? "pointer-events-none opacity-40" : ""}`}
                href={cCanPrev ? withParams(searchParams, { c_page: cPage - 1 }) : "#"}
              >
                ← Prev
              </a>
              <div>Page {cPage}</div>
              <a
                className={`underline ${!cCanNext ? "pointer-events-none opacity-40" : ""}`}
                href={cCanNext ? withParams(searchParams, { c_page: cPage + 1 }) : "#"}
              >
                Next →
              </a>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
