"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignOutButton() {
  const supabase = createClientComponentClient();

  async function signOut() {
    await supabase.auth.signOut();
    // Send them somewhere sensible
    window.location.href = "/login";
  }

  return (
    <button onClick={signOut} className="text-sm text-red-600">
      Sign out
    </button>
  );
}
