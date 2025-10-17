import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import { sendEmail, sendSMS } from "@/lib/notifier";

const Body = z.object({
  plan_id: z.string().uuid().optional(),
  note: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(req: Request) {
  const userClient = createRouteHandlerClient({ cookies });
  const { data: { session } } = await userClient.auth.getSession();
  const me = session?.user;
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });
  }
  const { plan_id, note, lat, lng } = parsed.data;

  // 1) Save PANIC event
  const inserted = await supabaseAdmin
    .from("panic_events")
    .insert({
      user_id: me.id,
      plan_id: plan_id ?? null,
      note: note ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
      status: "open",
    })
    .select("id, created_at")
    .single();

  if (inserted.error) {
    return NextResponse.json({ ok: false, error: inserted.error.message }, { status: 400 });
  }

  // 2) Load trusted contacts
  const tc = await supabaseAdmin
    .from("trusted_contacts")
    .select("name, email, phone, notify_email, notify_sms")
    .eq("user_id", me.id)
    .limit(20);

  // 3) (optional) add plan info
  let planText = "";
  if (plan_id) {
    const p = await supabaseAdmin
      .from("meeting_plans")
      .select("start_time, place_name, place_address")
      .eq("id", plan_id)
      .maybeSingle();
    if (!p.error && p.data) {
      const when = p.data.start_time ? new Date(p.data.start_time).toLocaleString() : "Unknown time";
      planText = `\nPlan: ${when} at ${p.data.place_name ?? "Unknown place"}${p.data.place_address ? " (" + p.data.place_address + ")" : ""}`;
    }
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const at = new Date(inserted.data.created_at).toLocaleString();
  const coord = lat && lng ? `\nLocation: https://maps.google.com/?q=${lat},${lng}` : "";
  const baseText =
    `PANIC alert from ${me.email || "your contact"} at ${at}.${planText}\n` +
    (note ? `Note: ${note}\n` : "") +
    coord +
    `\n\nIf you cannot reach them, consider contacting local authorities.\n— Naijamingles Safety`;

  let emails = 0, sms = 0;
  for (const c of tc.data || []) {
    if (c.notify_email && c.email) {
      await sendEmail({
        to: c.email,
        subject: "PANIC alert — your contact may need help",
        text: `Hi ${c.name || ""},\n\n${baseText}\n\nYou can also check in-app: ${site}/safety`,
      });
      emails++;
    }
    if (c.notify_sms && c.phone) {
      await sendSMS({
        to: c.phone,
        text: `PANIC: ${me.email || "contact"} ${planText.replace(/\n/g, " ")} ${coord ? coord : ""}`,
      });
      sms++;
    }
  }

  return NextResponse.json({ ok: true, id: inserted.data.id, notified: { emails, sms } });
}
