import { ChampionshipTable, type ChampionshipRow } from '@/components/championship-table';
import { EditorialHero, EditorialTabs, SourceAttribution } from '@/components/editorial/primitives';
import { SeasonStories } from '@/components/editorial/season-stories';
import styles from './season.module.css';
import { archiveCopy } from '@/components/editorial/archive-copy';
import archiveStyles from '@/components/editorial/archive.module.css';
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
  const participatingDrivers = new Set(lineups.map(driver => driver.driver_id)).size;
  const raceCalendar = [...races].sort((a,b) => a.round-b.round);
  const a = archiveCopy[locale];
  const uk = locale === 'uk';
  const provisional = Number(year) >= 2026 || driverStandings.some(row => row.classification_status === 'provisional');
  const leaders = driverStandings.slice(0, 3);
  return <section className={`page ${archiveStyles.page} ${styles.season}`} data-testid="season-dossier">
    <EditorialHero title={t('seasonTitle', { year })} eyebrow={storyCopy[locale].seasonHeader} lead={t('seasonLead')}
      media={<div className={styles.cover} data-testid="season-cover"><span className={styles.coverYear}>{year}</span><h2>{provisional ? (uk ? 'Попередній залік' : 'Provisional standings') : (uk ? 'Підсумки чемпіонату' : 'Championship results')}</h2>
        {leaders.length ? <ol>{leaders.map(row => <li key={row.position_display_order}><span>{row.position_text}</span>{row.entity_id ? <Link href={`/drivers/${row.entity_id}`}>{row.entity_name}</Link> : <span>{row.entity_name ?? '—'}</span>}<strong>{row.championship_points}</strong></li>)}</ol> : <p>{uk ? 'Заліку чемпіонату для цього сезону немає.' : 'Championship standings are unavailable for this season.'}</p>}
        <p>{uk ? 'Очки чемпіонату · F1DB' : 'Championship points · F1DB'}</p><a href="#season-classifications">{uk ? 'Повний залік' : 'Full standings'} ↓</a></div>}
      actions={<><a href="#season-calendar">{a.calendar} ↓</a><Link href="/seasons">{a.decade} ↗</Link></>}
      statistics={[{ label: t('grandsPrix'), value: races.length }, { label: t('driversTitle'), value: participatingDrivers }, { label: t('constructorsTitle'), value: teams.size }]} />
    <SourceAttribution locale={locale} />
    <EditorialTabs label={a.connections} items={[{ id: 'season-calendar', label: a.calendar }, { id: 'season-classifications', label: a.results }, { id: 'season-field', label: a.field }]} />
    {provisional && <p className={styles.provisional} role="note">{uk ? 'Цей сезон у випуску F1DB ще не завершено. Залік попередній; календар може містити гонки без результатів.' : 'This season is incomplete in the F1DB release. Standings are provisional; the calendar may include races without results.'}</p>}
    <SeasonStories year={Number(year)} locale={locale} />
    <section id="season-calendar" data-testid="season-calendar" tabIndex={-1} aria-labelledby="season-calendar-title">
      <h2 id="season-calendar-title">{uk ? 'Календар Гран-прі' : 'Grand Prix calendar'}</h2>
      {races.length === 0 ? <p>{t('noRaces')}</p> : <ol className={styles.calendar}>{raceCalendar.map(race => <li key={race.id}><span className={styles.round}>{String(race.round).padStart(2, '0')}</span><div><h3><Link href={`/races/${race.id}`}>{race.official_name} ↗</Link></h3><p>{race.circuit_id ? <Link href={`/circuits/${race.circuit_id}`}>{race.circuit_name ?? t('unknownCircuit')}</Link> : t('unknownCircuit')}{race.race_date && <> · <time dateTime={race.race_date}>{race.race_date}</time></>}</p></div></li>)}</ol>}
    </section>
    <section id="season-classifications" tabIndex={-1} aria-label={a.results}>

    <ChampionshipTable rows={driverStandings} locale={locale} kind="drivers" scope="season" />
    <ChampionshipTable rows={constructorStandings} locale={locale} kind="constructors" scope="season" />
    </section><section id="season-field" tabIndex={-1} aria-label={a.field}>
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
    </section>
  </section>;
}
