import { ArchiveRhythm } from '@/components/stories/archive-rhythm';
import { ArchiveJourney } from '@/components/stories/archive-journey';
import { ChampionshipTable, type ChampionshipRow } from '@/components/championship-table';
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
  const [races, lineups, driverStandings, constructorStandings] = await Promise.all([
    getData<Race>(`/api/seasons/${year}/races?limit=100`),
    getData<Lineup>(`/api/seasons/${year}/lineups`),
    getData<ChampionshipRow>(`/api/seasons/${year}/standings/drivers`),
    getData<ChampionshipRow>(`/api/seasons/${year}/standings/constructors`),
  ]);
  const locale = await getLocale() as 'uk' | 'en';
  const teams = new Map<string, { id: string; name: string; drivers: Lineup[] }>();
  for (const row of lineups) {
    if (!teams.has(row.constructor_id)) teams.set(row.constructor_id, { id: row.constructor_id, name: row.constructor_name, drivers: [] });
    teams.get(row.constructor_id)!.drivers.push(row);
  }
  const prominentTeams = [...teams.values()].map(team => ({
    ...team,
    recordedWins: team.drivers.reduce((sum, driver) => sum + driver.wins, 0),
    recordedRaces: Math.max(0, ...team.drivers.map(driver => driver.races)),
  })).sort((a,b) => b.recordedWins - a.recordedWins || a.name.localeCompare(b.name)).slice(0, 5);
  const participatingDrivers = new Set(lineups.map(driver => driver.driver_id)).size;
  const raceCalendar = [...races].sort((a,b) => a.round-b.round);
  return <section className="page">
    <StoryHeader title={t('seasonTitle', { year })} eyebrow={storyCopy[locale].seasonHeader} locale={locale} kind="grid" marker={year} lead={t('seasonLead')} />
    <ArchiveRhythm testId="season-archive-rhythm" locale={locale} title={locale === 'uk' ? 'Календар у деталях' : 'The calendar in detail'} description={locale === 'uk' ? 'Усі раунди сезону з прямими посиланнями на протоколи гонок.' : 'Every recorded round, linked to its race classification.'} entries={raceCalendar.map(race => ({ id: race.id, year: Number(year), label: `R${race.round} · ${race.official_name}`, href: `/races/${race.id}`, detail: race.circuit_name ?? undefined }))} />
    <ArchiveJourney testId="season-visual-journey" locale={locale} title={locale === 'uk' ? 'Маршрут сезону' : 'The season route'} description={locale === 'uk' ? 'Початок, середина та фінал календаря. Вибір за позицією у календарі, без непідтверджених тверджень про драматичність.' : 'Opening, midpoint and final calendar round. Selected by chronology, not invented dramatic significance.'} items={raceCalendar.length ? [raceCalendar[0], ...(raceCalendar.length > 2 ? [raceCalendar[Math.floor((raceCalendar.length - 1) / 2)]] : []), ...(raceCalendar.length > 1 ? [raceCalendar[raceCalendar.length - 1]] : [])].map(entry => ({ id: entry.id, href: `/races/${entry.id}`, year: Number(year), overline: `${locale === 'uk' ? 'Раунд' : 'Round'} ${entry.round}`, title: entry.official_name, detail: entry.circuit_name ?? undefined })) : []} />
    <section aria-labelledby="season-journey" data-testid="season-journey">
      <h2 id="season-journey">{locale === 'uk' ? 'Сезон у трьох етапах' : 'Season in three moments'}</h2>
      <p>{locale === 'uk' ? 'Від початку календаря через середину до фінального зафіксованого етапу. Це точки навігації по архіву, а не редакційний вибір найважливіших подій.' : 'From the opening race through the middle of the calendar to the last recorded round. These are archive navigation points, not editorial claims about the most important moments.'}</p>
      {races.length ? <ol className="records">
        {[races[0], ...(races.length > 2 ? [races[Math.floor((races.length - 1) / 2)]] : []), ...(races.length > 1 ? [races[races.length - 1]] : [])].map((entry, index) =>
          <li className="record" key={entry.id}><span className="position">{String(index + 1).padStart(2, '0')}</span>
            <span><strong><Link href={`/races/${entry.id}`}>{entry.official_name} ↗</Link></strong>
            <small>{locale === 'uk' ? 'Раунд' : 'Round'} {entry.round} · {entry.circuit_name ?? t('unknownCircuit')}</small></span>
          </li>)}
      </ol> : <p>{t('noRaces')}</p>}
      <p>{locale === 'uk' ? 'Результати окремих гонок не дорівнюють офіційним підсумкам чемпіонату через історичні системи нарахування та відкидання очок.' : 'Individual race points cannot be treated as official championship totals because historical scoring and dropped-results rules varied.'}</p>
    </section>
    <section aria-labelledby="season-archive-story" data-testid="season-archive-story">
      <h2 id="season-archive-story">{locale === 'uk' ? 'Портрет сезону за архівом' : 'An archive portrait of the season'}</h2>
      <p>{locale === 'uk'
        ? `Архів сезону ${year} містить ${races.length} етапів календаря, ${teams.size} конструкторів із гоночними результатами та ${participatingDrivers} пілотів із зафіксованими виступами. Це облік участі, а не офіційна кількість заявок на чемпіонат.`
        : `The ${year} archive contains ${races.length} calendar rounds, ${teams.size} constructors with recorded results and ${participatingDrivers} drivers with observed participation. These are result-derived entries, not official full-season registration totals.`}</p>
      {raceCalendar.length > 0 && <p>{locale === 'uk' ? 'Календар відкриває' : 'The recorded calendar opens with'}{' '}
        <Link href={`/races/${raceCalendar[0].id}`}>{raceCalendar[0].official_name}</Link>
        {raceCalendar.length > 1 && <> {locale === 'uk' ? 'і завершує' : 'and closes with'}{' '}
          <Link href={`/races/${raceCalendar[raceCalendar.length - 1].id}`}>{raceCalendar[raceCalendar.length - 1].official_name}</Link></>}.
      </p>}
      <h3>{locale === 'uk' ? 'Конструктори з найбільшою кількістю перемог у результатах' : 'Constructors with the most recorded race-result wins'}</h3>
      {prominentTeams.length ? <ol className="records">{prominentTeams.map(team =>
        <li className="record" key={team.id}>
          <span className="position">{team.recordedWins}</span>
          <span><strong><Link href={`/constructors/${team.id}?season=${year}`}>{team.name} ↗</Link></strong>
          <small>{team.drivers.length} {locale === 'uk' ? 'пілотів у результатах' : 'drivers in results'}</small></span>
        </li>)}</ol> : <p>{t('noLineups')}</p>}
      <p>{locale === 'uk'
        ? 'Перемоги підсумовано за записами пілотів; історичні спільні автомобілі можуть впливати на облік. Цей список не є офіційним заліком Кубка конструкторів або підтвердженням титулу.'
        : 'Wins are summed from driver result aggregates; historical shared drives may affect counting. This is not an official Constructors’ Championship table or a title claim.'}</p>
    </section>
    <ChampionshipTable rows={driverStandings} locale={locale} kind="drivers" scope="season" />
    <ChampionshipTable rows={constructorStandings} locale={locale} kind="constructors" scope="season" />
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
