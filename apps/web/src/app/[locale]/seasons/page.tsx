import { StoryHeader } from '@/components/stories/story-header';
import { storyCopy } from '@/components/stories/copy';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getData, type Season } from '@/lib/api';
import { localizedMetadata } from '@/i18n/metadata';
export const dynamic = 'force-dynamic';
export const generateMetadata = () => localizedMetadata('seasonsTitle');
export default async function Seasons() {
  const t = await getTranslations('UI');
  const locale = await getLocale() as 'uk' | 'en';
  const seasons = await getData<Season>('/api/seasons');
  return <section className="page"><StoryHeader title={t('seasonsTitle')} eyebrow={storyCopy[locale].eras} locale={locale} kind="grid" marker={seasons.length ? Math.min(...seasons.map(row => row.year)) : undefined} lead={t('seasonsLead')} />
    {seasons.length ? <div className="year-grid">{seasons.map(season => <Link className="year" key={season.year} href={`/seasons/${season.year}`}><strong>{season.year}</strong><span>{t('viewRaces')} ↗</span></Link>)}</div> : <p>{t('noSeasons')}</p>}
  </section>;
}
