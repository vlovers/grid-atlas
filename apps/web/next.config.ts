import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
// Preserve the incoming origin when Next 15 handles locale-prefix redirects.
const nextConfig: NextConfig = {
  reactStrictMode: true, skipMiddlewareUrlNormalize: true,
  // Production verification must not share artifacts with a running dev server.
  distDir: process.env.GRID_ATLAS_NEXT_DIST_DIR || '.next',
};
export default createNextIntlPlugin()(nextConfig);
