import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return origin ? {
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: `${origin}/sitemap.xml`,
  } : { rules: { userAgent: '*', disallow: '/' } };
}
