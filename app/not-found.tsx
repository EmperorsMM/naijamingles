export default function NotFound() {
  return (
    <main className="px-4 py-16">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-gray-600">Let’s get you back on track.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <a href="/" className="inline-flex items-center justify-center rounded-lg bg-black text-white px-4 py-2">
            Home
          </a>
          <a href="/discover" className="inline-flex items-center justify-center rounded-lg border px-4 py-2">
            Discover
          </a>
          <a href="/safety" className="inline-flex items-center justify-center rounded-lg border px-4 py-2">
            Safety
          </a>
        </div>
      </div>
    </main>
  );
}
