import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { AtlasNavigation } from '@/components/atlas/navigation';
import LanguageSwitcher from '@/i18n/language-switcher';
import styles from '@/components/atlas/shell.module.css';

export async function SiteHeader({ locale }: { locale: 'uk' | 'en' }) {
  const t = await getTranslations({ locale, namespace: 'UI' });
  return <header className={styles.header} data-testid="site-header">
    <a href={`/${locale}`} className={styles.brand} aria-label="GRID ATLAS">
      <strong>GRID<wbr /><span>ATLAS</span></strong><span>{locale === 'uk' ? 'ІСТОРІЯ В РУСІ' : 'HISTORY LIVES HERE'}</span>
    </a>
    <AtlasNavigation locale={locale} label={t('mainNavigation')} items={[
      { href: '/stories', label: locale === 'uk' ? 'Історії пілотів' : 'Driver stories' },
      { href: '/drivers', label: t('driversTitle') }, { href: '/constructors', label: t('constructorsTitle') },
      { href: '/circuits', label: t('circuitsTitle') }, { href: '/seasons', label: t('seasons') },
      { href: '/atlas', label: locale === 'uk' ? 'Атлас історії' : 'History Atlas' },
      { href: '/time-machine', label: t('timeMachineNav') }, { href: '/lineage', label: t('lineageTitle') },
    ]} />
    <Suspense><LanguageSwitcher /></Suspense>
  </header>;
}
