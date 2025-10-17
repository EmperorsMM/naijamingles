import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs"; // enable Node APIs like crypto

function isValidSignature(headerSig: string | null, raw: string) {
  const secret = process.env.PAYSTACK_SECRET_KEY!;
  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
  return (headerSig || "").toLowerCase() === expected;
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const headerSig = req.headers.get("x-paystack-signature");
  if (!isValidSignature(headerSig, raw)) {
    return NextResponse.json({ ok: false, error: "Bad signature" }, { status: 401 });
  }

  let evt: any;
  try { evt = JSON.parse(raw); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }

  const ref: string | undefined = evt?.data?.reference;
  const type: string | undefined = evt?.event;
  const user_id: string | undefined = evt?.data?.metadata?.user_id;

  // Idempotent upsert of transaction (amount in NGN integer)
  if (ref) {
    await supabaseAdmin
      .from("transactions")
      .upsert(
        {
          provider: "paystack",
          provider_ref: ref,
          status: type,
          amount: Math.round((evt?.data?.amount ?? 0) / 100), // kobo -> naira integer
          currency: evt?.data?.currency ?? "NGN",
          raw: evt,
          user_id, // must be set (we send it in metadata at init)
        },
        { onConflict: "provider_ref" }
      );
  }

  // Activate/extend subscription
  if (type === "charge.success" && user_id) {
    const now = new Date();

    // Get current sub to decide extension baseline
    const { data: current } = await supabaseAdmin
      .from("subscriptions")
      .select("current_period_end")
      .eq("user_id", user_id)
      .limit(1);

    const baseline = current?.[0]?.current_period_end
      ? new Date(current[0].current_period_end) > now
        ? new Date(current[0].current_period_end)
        : now
      : now;

    const newExpires = new Date(baseline.getTime() + 30 * 24 * 60 * 60 * 1000);
    const plan = (evt?.data?.plan?.plan_code || evt?.data?.plan || "monthly") as string;

    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id,
          provider: "paystack",
          status: "active",
          plan,
          current_period_end: newExpires.toISOString(),
        },
        { onConflict: "user_id" }
      );
  }

  return NextResponse.json({ ok: true });
}
