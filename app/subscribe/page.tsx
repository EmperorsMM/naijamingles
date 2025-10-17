"use client";

import { useEffect, useState } from "react";

export default function Subscribe() {
  const [ref, setRef] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/paystack/init", { method: "POST" });
      const j = await r.json();
      if (r.ok) {
        setRef(j.reference);
        setAuthUrl(j.auth_url ?? null);
      } else {
        alert(j.error || "Failed to initialize payment.");
      }
    })();
  }, []);

  const goPay = () => {
    if (authUrl) window.location.href = authUrl;
    else if (ref) window.location.href = `/api/paystack/redirect?reference=${ref}`;
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Subscribe: ₦5,000 / month</h1>
      <p className="text-sm opacity-70">Unlock discovery and messaging.</p>
      <button onClick={goPay} className="w-full rounded bg-black text-white py-2" disabled={!ref && !authUrl}>
        Pay with Paystack
      </button>
    </main>
  );
}
