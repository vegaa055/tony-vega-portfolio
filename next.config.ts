import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages are rendered on the server and cached with `use cache`; admin saves
  // refresh the affected pages through cache tags. See docs/PLAN.md.
  cacheComponents: true,
  // Type-check every <Link href> against the routes that actually exist.
  typedRoutes: true,
  turbopack: {
    // Pin the project root. Without this, a package-lock.json in a parent
    // folder can make Next.js guess the wrong root.
    root: path.join(__dirname),
  },
};

export default nextConfig;
