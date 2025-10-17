import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getSession();

  if (!data.session) redirect("/login");

  const user = data.session.user;
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p>You’re signed in as <b>{user.email}</b></p>
    </main>
  );
}
