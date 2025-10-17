"use client";

import { useEffect, useState } from "react";

export default function ActionsClient({ targetUserId }: { targetUserId: string }) {
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState<boolean | null>(null); // null = unknown

  // fetch current block status
  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/block?user_id=${encodeURIComponent(targetUserId)}`);
      const j = await r.json().catch(() => ({}));
      if (r.ok) setBlocked(!!j.blocked);
      else setBlocked(false);
    })();
  }, [targetUserId]);

  async function toggleBlock() {
    if (blocked === null) return;
    const action = blocked ? "unblock" : "block";
    if (!blocked && !confirm("Block this user? You will no longer see each other.")) return;

    setBusy(true);
    try {
      const r = await fetch("/api/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: targetUserId, action }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        alert(j?.error || "Failed");
        return;
      }
      setBlocked(!blocked);
      if (action === "block") {
        alert("User blocked");
        window.location.href = "/discover";
      } else {
        alert("User unblocked");
      }
    } finally {
      setBusy(false);
    }
  }

  async function report() {
    const reason = prompt("Reason for report? (e.g., harassment, scam)") || "";
    const details = prompt("Any details?") || "";
    if (!reason.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: targetUserId, reason, details }),
      });
      const j = await r.json().catch(() => ({}));
      alert(r.ok ? "Report submitted" : j?.error || "Failed to report");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="font-medium">Safety</h2>
      <div className="flex gap-2">
        <button
          onClick={toggleBlock}
          disabled={busy || blocked === null}
          className="px-3 py-2 rounded border text-sm"
        >
          {blocked ? "Unblock user" : "Block user"}
        </button>
        <button
          onClick={report}
          disabled={busy}
          className="px-3 py-2 rounded border text-sm"
        >
          Report user
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Blocking hides you from each other. Reports go to admins for review.
      </p>
    </section>
  );
}
