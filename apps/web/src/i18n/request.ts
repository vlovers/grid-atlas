import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

const messages = {
  uk: () => import('../../messages/uk.json').then(module => module.default),
  en: () => import('../../messages/en.json').then(module => module.default),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: await messages[locale](), timeZone: 'UTC' };
});
