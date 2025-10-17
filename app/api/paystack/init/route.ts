import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { nonce } from "@/lib/crypto";

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const reference = `nm_${nonce(10)}`;
  const initBody = {
    email: user.email,
    amount: 500000, // kobo
    reference,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
    plan: process.env.PAYSTACK_PLAN_CODE,
    metadata: { user_id: user.id, plan: "monthly" },
  };

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(initBody),
    cache: "no-store",
  });
  const json = await res.json();

  if (!res.ok || !json.status) {
    return NextResponse.json({ error: json.message || "init failed" }, { status: 500 });
  }

  await supabase.from("transactions").insert({
    user_id: user.id,
    provider: "paystack",
    provider_ref: reference,
    amount: 5000,
    currency: "NGN",
    status: "initialized",
    raw: json,
  });

  return NextResponse.json({ reference, auth_url: json.data.authorization_url });
}
