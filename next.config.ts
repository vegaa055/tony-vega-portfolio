import path from "node:path";

import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/*
 * Next.js inlines a small bootstrap script and some styles, so scripts and
 * styles have to allow inline code. Per-request nonces would need a proxy
 * running before every request, which this project avoids (see docs/PLAN.md).
 * Everything else is locked down. Development also needs eval and a websocket
 * for Fast Refresh.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.public.blob.vercel-storage.com",
  "font-src 'self'",
  // Images are uploaded from the browser straight to Vercel Blob.
  `connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com${isProduction ? "" : " ws:"}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Two years, the length HSTS preload lists expect. Browsers ignore it on
  // plain http, so local development is unaffected.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // frame-ancestors already covers this, for browsers that read it.
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // The end-to-end tests build into their own folder, so they never replace
  // a regular build made from your real content.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Pages are rendered on the server and cached with `use cache`; admin saves
  // refresh the affected pages through cache tags. See docs/PLAN.md.
  cacheComponents: true,
  // Prefetch one reusable shell per route, and let pages for new slugs (a post
  // published after the last deploy) be cached after their first visit.
  partialPrefetching: true,
  // Type-check every <Link href> against the routes that actually exist.
  typedRoutes: true,
  images: {
    // Images uploaded through the admin in production live in Vercel Blob.
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    // Pin the project root. Without this, a package-lock.json in a parent
    // folder can make Next.js guess the wrong root.
    root: path.join(__dirname),
  },
};

export default nextConfig;
