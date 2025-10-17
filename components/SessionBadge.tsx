"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Props = { initialEmail?: string | null };

export default function SessionBadge({ initialEmail = null }: Props) {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1) Get current user (in case SSR had no cookie yet)
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      setChecked(true);
    })();

    // 2) React to future auth changes (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // While checking, render nothing to avoid a “Not signed in” flash
  if (!checked && !email) {
    return <span className="ml-auto text-xs text-gray-500">…</span>;
  }

  if (!email) {
    return <span className="ml-auto text-xs text-gray-600">Not signed in</span>;
  }

  return (
    <span className="ml-auto flex items-center gap-3 text-xs text-gray-700">
      <span className="truncate max-w-[220px]">
        Signed in: <span className="font-medium">{email}</span>
      </span>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
        className="text-red-600 hover:underline"
      >
        Sign out
      </button>
    </span>
  );
}
