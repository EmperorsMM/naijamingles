"use client";

import { useState } from "react";

export default function ActionsClient({
  type,
  id,
  currentStatus,
}: {
  type: "panic" | "report";
  id: string;
  currentStatus?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function resolvePanic() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/panic/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json().catch(() => ({}));
      alert(r.ok ? "Panic resolved" : j?.error || "Failed");
      if (r.ok) location.reload();
    } finally {
      setBusy(false);
    }
  }

  async function setReportStatus(status: "open" | "reviewing" | "resolved") {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/report/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const j = await r.json().catch(() => ({}));
      alert(r.ok ? `Report → ${status}` : j?.error || "Failed");
      if (r.ok) location.reload();
    } finally {
      setBusy(false);
    }
  }

  if (type === "panic") {
    return (
      <div className="mt-2">
        <button
          onClick={resolvePanic}
          disabled={busy}
          className="px-3 py-1 text-xs rounded border"
        >
          Mark resolved
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={() => setReportStatus("open")}
        disabled={busy || currentStatus === "open"}
        className="px-3 py-1 text-xs rounded border"
      >
        Open
      </button>
      <button
        onClick={() => setReportStatus("reviewing")}
        disabled={busy || currentStatus === "reviewing"}
        className="px-3 py-1 text-xs rounded border"
      >
        Reviewing
      </button>
      <button
        onClick={() => setReportStatus("resolved")}
        disabled={busy || currentStatus === "resolved"}
        className="px-3 py-1 text-xs rounded border"
      >
        Resolved
      </button>
    </div>
  );
}
