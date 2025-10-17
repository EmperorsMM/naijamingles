import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin"; // service-role client

export const runtime = "nodejs";

const Body = z.object({
  nin: z.string().min(8),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
});

export async function POST(req: Request) {
  const userClient = createRouteHandlerClient({ cookies });
  const { data: { session } } = await userClient.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });
  }

  const { nin, dob } = parsed.data;

  // DEV STUB: pretend we called NIN API and got these values back.
  // In production, replace this block with the real NIN provider response.
  const legal_full_name = "NIN Verified User"; // ← from provider
  const legal_gender = "unspecified";          // ← from provider (e.g., "male"/"female")
  const legal_birthdate = dob;                 // ← from provider

  // 1) Mark verification as passed / upsert latest row
  await supabaseAdmin
    .from("verifications")
    .insert({
      user_id: user.id,
      status: "passed",             // our _verified_users view expects this
      selfie_liveness: "pending",   // will become 'passed' after /kyc/liveness
      nin_last4: nin.slice(-4),
      dob: dob,
    })
    .select("id")
    .limit(1);

  // 2) Write immutable identity into profiles (service role bypasses RLS but trigger still runs)
  // Try schema with id (common)
  let { error } = await supabaseAdmin
    .from("profiles")
    .update({ legal_full_name, legal_birthdate, legal_gender })
    .eq("id", user.id);

  // Fallback to schema with user_id (if your table uses that)
  if (error) {
    await supabaseAdmin
      .from("profiles")
      .update({ legal_full_name, legal_birthdate, legal_gender })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ ok: true });
}
