"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Sending…");

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    setMsg(error ? `Error: ${error.message}` : "Magic link sent. Check your email.");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={sendLink} className="w-full max-w-sm space-y-4 border rounded-2xl p-6">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="w-full bg-black text-white rounded-lg py-2" type="submit">
          Send magic link
        </button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </main>
  );
}
