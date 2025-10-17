"use client";
import { useState } from "react";

export default function Safety() {
  const [partner, setPartner] = useState("");
  const [start, setStart] = useState("");
  const [planId, setPlanId] = useState("");

  const plan = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/safety/plan", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partner_user_id: partner, start_time: start }) });
    const j = await r.json(); alert(r.ok ? "Plan created" : j.error);
  };

  const check = async (kind: string) => {
    const r = await fetch("/api/safety/checkin", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId, kind }) });
    const j = await r.json(); alert(r.ok ? "Check-in: " + kind : j.error);
  };

  const panic = async () => {
    const r = await fetch("/api/safety/panic", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId }) });
    const j = await r.json(); alert(r.ok ? "PANIC sent" : j.error);
  };

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Safety Center</h1>

      <form onSubmit={plan} className="space-y-2">
        <input className="w-full border rounded p-2" placeholder="Partner user_id" value={partner} onChange={e=>setPartner(e.target.value)} required/>
        <input className="w-full border rounded p-2" type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} required/>
        <button className="w-full rounded bg-black text-white py-2">Plan a meeting</button>
      </form>

      <div className="space-y-2">
        <input className="w-full border rounded p-2" placeholder="plan_id" value={planId} onChange={e=>setPlanId(e.target.value)}/>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={()=>check("on_the_way")} className="border rounded py-2">On the way</button>
          <button onClick={()=>check("arrived")} className="border rounded py-2">Arrived</button>
          <button onClick={()=>check("safe")} className="border rounded py-2">I’m safe</button>
          <button onClick={()=>check("cancel")} className="border rounded py-2">Cancel</button>
        </div>
        <button onClick={panic} className="w-full rounded bg-red-600 text-white py-2">PANIC</button>
      </div>
    </main>
  );
}
