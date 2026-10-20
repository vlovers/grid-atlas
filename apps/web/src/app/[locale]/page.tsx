import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { routeMetadata } from '@/lib/seo';
import styles from './home.module.css';

export const generateMetadata = async () => routeMetadata(await getLocale(), '/');

export default function Home() {
  const t = useTranslations('UI');
  return <div className={styles.home}>
    <section className={styles.masthead} aria-labelledby="home-title">
      <p className={styles.eyebrow}>{t('homeEyebrow')} / GRID ATLAS</p>
      <h1 id="home-title"><em>{t('homeTitle')}</em><br />{t('homeSubtitle')}</h1>
      <p className={styles.lead}>{t('homeLead')}</p>
      <div className={styles.actions}>
        <Link href="/seasons">{t('exploreSeasons')} ↗</Link>
        <Link href="/drivers">{t('findDriver')} →</Link>
        <Link href="/time-machine">{t('timeMachineNav')} →</Link>
      </div>
    </section>
    <section aria-labelledby="home-discover-title">
      <div className={styles.sectionHead}>
        <div><span className={styles.eyebrow}>GRID ATLAS / 01—03</span><h2 id="home-discover-title">{t('seasonBySeason')}</h2></div>
        <p>{t('homeSeasons')}</p>
      </div>
      <div className={styles.grid}>
        <article className={styles.tile}><small>01 / {t('seasons')}</small><h3><Link href="/seasons">{t('seasonBySeason')}</Link></h3><p>{t('homeSeasons')}</p><span className={styles.arrow} aria-hidden="true">↗</span></article>
        <article className={styles.tile}><small>02 / {t('lineageTitle')}</small><h3><Link href="/lineage">{t('lineageTitle')}</Link></h3><p>{t('homeLineage')}</p><span className={styles.arrow} aria-hidden="true">↗</span></article>
        <article className={styles.tile}><small>03 / {t('source')}</small><h3><Link href="/sources">{t('archiveSources')}</Link></h3><p>{t('homeSources')}</p><span className={styles.arrow} aria-hidden="true">↗</span></article>
      </div>
      <nav className={styles.bottom} aria-label={t('mainNavigation')}>
        <Link href="/constructors">{t('findConstructor')} <span aria-hidden="true">↗</span></Link>
        <Link href="/circuits">{t('exploreCircuits')} <span aria-hidden="true">↗</span></Link>
      </nav>
    </section>
  </div>;
}
