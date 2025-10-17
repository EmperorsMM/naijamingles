import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const Body = z.object({
  partner_user_id: z.string().uuid(),
  start_time: z.string().min(10), // accepts 'datetime-local' or ISO; we convert
  location_text: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const userClient = createRouteHandlerClient({ cookies });
  const { data: { session } } = await userClient.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });
  }

  const { partner_user_id, start_time, location_text, notes } = parsed.data;

  const d = new Date(start_time);
  if (Number.isNaN(d.getTime())) {
    return NextResponse.json({ ok: false, error: "Invalid date format" }, { status: 400 });
  }
  const isoStart = d.toISOString();

  // server-enforced ownership, bypass RLS intentionally
  const { data, error } = await supabaseAdmin
    .from("meeting_plans")
    .insert({
      owner_user_id: user.id,
      partner_user_id,
      start_time: isoStart,
      location_text: location_text ?? null,
      notes: notes ?? null,
      status: "planned",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}
