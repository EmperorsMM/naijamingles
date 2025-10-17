import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({
  user_id: z.string().uuid(),
  reason: z.string().min(2),
  details: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const userClient = createRouteHandlerClient({ cookies });
  const { data: { session } } = await userClient.auth.getSession();
  const me = session?.user;
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });

  const { user_id, reason, details } = parsed.data;
  if (user_id === me.id) return NextResponse.json({ ok: false, error: "Cannot report yourself" }, { status: 400 });

  const { error } = await supabaseAdmin.from("user_reports").insert({
    reporter_user_id: me.id,
    reported_user_id: user_id,
    reason,
    details: details ?? null,
  });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
