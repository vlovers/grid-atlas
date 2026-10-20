'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from './navigation';
import styles from './language-switcher.module.css';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations('Navigation');
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const href = pathname + (search ? `?${search}` : '');
  return <nav className={styles.switcher} aria-label={t('language')}>
    <Link href={href} locale="uk" aria-label="УКР — Українська" title="Українська" lang="uk" hrefLang="uk" aria-current={locale === 'uk' ? 'page' : undefined}>УКР</Link>
    <Link href={href} locale="en" aria-label="EN — English" title="English" lang="en" hrefLang="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</Link>
  </nav>;
}
