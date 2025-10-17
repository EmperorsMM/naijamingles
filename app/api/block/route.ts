import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Body = z.object({
  user_id: z.string().uuid(),
  action: z.enum(["block", "unblock"]).optional().default("block"),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get("user_id");

  const userClient = createRouteHandlerClient({ cookies });
  const { data: { session } } = await userClient.auth.getSession();
  const me = session?.user;
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!target) return NextResponse.json({ ok: false, error: "user_id required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("user_blocks")
    .select("id")
    .eq("blocker_user_id", me.id)
    .eq("blocked_user_id", target)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, blocked: !!data });
}

export async function POST(req: Request) {
  const userClient = createRouteHandlerClient({ cookies });
  const { data: { session } } = await userClient.auth.getSession();
  const me = session?.user;
  if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });

  const { user_id, action } = parsed.data;
  if (user_id === me.id) return NextResponse.json({ ok: false, error: "Cannot block yourself" }, { status: 400 });

  if (action === "unblock") {
    const { error } = await supabaseAdmin
      .from("user_blocks")
      .delete()
      .eq("blocker_user_id", me.id)
      .eq("blocked_user_id", user_id);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabaseAdmin
    .from("user_blocks")
    .upsert(
      { blocker_user_id: me.id, blocked_user_id: user_id },
      { onConflict: "blocker_user_id,blocked_user_id" }
    );
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
