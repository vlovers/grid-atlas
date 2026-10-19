import type { MetadataRoute } from 'next';
import { getData } from '@/lib/api';
import { localizedUrl, siteOrigin } from '@/lib/seo';
import { sitemapPaths } from '@/lib/sitemap';
import { routing } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  if (!origin) return [];
  const paths = await sitemapPaths(path => getData(path));
  return paths.flatMap(path => routing.locales.map(locale => ({
    url: localizedUrl(origin, locale, path),
    alternates: { languages: Object.fromEntries(routing.locales.map(language => [language, localizedUrl(origin, language, path)])) },
  })));
}
