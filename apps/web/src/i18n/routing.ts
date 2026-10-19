import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['uk', 'en'],
  defaultLocale: 'uk',
  localePrefix: 'always',
  localeDetection: false,
  localeCookie: false,
  // The Metadata API uses SITE_URL for hreflang; avoid request-host Link headers.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];
