import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getData, type Season } from '@/lib/api';
import { localizedMetadata } from '@/i18n/metadata';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => localizedMetadata('seasonsTitle');
export default async function Seasons() {
  const t = await getTranslations('UI');
  const seasons = await getData<Season>('/api/seasons');
  return <section className="page"><p className="eyebrow">{t('archive')} / {t('seasons')}</p><h1>{t('seasonsTitle')}</h1><p className="lead">{t('seasonsLead')}</p>
    {seasons.length ? <div className="year-grid">{seasons.map(season => <Link className="year" key={season.year} href={`/seasons/${season.year}`}><strong>{season.year}</strong><span>{t('viewRaces')} ↗</span></Link>)}</div> : <p>{t('noSeasons')}</p>}
  </section>;
}
