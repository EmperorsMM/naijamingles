import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const Body = z.object({
  plan_id: z.string().uuid(),
  kind: z.enum(["on_the_way", "arrived", "safe", "cancel"]),
  note: z.string().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
});

export async function POST(req: Request) {
  const userClient = createRouteHandlerClient({ cookies });
  const { data: { session } } = await userClient.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });

  const { plan_id, kind, note, lat, lng } = parsed.data;

  // verify participant (owner or partner)
  const { data: plan, error: planErr } = await supabaseAdmin
    .from("meeting_plans")
    .select("owner_user_id, partner_user_id")
    .eq("id", plan_id)
    .single();

  if (planErr || !plan) return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });

  if (user.id !== plan.owner_user_id && user.id !== plan.partner_user_id) {
    return NextResponse.json({ ok: false, error: "Not a participant" }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("meeting_checkins").insert({
    plan_id,
    user_id: user.id,
    kind,
    note: note ?? null,
    lat: lat ?? null,
    lng: lng ?? null,
  });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
