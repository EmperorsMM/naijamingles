import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) return NextResponse.redirect(new URL("/subscribe", process.env.NEXT_PUBLIC_APP_URL));

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const j = await res.json();

  // Prefer server-provided auth_url if present
  const url = j?.data?.authorization_url || new URL("/subscribe", process.env.NEXT_PUBLIC_APP_URL).toString();
  return NextResponse.redirect(url);
}
