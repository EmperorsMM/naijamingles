import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

type SubRow = {
  status: "active" | "expired" | "canceled" | "pending";
  expires_at: string | null;
};

export async function getActiveSubscription(): Promise<{
  active: boolean;
  info?: SubRow;
}> {
  const supabase = createServerComponentClient({ cookies });
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { active: false };

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data?.[0]) return { active: false };

  const sub = data[0] as SubRow;
  const notExpired = sub.expires_at ? new Date(sub.expires_at) > new Date() : false;
  const isActive = sub.status === "active" && notExpired;

  return { active: Boolean(isActive), info: sub };
}
