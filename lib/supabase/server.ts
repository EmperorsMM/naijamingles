// lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

// Use this in Server Components (not /app/api/*)
export function getSupabaseServer() {
  // In many Next setups, cookies() is sync
  return createServerComponentClient({ cookies });
}
