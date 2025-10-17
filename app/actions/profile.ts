"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

const ProfileSchema = z.object({
  display_name: z.string().min(2).max(60),
  avatar_public_id: z.string().optional().nullable(),
});

export async function saveProfile(_: unknown, formData: FormData) {
  const input = {
    display_name: formData.get("display_name"),
    avatar_public_id: formData.get("avatar_public_id"),
  };

  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }

  const supabase = createServerActionClient({ cookies });
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      avatar_public_id: parsed.data.avatar_public_id ?? null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
