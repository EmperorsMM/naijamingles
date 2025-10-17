import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function requireVerifiedUser() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, verified: false };

  // Get latest verification for this user (RLS should allow selecting own row)
  const { data } = await supabase
    .from("verifications")
    .select("status,selfie_liveness")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const verified = !!data && data.status === "passed" && data.selfie_liveness === "passed";
  return { user, verified };
}
