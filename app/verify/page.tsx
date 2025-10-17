import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import VerifyClient from "./VerifyClient";

export default async function VerifyPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? null;

  return <VerifyClient initialEmail={email} />;
}
