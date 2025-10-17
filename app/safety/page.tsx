"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Plan = {
  id: string;
  owner_user_id: string;
  partner_user_id: string;
  start_time: string;
  status: "planned" | "canceled" | "completed";
};

export default function Safety() {
  const supabase = createClientComponentClient();

  // auth
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const signedIn = !!userEmail && !!userId;

  // plan form
  const [partner, setPartner] = useState("");
  const [start, setStart] = useState("");
  const [planId, setPlanId] = useState("");

  // plans list
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // trusted contact
  const [tcName, setTcName] = useState("");
  const [tcPhone, setTcPhone] = useState("");
  const [tcEmail, setTcEmail] = useState("");
  const [tcChannel, setTcChannel] = useState<"sms" | "email" | "">("");

  // review
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // panic
  const [panicNote, setPanicNote] = useState("");
  const [panicBusy, setPanicBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      setUserEmail(u?.email ?? null);
      setUserId(u?.id ?? null);
      setAuthChecked(true);
      if (u?.id) {
        await loadPlans(u.id);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      setUserEmail(u?.email ?? null);
      setUserId(u?.id ?? null);
      if (u?.id) {
        await loadPlans(u.id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  async function loadPlans(uid: string) {
    setLoadingPlans(true);
    const { data, error } = await supabase
      .from("meeting_plans")
      .select("id, owner_user_id, partner_user_id, start_time, status")
      .or(`owner_user_id.eq.${uid},partner_user_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (!error && data) setPlans(data as Plan[]);
    setLoadingPlans(false);
  }

  // 🔄 Refresh button handler
  async function refreshPlans() {
    if (!userId) return;
    await loadPlans(userId);
  }

  async function planMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!signedIn) return alert("Please sign in first.");
    const r = await fetch("/api/safety/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partner_user_id: partner, start_time: start }),
    });
    const j = await r.json();
    if (r.ok) {
      alert("Plan created");
      if (j.id) setPlanId(j.id);
      if (userId) await loadPlans(userId);
    } else {
      alert(j.error || "Failed");
    }
  }

  async function checkIn(kind: "on_the_way" | "arrived" | "safe" | "cancel") {
    if (!signedIn) return alert("Please sign in first.");
    const r = await fetch("/api/safety/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId || null, kind }),
    });
    const j = await r.json();
    alert(r.ok ? `Check-in: ${kind}` : j.error || "Failed");
  }

  // ✅ PANIC with geo coordinates (best-effort) + note + notification counts
  async function panic() {
    if (!signedIn) return alert("Please sign in first.");
    if (!confirm("Send PANIC alert to your trusted contact(s)?")) return;

    setPanicBusy(true);
    try {
      // Try to capture current location (best-effort)
      let coords: { lat?: number; lng?: number } = {};
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
            })
          );
          coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch {
          // ignore if denied or timed out
        }
      }

      const r = await fetch("/api/safety/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId || null,
          note: panicNote || "",
          ...coords, // sends { lat, lng } when available
        }),
      });

      const j = await r.json().catch(() => ({} as any));
      const emails = j?.notified?.emails ?? 0;
      const sms = j?.notified?.sms ?? 0;

      alert(r.ok ? `PANIC sent (emails: ${emails}, sms: ${sms})` : j?.error || "Failed");
    } finally {
      setPanicBusy(false);
    }
  }

  async function addTrustedContact(e: React.FormEvent) {
    e.preventDefault();
    if (!signedIn) return alert("Please sign in first.");
    const r = await fetch("/api/safety/trusted-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact_name: tcName,
        contact_phone: tcPhone || null,
        contact_email: tcEmail || null,
        preferred_channel: tcChannel || null,
      }),
    });
    const j = await r.json();
    alert(r.ok ? "Trusted contact saved" : j.error || "Failed");
    if (r.ok) {
      setTcName(""); setTcPhone(""); setTcEmail(""); setTcChannel("");
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!signedIn) return alert("Please sign in first.");
    if (!planId) return alert("Enter or select a Plan ID.");
    const r = await fetch("/api/safety/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId, rating, comment: comment || null }),
    });
    const j = await r.json();
    alert(r.ok ? "Review submitted" : j.error || "Failed");
    if (r.ok) { setComment(""); setRating(5); }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Safety Center</h1>

      {/* auth banner */}
      {authChecked && !signedIn ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm p-3">
          You’re not signed in. Please{" "}
          <a href="/login" className="underline font-medium">sign in</a>{" "}
          to use safety features.
        </div>
      ) : signedIn ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm p-3">
          Signed in as <span className="font-medium">{userEmail}</span>
        </div>
      ) : null}

      {/* Plan a meeting */}
      <section className="space-y-3">
        <h2 className="font-medium">Plan a meeting</h2>
        <form onSubmit={planMeeting} className="space-y-2">
          <fieldset disabled={!signedIn} className="space-y-2">
            <input
              className="w-full border rounded p-2"
              placeholder="Partner user_id (the other account's auth.users.id)"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              required
            />
            <input
              className="w-full border rounded p-2"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
            <button className="w-full rounded bg-black text-white py-2">Create plan</button>
          </fieldset>
        </form>
        {planId && <p className="text-xs text-gray-600">Current plan_id: {planId}</p>}
      </section>

      {/* Your plans (click to select) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Your plans</h2>
          <button
            type="button"
            onClick={refreshPlans}
            className="text-xs underline disabled:opacity-50"
            disabled={!signedIn || loadingPlans}
          >
            {loadingPlans ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {!signedIn ? (
          <p className="text-sm text-gray-500">Sign in to view your plans.</p>
        ) : loadingPlans ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : plans.length === 0 ? (
          <p className="text-sm text-gray-500">No plans yet.</p>
        ) : (
          <ul className="space-y-2">
            {plans.map((p) => (
              <li key={p.id} className="flex items-center justify-between border rounded p-2">
                <div className="text-sm">
                  <div className="font-medium">Plan {p.id.slice(0, 8)}…</div>
                  <div className="text-gray-600">
                    {new Date(p.start_time).toLocaleString()} — {p.status}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className="text-xs underline"
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Check-ins */}
      <section className="space-y-3">
        <h2 className="font-medium">Check-ins</h2>
        <fieldset disabled={!signedIn} className="space-y-2">
          <input
            className="w-full border rounded p-2"
            placeholder="Plan ID (or select above)"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => checkIn("on_the_way")} className="border rounded py-2">On the way</button>
            <button type="button" onClick={() => checkIn("arrived")} className="border rounded py-2">Arrived</button>
            <button type="button" onClick={() => checkIn("safe")} className="border rounded py-2">I’m safe</button>
            <button type="button" onClick={() => checkIn("cancel")} className="border rounded py-2">Cancel</button>
          </div>
        </fieldset>
      </section>

      {/* Panic */}
      <section className="space-y-3">
        <h2 className="font-medium">Emergency</h2>
        <fieldset disabled={!signedIn}>
          <textarea
            className="w-full border rounded p-2 mb-2"
            placeholder="Optional note (e.g., where you are, who you're with)…"
            value={panicNote}
            onChange={(e) => setPanicNote(e.target.value)}
          />
          <button
            type="button"
            onClick={panic}
            disabled={panicBusy}
            className="w-full rounded bg-red-600 text-white py-2 disabled:opacity-50"
          >
            {panicBusy ? "Sending…" : "PANIC"}
          </button>
        </fieldset>
      </section>

      {/* Trusted contact */}
      <section className="space-y-3">
        <h2 className="font-medium">Trusted contact</h2>
        <form onSubmit={addTrustedContact} className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input className="border rounded p-2" placeholder="Full name" value={tcName} onChange={(e)=>setTcName(e.target.value)} required />
          <select className="border rounded p-2" value={tcChannel} onChange={(e)=>setTcChannel(e.target.value as any)}>
            <option value="">Channel (optional)</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
          <input className="border rounded p-2" placeholder="Phone (optional)" value={tcPhone} onChange={(e)=>setTcPhone(e.target.value)} />
          <input className="border rounded p-2" type="email" placeholder="Email (optional)" value={tcEmail} onChange={(e)=>setTcEmail(e.target.value)} />
          <div className="md:col-span-2">
            <button disabled={!signedIn} className="w-full rounded bg-black text-white py-2">Save trusted contact</button>
          </div>
        </form>
      </section>

      {/* Review */}
      <section className="space-y-3">
        <h2 className="font-medium">Write a review</h2>
        <form onSubmit={submitReview} className="space-y-2">
          <fieldset disabled={!signedIn} className="space-y-2">
            <input
              className="w-full border rounded p-2"
              placeholder="Plan ID (or select above)"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              required
            />
            <input
              className="w-full border rounded p-2"
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value || "5", 10))}
              placeholder="Rating 1–5"
              required
            />
            <textarea
              className="w-full border rounded p-2"
              placeholder="Comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button className="w-full rounded bg-black text-white py-2">Submit review</button>
          </fieldset>
        </form>
      </section>
    </main>
  );
}
