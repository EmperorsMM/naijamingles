import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-guard";

const Body = z.object({ id: z.string().uuid() });

export async function POST(req: Request) {
  const userClient = createRouteHandlerClient({ cookies });
  const { data: { session } } = await userClient.auth.getSession();
  const me = session?.user;
  if (!me || !isAdminEmail(me.email)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });

  const { id } = parsed.data;

  const { error } = await supabaseAdmin
    .from("panic_events")
    .update({ status: "resolved", resolved_at: new Date().toISOString(), resolved_by: me.id })
    .eq("id", id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
