import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  plan_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.message }, { status: 400 });
  }

  const { plan_id, rating, comment } = parsed.data;

  // Load the plan to figure out reviewer vs reviewee
  const { data: plan, error: planErr } = await supabase
    .from("meeting_plans")
    .select("owner_user_id, partner_user_id")
    .eq("id", plan_id)
    .single();

  if (planErr || !plan) {
    return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });
  }

  let reviewee: string | null = null;
  if (user.id === plan.owner_user_id) reviewee = plan.partner_user_id;
  else if (user.id === plan.partner_user_id) reviewee = plan.owner_user_id;

  if (!reviewee) {
    return NextResponse.json({ ok: false, error: "Not a participant" }, { status: 403 });
  }

  const { error } = await supabase.from("meeting_reviews").insert({
    plan_id,
    reviewer_user_id: user.id,   // RLS: must be the authenticated user
    reviewee_user_id: reviewee,
    rating,
    comment: comment ?? null,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
