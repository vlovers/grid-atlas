import type { Metadata } from 'next';

/** Explicit deployment origin; never derive canonical URLs from a request Host. */
export function siteOrigin(value = process.env.SITE_URL): string | undefined {
  if (!value) return undefined;
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must be an absolute HTTP(S) origin without credentials, path, query or fragment.');
  }
  return url.origin;
}

export function localizedUrl(origin: string, locale: string, path: string): string {
  if (!['uk', 'en'].includes(locale) || !/^\/(?!\/)/.test(path) || /[\\#]/.test(path)) {
    throw new Error('Invalid localized canonical path');
  }
  const url = new URL(path, origin);
  const pathname = url.pathname.replace(/\/+$/, '');
  // Pagination changes the visible records; tracking/search parameters do not
  // belong in canonical archive URLs.
  const page = url.searchParams.get('page');
  const paginated = /^(\/(drivers|constructors|circuits)|\/circuits\/[1-9][0-9]*)$/.test(pathname);
  const query = paginated && page && /^[1-9][0-9]*$/.test(page) && Number(page) > 1 && Number(page) <= 1001
    ? `?page=${Number(page)}` : '';
  return `${origin}/${locale}${pathname}${query}`;
}

export function routeMetadata(locale: string, path: string, noindex = false): Metadata {
  const origin = siteOrigin();
  return {
    robots: { index: Boolean(origin) && !noindex, follow: true },
    ...(origin ? { alternates: {
      canonical: localizedUrl(origin, locale, path),
      languages: {
        uk: localizedUrl(origin, 'uk', path),
        en: localizedUrl(origin, 'en', path),
        'x-default': localizedUrl(origin, 'uk', path),
      },
    } } : {}),
  };
}

export type Crumb = { name: string; path: string };

export function pageStructuredData(origin: string, locale: string, crumbs: Crumb[], description: string) {
  const current = crumbs.at(-1)!;
  const url = localizedUrl(origin, locale, current.path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': url, url, name: current.name, description, inLanguage: locale,
        breadcrumb: { '@id': `${url}#breadcrumb` } },
      { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: crumbs.map((crumb, index) => ({
        '@type': 'ListItem', position: index + 1, name: crumb.name, item: localizedUrl(origin, locale, crumb.path),
      })) },
    ],
  };
}

/** Prevent imported names from terminating an inline script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
