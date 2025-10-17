import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export async function requirePaidUser() {
  const supabase = createServerComponentClient({ cookies });
  const { data: session } = await supabase.auth.getSession();
  const user = session.session?.user;
  if (!user) return { user: null, active: false };

  const { data } = await supabase
    .from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const sub = data?.[0];
  const notExpired = sub?.expires_at ? new Date(sub.expires_at) > new Date() : false;
  const active = sub?.status === "active" && notExpired;
  return { user, active };
}
