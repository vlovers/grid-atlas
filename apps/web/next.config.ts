import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
// Preserve the incoming origin when Next 15 handles locale-prefix redirects.
const nextConfig: NextConfig = { reactStrictMode: true, skipMiddlewareUrlNormalize: true };
export default createNextIntlPlugin()(nextConfig);
