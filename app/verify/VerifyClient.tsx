"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Props = { initialEmail: string | null };

export default function VerifyClient({ initialEmail }: Props) {
  const supabase = createClientComponentClient();

  // auth state
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [checked, setChecked] = useState(false);
  const signedIn = !!email;

  // form state
  const [nin, setNin] = useState("");
  const [dob, setDob] = useState(""); // yyyy-mm-dd

  // results
  const [ninPassed, setNinPassed] = useState(false);
  const [livePassed, setLivePassed] = useState(false);
  const allDone = ninPassed && livePassed;

  // loading
  const [loadingNin, setLoadingNin] = useState(false);
  const [loadingLive, setLoadingLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      setChecked(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function submitNin(e: React.FormEvent) {
    e.preventDefault();
    if (!signedIn) return alert("Please sign in first.");
    setLoadingNin(true);
    try {
      const r = await fetch("/api/kyc/nin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nin, dob }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setNinPassed(true);
        alert("NIN check: passed");
      } else {
        alert(j?.error || "NIN check failed");
      }
    } finally {
      setLoadingNin(false);
    }
  }

  async function runLiveness() {
    if (!signedIn) return alert("Please sign in first.");
    setLoadingLive(true);
    try {
      const r = await fetch("/api/kyc/liveness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setLivePassed(true);
        alert("Liveness: passed");
      } else {
        alert(j?.error || "Liveness failed");
      }
    } finally {
      setLoadingLive(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Verify your identity</h1>

      {/* auth banner */}
      {!checked && !email ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm p-3">
          Checking session…
        </div>
      ) : !signedIn ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm p-3">
          You’re not signed in. Please{" "}
          <a href="/login" className="underline font-medium">sign in</a>{" "}
          to complete verification.
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm p-3">
          Signed in as <span className="font-medium">{email}</span>
        </div>
      )}

      {/* NIN form */}
      <section className="space-y-3">
        <h2 className="font-medium">Step 1 — NIN + Date of Birth</h2>
        <form onSubmit={submitNin} className="space-y-2">
          <fieldset disabled={!signedIn || ninPassed} className="space-y-2">
            <input
              className="w-full border rounded p-2"
              placeholder="NIN (dummy in dev)"
              value={nin}
              onChange={(e) => setNin(e.target.value)}
              required
            />
            <input
              className="w-full border rounded p-2"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
            <button className="w-full rounded bg-black text-white py-2" type="submit">
              {loadingNin ? "Checking..." : ninPassed ? "NIN passed ✓" : "Submit"}
            </button>
          </fieldset>
        </form>
      </section>

      {/* Liveness */}
      <section className="space-y-3">
        <h2 className="font-medium">Step 2 — Selfie liveness</h2>
        <fieldset disabled={!signedIn || !ninPassed || livePassed}>
          <button
            type="button"
            onClick={runLiveness}
            className="w-full rounded bg-black text-white py-2"
          >
            {loadingLive ? "Running..." : livePassed ? "Liveness passed ✓" : "Run selfie liveness"}
          </button>
        </fieldset>
        {!ninPassed && (
          <p className="text-xs text-gray-600">Complete NIN step first.</p>
        )}
      </section>

      {/* Completion */}
      {allDone && (
        <section className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 p-4">
          <p className="font-medium">Verification complete ✅</p>
          <div className="flex flex-col gap-2 text-sm">
            <a href="/discover" className="underline">Continue to Discover</a>
            <a href="/profile" className="underline">Complete your profile</a>
            <a href="/safety" className="underline">Open Safety tools</a>
          </div>
        </section>
      )}
    </main>
  );
}
