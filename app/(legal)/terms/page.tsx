export default function TermsPage() {
  return (
    <main className="px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">Terms of Service</h1>
        <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2">
          <li>Users must be 18+ and pass verification before messaging/meeting.</li>
          <li>Hate speech, fraud, and harassment are not tolerated and may lead to account removal.</li>
          <li>Report & block features are provided for user safety; admins review reports.</li>
          <li>Subscriptions are handled by Paystack; see your bank statement for charges.</li>
        </ul>
      </div>
    </main>
  );
}
