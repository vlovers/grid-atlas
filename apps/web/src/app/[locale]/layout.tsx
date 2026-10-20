import type { Metadata } from 'next';
import { Suspense } from 'react';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import LanguageSwitcher from '@/i18n/language-switcher';
import { siteOrigin } from '@/lib/seo';
import { StoryExperience } from '@/components/stories/experience';
import { AtlasNavigation } from '@/components/atlas/navigation';
import styles from '@/components/atlas/shell.module.css';
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
  return <html lang={locale}><body><NextIntlClientProvider locale={locale} messages={messages}>
    <a className="skip-link" href="#content">{t('skip')}</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><strong>GRID<span>ATLAS</span></strong><span>{locale === 'uk' ? 'ІСТОРІЯ / ЗВ’ЯЗКИ' : 'HISTORY / CONNECTED'}</span></Link>
      <AtlasNavigation locale={locale} label={t('mainNavigation')} items={[
        { href: '/seasons', label: t('seasons') }, { href: '/drivers', label: t('driversTitle') },
        { href: '/constructors', label: t('constructorsTitle') }, { href: '/circuits', label: t('circuitsTitle') },
        { href: '/time-machine', label: t('timeMachineNav') }, { href: '/lineage', label: t('lineageTitle') },
      ]} />
      <Suspense><LanguageSwitcher /></Suspense>
    </header>
    <main id="content" tabIndex={-1}>{children}</main>
    <StoryExperience locale={locale} />
    <footer className={styles.footer}><div><strong>GRID ATLAS</strong><p>{t('footer')}</p></div><div><p>{t('dataCredit')}</p><Link href="/sources">{t('sourceLink')} ↗</Link></div></footer>
  </NextIntlClientProvider></body></html>;
}
