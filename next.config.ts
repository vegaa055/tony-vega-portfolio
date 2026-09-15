import path from "node:path";

import type { NextConfig } from "next";

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
  turbopack: {
    // Pin the project root. Without this, a package-lock.json in a parent
    // folder can make Next.js guess the wrong root.
    root: path.join(__dirname),
  },
};

export default nextConfig;
