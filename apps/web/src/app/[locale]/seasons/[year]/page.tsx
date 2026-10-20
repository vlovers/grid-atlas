import { StoryHeader } from '@/components/stories/story-header';
import { storyCopy } from '@/components/stories/copy';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { getData, type Race } from '@/lib/api';

type Lineup = { constructor_id: string; constructor_name: string; driver_id: string; driver_name: string; races: number; wins: number };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const t = await getTranslations('UI');
  const { year } = await params;
  return { title: t('seasonTitle', { year }) };
}

export default async function SeasonPage({ params }: { params: Promise<{ year: string }> }) {
  const t = await getTranslations('UI');
  const { year } = await params;
  if (!/^[0-9]{4}$/.test(year) || Number(year) < 1950 || Number(year) > 2200) notFound();
  await getData<{ year: number }>(`/api/seasons/${year}`);
  const [races, lineups] = await Promise.all([
    getData<Race>(`/api/seasons/${year}/races?limit=100`),
    getData<Lineup>(`/api/seasons/${year}/lineups`),
  ]);
  const locale = await getLocale() as 'uk' | 'en';
  const teams = new Map<string, { id: string; name: string; drivers: Lineup[] }>();
  for (const row of lineups) {
    if (!teams.has(row.constructor_id)) teams.set(row.constructor_id, { id: row.constructor_id, name: row.constructor_name, drivers: [] });
    teams.get(row.constructor_id)!.drivers.push(row);
  }
  return <section className="page">
    <StoryHeader title={t('seasonTitle', { year })} eyebrow={storyCopy[locale].seasonHeader} locale={locale} kind="grid" marker={year} lead={t('seasonLead')} />
    <h2>{t('grandsPrix')}</h2>
    {races.length === 0 ? <p>{t('noRaces')}</p> : <div className="records">{races.map(r=>
      <Link key={r.id} className="record" href={`/races/${r.id}`}><span className="position">{String(r.round).padStart(2,'0')}</span><span><strong>{r.official_name}</strong><small>{r.circuit_name || t('unknownCircuit')}{r.race_date ? ' · '+r.race_date : ''}</small></span><span aria-hidden="true">↗</span></Link>
    )}</div>}
    <h2>{t('lineups')}</h2>
    <p>{t('lineupsLead')}</p>
    {teams.size ? <div className="lineup-grid">{Array.from(teams.values()).map(team=>
      <article className="lineup-team" key={team.id}>
        <h3><Link href={`/constructors/${team.id}`}>{team.name} ↗</Link></h3>
        <ul>{team.drivers.map(driver=><li key={driver.driver_id}>
          <Link href={`/drivers/${driver.driver_id}`}>{driver.driver_name}</Link>
          <span>{t('raceWins', { races: driver.races, wins: driver.wins })}</span>
        </li>)}</ul>
      </article>
    )}</div> : <p>{t('noLineups')}</p>}
    <Link className="back" href="/seasons">← {t('allSeasons')}</Link>
  </section>;
}
