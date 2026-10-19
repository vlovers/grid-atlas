import type { Metadata } from 'next';
import { Suspense } from 'react';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '@/i18n/language-switcher';
import { siteOrigin } from '@/lib/seo';
import styles from '@/i18n/language-switcher.module.css';
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
  return <html lang={locale}><body><NextIntlClientProvider locale={locale} messages={messages}>
    <a className="skip-link" href="#content">{t('skip')}</a>
    <header className={`topbar ${styles.header}`}>
      <Link href="/" className="logo">GRID<span>ATLAS</span></Link>
      <nav className={styles.navigation} aria-label={t('mainNavigation')}>
        <Link href="/seasons">{t('seasons')}</Link><Link href="/drivers">{t('driversTitle')}</Link>
        <Link href="/constructors">{t('constructorsTitle')}</Link><Link href="/circuits">{t('circuitsTitle')}</Link>
        <Link href="/time-machine">{t('timeMachineNav')}</Link><Link href="/lineage">{t('lineageTitle')}</Link>
      </nav>
      <Suspense><LanguageSwitcher /></Suspense>
    </header>
    <main id="content" tabIndex={-1}>{children}</main>
    <footer>GRID ATLAS · {t('footer')} · {t('dataCredit')} · <Link href="/sources">{t('sourceLink')} ↗</Link></footer>
  </NextIntlClientProvider></body></html>;
}
