import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";

export default async function Onboarding() {
  const supabase = createServerComponentClient({ cookies });
  const { data: session } = await supabase.auth.getSession();
  const user = session.session?.user ?? null;

  const steps: Array<{ label: string; href: string; done: boolean }> = [];

  // 1) login
  steps.push({ label: "Sign in", href: "/login", done: !!user });

  // 2) verify (simple heuristic: any verification row)
  let verified = false;
  if (user) {
    const { data } = await supabase
      .from("verifications")
      .select("status, selfie_liveness")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    verified = !!data?.[0] && data[0].status === "passed" && data[0].selfie_liveness === "passed";
  }
  steps.push({ label: "Verify identity", href: "/verify", done: verified });

  // 3) subscription
  let active = false;
  if (user) {
    const { data } = await supabase
      .from("subscriptions")
      .select("status, expires_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    const s = data?.[0];
    active = !!s && s.status === "active" && (s.expires_at ? new Date(s.expires_at) > new Date() : false);
  }
  steps.push({ label: "Subscribe", href: "/subscribe", done: active });

  // 4) profile
  let hasProfile = false;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_public_id")
      .eq("id", user.id)
      .limit(1)
      .single();
    hasProfile = !!data && (!!data.display_name || !!data.avatar_public_id);
  }
  steps.push({ label: "Complete profile", href: "/profile", done: hasProfile });

  return (
    <main className="p-6 space-y-4 max-w-lg">
      <h1 className="text-2xl font-semibold">Let’s get you set up</h1>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={`h-5 w-5 rounded-full text-xs flex items-center justify-center ${s.done ? "bg-emerald-600 text-white" : "bg-gray-200"}`}>
              {s.done ? "✓" : i + 1}
            </span>
            <Link className="underline" href={s.href}>{s.label}</Link>
            {s.done && <span className="text-xs text-gray-500 ml-2">done</span>}
          </li>
        ))}
      </ol>
    </main>
  );
}
