import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // This returns { session: null } if nobody is signed in (not an error)
    const { data, error } = await supabase.auth.getSession();

    // If helpers still throw an error message like "Auth session missing!",
    // we’ll catch below and still return ok: true with user: null.
    if (error) {
      return NextResponse.json({ ok: true, user: null, error: null });
    }

    // Optionally fetch the user when there IS a session:
    const user = data.session?.user ?? null;
    return NextResponse.json({ ok: true, user, error: null });
  } catch {
    // Graceful fallback when there is simply no session
    return NextResponse.json({ ok: true, user: null, error: null });
  }
}
