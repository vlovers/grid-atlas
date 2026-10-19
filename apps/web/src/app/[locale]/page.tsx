import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { getLocale } from 'next-intl/server';
import { routeMetadata } from '@/lib/seo';
export const generateMetadata = async () => routeMetadata(await getLocale(), '/');

export default function Home() {
  const t = useTranslations('UI');
  return <><section className="hero"><p className="eyebrow">{t('homeEyebrow')}</p><h1><em>{t('homeTitle')}</em><br/>{t('homeSubtitle')}</h1>
    <p className="lead">{t('homeLead')}</p><div className="actions">
      <Link className="primary" href="/seasons">{t('exploreSeasons')} ↗</Link><Link className="secondary" href="/drivers">{t('findDriver')} →</Link>
      <Link className="secondary" href="/constructors">{t('findConstructor')} →</Link><Link className="secondary" href="/circuits">{t('exploreCircuits')} →</Link>
    </div></section><section className="columns">
      <article><span className="index">01 / {t('seasons')}</span><h2><Link href="/seasons">{t('seasonBySeason')} ↗</Link></h2><p>{t('homeSeasons')}</p></article>
      <article><span className="index">02 / {t('lineageTitle')}</span><h2><Link href="/lineage">{t('lineageTitle')} ↗</Link></h2><p>{t('homeLineage')}</p></article>
      <article><span className="index">03 / {t('source')}</span><h2><Link href="/sources">{t('archiveSources')} ↗</Link></h2><p>{t('homeSources')}</p></article>
    </section></>;
}
