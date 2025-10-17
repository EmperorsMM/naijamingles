export default function HomePage() {
  return (
    <main>
      {/* HERO */}
      <section className="px-4 pt-12 pb-10 md:pt-20 md:pb-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
              Date verified singles in Nigeria — safely.
            </h1>
            <p className="mt-4 text-gray-600">
              Naijamingles uses ID verification, safety check-ins, and panic alerts so you can focus on genuine connections.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/login" className="inline-flex items-center justify-center rounded-lg bg-black text-white px-4 py-2">
                Get started
              </a>
              <a href="/discover" className="inline-flex items-center justify-center rounded-lg border px-4 py-2">
                Browse (verified only)
              </a>
              <a href="/safety" className="inline-flex items-center justify-center rounded-lg border px-4 py-2">
                Safety Center
              </a>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-gray-500">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Real users. NIN-based identity lock. Panic alerts to trusted contacts.</span>
            </div>
          </div>

          {/* Simple visual (no external images) */}
          <div className="hidden md:block">
            <div className="aspect-[4/3] rounded-2xl border bg-white shadow-sm p-5">
              <div className="grid grid-cols-3 gap-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-gray-100" />
                ))}
              </div>
              <div className="mt-4 h-3 w-1/3 bg-gray-200 rounded" />
              <div className="mt-2 h-3 w-1/5 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PILLARS */}
      <section className="px-4 py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold">Why Naijamingles</h2>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border p-5">
              <div className="text-sm font-medium">Verified identities</div>
              <p className="mt-2 text-sm text-gray-600">
                We lock legal name, gender, and DOB from your NIN verification. Display name & photos remain under your control.
              </p>
            </div>
            <div className="rounded-xl border p-5">
              <div className="text-sm font-medium">Safety by design</div>
              <p className="mt-2 text-sm text-gray-600">
                Plan meetups, check-in with a tap, and alert your trusted contact with one PANIC button.
              </p>
            </div>
            <div className="rounded-xl border p-5">
              <div className="text-sm font-medium">Community standards</div>
              <p className="mt-2 text-sm text-gray-600">
                Report & block features keep bad actors out. Admins resolve reports quickly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold">How it works</h2>
          <ol className="mt-6 grid md:grid-cols-3 gap-6 text-sm">
            <li className="rounded-xl border bg-white p-5">
              <div className="text-gray-500">Step 1</div>
              <div className="font-medium mt-1">Create account & verify</div>
              <p className="mt-2 text-gray-600">Sign in with email, then pass NIN + liveness (we’ll guide you).</p>
            </li>
            <li className="rounded-xl border bg-white p-5">
              <div className="text-gray-500">Step 2</div>
              <div className="font-medium mt-1">Set up your profile</div>
              <p className="mt-2 text-gray-600">Pick a display name, upload photos, and say hello.</p>
            </li>
            <li className="rounded-xl border bg-white p-5">
              <div className="text-gray-500">Step 3</div>
              <div className="font-medium mt-1">Meet safely</div>
              <p className="mt-2 text-gray-600">Plan a meeting, check-in, and keep your trusted contact in the loop.</p>
            </li>
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/login" className="inline-flex items-center justify-center rounded-lg bg-black text-white px-4 py-2">
              Create your account
            </a>
            <a href="/safety" className="inline-flex items-center justify-center rounded-lg border px-4 py-2">
              Explore safety features
            </a>
          </div>
        </div>
      </section>

      {/* TRUST / CTA */}
      <section className="px-4 py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border p-6 md:p-10 bg-gradient-to-br from-gray-50 to-white">
            <h3 className="text-xl md:text-2xl font-semibold">Ready to meet verified singles?</h3>
            <p className="mt-2 text-gray-600">Join free. Verify when you’re ready. Safety tools are included.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/discover" className="inline-flex items-center justify-center rounded-lg bg-black text-white px-4 py-2">
                Browse profiles
              </a>
              <a href="/verify" className="inline-flex items-center justify-center rounded-lg border px-4 py-2">
                Verify now
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
