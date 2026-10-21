import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData, getPublishedArticle } from '@/lib/api';
import { DriverShowcase } from '@/components/driver/driver-showcase';
import type { DriverProfile, DriverCareer, DriverSeason, DriverTeam, DriverSeasonResult } from '@/components/driver/showcase-model';
import type { MediaAsset } from '@/components/media/registry';
import mediaPublication from '@/components/media/publication.json';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string; locale: string }>; searchParams: Promise<{ season?: string | string[] }> };
function validId(id: string) { return /^[1-9][0-9]*$/.test(id) && Number(id) <= 2147483647; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale: rawLocale } = await params;
  const locale = rawLocale === 'en' ? 'en' : 'uk';
  const t = await getTranslations({ locale, namespace: 'UI' });
  if (!validId(id)) return { title: t('driverMissing') };
  const [profiles, article] = await Promise.all([
    getData<DriverProfile>(`/api/drivers/${id}`),
    getPublishedArticle(id, locale),
  ]);
  const driver = profiles[0];
  if (!driver) return { title: t('driverMissing') };
  // Search previews may quote only text that has passed the public publication gate.
  const approvedSummary = article?.body_markdown
    .replace(/[#*_~`>\[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 155);
  const description = approvedSummary || (locale === 'uk'
    ? `Історичний профіль ${driver.name}: сезони, конструктори, гонки та підтверджені записи результатів в архіві Grid Atlas.`
    : `Historical profile of ${driver.name}: seasons, constructors, races and sourced result records in the Grid Atlas archive.`);
  return { title: article?.title || driver.name, description };
}

export default async function DriverProfilePage({ params, searchParams }: Props) {
  const { id, locale: requestedLocale } = await params;
  if (!validId(id)) notFound();
  const locale = requestedLocale === 'en' ? 'en' : 'uk';
  const [profiles, seasons, teams, careers, article, query] = await Promise.all([
    getData<DriverProfile>(`/api/drivers/${id}`), getData<DriverSeason>(`/api/drivers/${id}/seasons`),
    getData<DriverTeam>(`/api/drivers/${id}/teams`), getData<DriverCareer>(`/api/drivers/${id}/career?locale=${locale}`),
    getPublishedArticle(id, locale), searchParams,
  ]);
  const driver = profiles[0];
  if (!driver) notFound();
  const selectedYear = typeof query.season === 'string' && /^[0-9]{4}$/.test(query.season) ? Number(query.season) : null;
  const defaultYear = seasons.reduce<number | null>((year, season) => year === null || season.year > year ? season.year : year, null);
  const year = selectedYear !== null && seasons.some(season => season.year === selectedYear) ? selectedYear : defaultYear;
  const seasonResults = year === null ? [] : await getData<DriverSeasonResult>(`/api/drivers/${id}/seasons/${year}/results`);
  return <DriverShowcase driver={driver} career={careers[0] ?? null} seasons={seasons} teams={teams}
    article={article} media={mediaPublication.assets as MediaAsset[]} locale={locale}
    selectedSeason={year === null ? undefined : String(year)} seasonResults={seasonResults} />;
}
