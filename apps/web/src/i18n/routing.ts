import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['uk', 'en'],
  defaultLocale: 'uk',
  localePrefix: 'always',
  localeDetection: false,
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
