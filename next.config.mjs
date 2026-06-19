/** @type {import('next').NextConfig} */

// On GitHub Pages the site is served from a sub-path (https://USER.github.io/REPO/),
// so assets must be prefixed with that path. The deploy workflow passes it in via
// BASE_PATH (auto-derived from actions/configure-pages — never hardcoded). Locally
// BASE_PATH is unset, so `npm run dev` / `npm run build` serve from root as normal.
const basePath = process.env.BASE_PATH || '';

const nextConfig = {
  // Static export — `next build` emits a static `out/` for GitHub Pages / any CDN.
  output: 'export',

  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,

  // Static export can't optimize images at request time.
  images: { unoptimized: true },

  // Three.js ships untranspiled ESM; let Next transpile it.
  transpilePackages: ['three'],

  reactStrictMode: true,
};

export default nextConfig;
