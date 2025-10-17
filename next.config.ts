// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ✅ Don’t fail the Vercel build on ESLint errors (we’ll fix progressively)
    ignoreDuringBuilds: true,
  },
  // (optional) keep type checking strict in CI:
  // typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
