import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { siteOrigin } from '@/lib/seo';
import { StoryExperience } from '@/components/stories/experience';
import { SiteHeader } from '@/components/editorial/site-header';
import styles from '@/components/atlas/shell.module.css';
import '../fonts.css';
import '../tokens.css';
import '../styles.css';

type Props = Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations({ locale, namespace: 'UI' });
  return { robots: { index: Boolean(siteOrigin()), follow: true }, title: { default: t('metadataTitle'), template: '%s | GRID ATLAS' }, description: t('metadataDescription') };
}
export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const [t, messages] = await Promise.all([getTranslations({ locale, namespace: 'UI' }), getMessages({ locale })]);
  return <html lang={locale}><head>
    <link rel="preload" href="/fonts/cormorant-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    <link rel="preload" href="/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    {locale === 'uk' && <><link rel="preload" href="/fonts/cormorant-cyrillic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /><link rel="preload" href="/fonts/manrope-cyrillic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /></>}
  </head><body><NextIntlClientProvider locale={locale} messages={messages}>
    <a className="skip-link" href="#content">{t('skip')}</a>
    <SiteHeader locale={locale} />
    <main id="content" tabIndex={-1}>{children}</main>
    <StoryExperience locale={locale} />
    <footer className={styles.footer}><div><strong>GRID ATLAS</strong><p>{t('footer')}</p></div><div><p>{t('dataCredit')}</p><Link href="/sources">{t('sourceLink')} ↗</Link></div></footer>
  </NextIntlClientProvider></body></html>;
}
