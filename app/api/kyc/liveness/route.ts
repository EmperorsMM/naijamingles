import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST() {
  const userClient = createRouteHandlerClient({ cookies });
  const { data: { session } } = await userClient.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  // Update the latest verification row for this user to selfie_liveness='passed'
  // Simple approach: insert a new "passed" record with selfie_liveness passed (idempotent enough for dev)
  await supabaseAdmin
    .from("verifications")
    .insert({
      user_id: user.id,
      status: "passed",
      selfie_liveness: "passed",
    });

  return NextResponse.json({ ok: true });
}
