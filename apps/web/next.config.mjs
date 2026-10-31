// Static export: no Node server, so the same build can sit on any CDN and, later, inside Capacitor.
//
// Build-time switches (all read from the environment, never from the browser):
//   TESTER_MODE=true   private tester build: banner on every screen, display floor, noindex
//   FEEDBACK_URL       link for the "Send feedback" button (a Google Form)
//   WAITLIST_URL       external early-access form (hidden in tester mode)
// scripts/verify-protocol.mjs (run before `next build`) enforces the release gate.

const testerMode = process.env.TESTER_MODE === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_TESTER_MODE: String(testerMode),
    NEXT_PUBLIC_FEEDBACK_URL: process.env.FEEDBACK_URL ?? '',
    NEXT_PUBLIC_WAITLIST_URL: process.env.WAITLIST_URL ?? '',
  },
};

export default nextConfig;
