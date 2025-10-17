import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

// Simple server client (server components / route handlers)
export function getServerSupabase() {
  return createServerComponentClient({ cookies });
}
