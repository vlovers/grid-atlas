import { ChampionshipTable, type ChampionshipRow } from '@/components/championship-table';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData, getPublishedArticle } from '@/lib/api';
import { DriverShowcase } from '@/components/driver/driver-showcase';
import type { DriverProfile, DriverCareer, DriverSeason, DriverTeam, DriverSeasonResult } from '@/components/driver/showcase-model';
import type { MediaAsset } from '@/components/media/registry';
import mediaPublication from '@/components/media/publication.json';
import { IdentityFacts, type IdentityDetails } from '@/components/identity-facts';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string; locale: string }>; searchParams: Promise<{ season?: string | string[] }> };
function validId(id: string) { return /^[1-9][0-9]*$/.test(id) && Number(id) <= 2147483647; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!validId(id)) return { title: t('driverMissing') };
  const profiles = await getData<DriverProfile>(`/api/drivers/${id}`);
  return { title: profiles[0]?.name ?? t('driverMissing') };
}

export default async function DriverProfilePage({ params, searchParams }: Props) {
  const { id, locale: requestedLocale } = await params;
  if (!validId(id)) notFound();
  const locale = requestedLocale === 'en' ? 'en' : 'uk';
  const [profiles, seasons, teams, careers, article, championships, query, identities] = await Promise.all([
    getData<DriverProfile>(`/api/drivers/${id}`), getData<DriverSeason>(`/api/drivers/${id}/seasons`),
    getData<DriverTeam>(`/api/drivers/${id}/teams`), getData<DriverCareer>(`/api/drivers/${id}/career?locale=${locale}`),
    getPublishedArticle(id, locale), getData<ChampionshipRow>(`/api/drivers/${id}/championships`), searchParams, getData<IdentityDetails>(`/api/drivers/${id}/identity`),
  ]);
  const driver = profiles[0];
  if (!driver) notFound();
  const selectedYear = typeof query.season === 'string' && /^[0-9]{4}$/.test(query.season) ? Number(query.season) : null;
  const defaultYear = seasons.reduce<number | null>((year, season) => year === null || season.year > year ? season.year : year, null);
  const year = selectedYear !== null && seasons.some(season => season.year === selectedYear) ? selectedYear : defaultYear;
  const seasonResults = year === null ? [] : await getData<DriverSeasonResult>(`/api/drivers/${id}/seasons/${year}/results`);
  return <><DriverShowcase driver={driver} career={careers[0] ?? null} seasons={seasons} teams={teams}
    identity={<IdentityFacts identity={identities[0]} locale={locale} />}
    article={article} media={mediaPublication.assets as MediaAsset[]} locale={locale}
    selectedSeason={year === null ? undefined : String(year)} seasonResults={seasonResults} />
    <ChampionshipTable rows={championships} locale={locale} kind="drivers" scope="career" /></>;
}
