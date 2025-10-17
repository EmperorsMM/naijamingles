import type { Metadata } from "next";
import "./globals.css";
import SessionBadge from "@/components/SessionBadge";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import Logo from "@/components/Logo";
import Script from "next/script"; // ⬅️ AdSense loader

export const metadata: Metadata = {
  title: "Naijamingles",
  description: "Find and date verified singles in Nigeria",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase.auth.getUser();
  const serverEmail = data.user?.email ?? null;

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {/* Google AdSense (loads once, non-blocking) */}
        <Script
          id="adsense-loader"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7837094299840102"
          crossOrigin="anonymous"
        />

        <nav className="p-3 border-b flex gap-4 text-sm items-center">
          <a href="/" className="flex items-center gap-2">
            <Logo />
          </a>
          <a href="/discover">Discover</a>
          <a href="/safety">Safety</a>
          <a href="/verify">Verify</a>
          <a href="/login">Login</a>
          <SessionBadge initialEmail={serverEmail} />
        </nav>

        {children}

        <footer className="mt-16 border-t">
          <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-600 flex flex-col md:flex-row gap-3 md:gap-6 items-center md:items-start justify-between">
            <div>© {new Date().getFullYear()} Naijamingles</div>
            <nav className="flex gap-4">
              <a className="underline" href="/privacy">Privacy</a>
              <a className="underline" href="/terms">Terms</a>
              <a className="underline" href="/safety">Safety</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
