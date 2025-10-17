// app/api/paystack/init/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // don't try to pre-render this
export const runtime = "nodejs";

type InitRequest = {
  amount_kobo?: number;          // kobo (e.g. 500000 = ₦5,000)
  email?: string;
  user_id?: string;
  plan_code?: string;
  reference?: string;
};

export async function POST(req: NextRequest) {
  // Parse body safely (don't crash on invalid JSON)
  const payload = (await req.json().catch(() => ({}))) as InitRequest;

  const secret = process.env.PAYSTACK_SECRET_KEY;

  // ✅ Free-first launch: don’t crash if secret is missing.
  // Return a soft error the UI can handle, but DO NOT throw.
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "PAYSTACK_SECRET_KEY not set on server" },
      { status: 200 }
    );
  }

  const amount = payload.amount_kobo ?? 500000; // default ₦5,000
  const email = payload.email ?? "test@example.com";
  const reference = payload.reference ?? `nm_${Date.now()}`;

  const body = {
    email,
    amount, // in kobo
    reference,
    metadata: { user_id: payload.user_id ?? null },
    ...(payload.plan_code ? { plan: payload.plan_code } : {}),
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/checkout/verify?ref=${reference}`,
  };

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: data?.message || "Paystack init failed" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, data });
}
