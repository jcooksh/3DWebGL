/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export — mirrors hirotos.com: `next build` emits a static `out/`
  // dir you drop behind nginx/any CDN. No server runtime, no Vercel required.
  output: 'export',

  // Static export can't optimize images at request time.
  images: { unoptimized: true },

  // Three.js ships untranspiled ESM; let Next transpile it for the bundler.
  transpilePackages: ['three'],

  reactStrictMode: true,
};

export default nextConfig;
