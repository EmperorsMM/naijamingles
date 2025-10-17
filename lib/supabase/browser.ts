"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

let client: ReturnType<typeof createClientComponentClient> | null = null;

export function getSupabaseBrowser() {
  if (!client) {
    client = createClientComponentClient();
  }
  return client;
}
