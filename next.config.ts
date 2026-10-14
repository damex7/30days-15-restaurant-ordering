import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components and Partial Prefetching are the defaults for new apps in
  // Next.js 16.4. Under this model nothing is cached unless we say so
  // ('use cache' in lib/data.ts), and anything that reads the request
  // (cookies, searchParams) or the clock must sit inside <Suspense>. Pages
  // then get a static shell with dynamic "holes" streamed into it.
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // Pin the project root: there is an unrelated package-lock.json higher up
    // in the home folder that Turbopack would otherwise consider.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
