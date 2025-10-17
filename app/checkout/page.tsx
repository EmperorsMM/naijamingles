"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function CheckoutPage() {
  const supabase = createClientComponentClient();

  async function pay() {
    // ⬇️ Dynamically import in the browser to avoid "window is not defined"
    const { default: PaystackPop } = await import("@paystack/inline-js");

    const { data } = await supabase.auth.getUser();
    const email = data.user?.email || "testuser@example.com";
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;
    const paystack = new PaystackPop();

    paystack.newTransaction({
      key: publicKey,
      email,
      amount: 500000, // ₦5,000.00 in kobo
      metadata: {
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: "NG ₦5,000 Monthly" },
        ],
      },
      onSuccess: () => alert("Payment successful (test)!"),
      onCancel: () => alert("Payment cancelled."),
      onError: () => alert("Payment error. Check console."),
    });
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Subscribe — ₦5,000/month</h1>
      <button onClick={pay} className="px-4 py-2 rounded bg-emerald-600 text-white">
        Pay ₦5,000 (Test)
      </button>
    </main>
  );
}
