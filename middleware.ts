import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  // Refresh the session on every request so server components see the latest auth state
  await supabase.auth.getSession();
  return res;
}

// Match all pages (skip static assets automatically)
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
