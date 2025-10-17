import { redirect } from "next/navigation";
import { getActiveSubscription } from "@/lib/subscriptions";

export default async function MembersPage() {
  const { active } = await getActiveSubscription();
  if (!active) redirect("/checkout");

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Members Area</h1>
      <p className="text-gray-700">Only paid subscribers can see this.</p>
    </main>
  );
}
