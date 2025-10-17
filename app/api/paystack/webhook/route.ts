import crypto from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET!;
  const raw = await req.text();
  const headerSig = (req.headers.get("x-paystack-signature") || "").toLowerCase();
  const computed = crypto.createHmac("sha512", secret).update(raw).digest("hex");

  if (computed !== headerSig) {
    return NextResponse.json({ ok: false, error: "Bad signature" }, { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event?.event !== "charge.success") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const email: string | undefined = event?.data?.customer?.email;
  const reference: string | undefined = event?.data?.reference;
  const amount: number | undefined = event?.data?.amount; // in kobo

  if (!email || !reference) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  // Find user_id via profiles.email
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .limit(1);

  if (pErr || !profiles?.[0]) {
    return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
  }

  const user_id = profiles[0].id as string;
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Upsert (if an active row exists, extend it; else create)
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id, status, expires_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(1);

  const payload = {
    user_id,
    plan_code: "ng-monthly-5000",
    amount_kobo: amount ?? 500000,
    status: "active" as const,
    paystack_reference: reference,
    starts_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };

  if (existing?.[0]) {
    const { error: uErr } = await supabase
      .from("subscriptions")
      .update(payload)
      .eq("id", existing[0].id);
    if (uErr) return NextResponse.json({ ok: false, error: uErr.message }, { status: 500 });
  } else {
    const { error: iErr } = await supabase.from("subscriptions").insert(payload);
    if (iErr) return NextResponse.json({ ok: false, error: iErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
