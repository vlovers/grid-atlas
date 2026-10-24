import { ArchiveHighlights } from '@/components/editorial/archive-highlights';
import { RecordGraphic } from '@/components/editorial/record-graphic';
import { ArchiveTable } from '@/components/editorial/archive-table';
import { MediaCollection } from '@/components/media/collection';
import { ParticipationHistory } from '@/components/participation/history';
import type { Participation } from '@/components/driver/showcase-model';
import { ChampionshipTable, type ChampionshipRow } from '@/components/championship-table';
import { EditorialHero, EditorialMedia, EditorialTabs, SectionHeading, SourceAttribution, StatisticStrip } from '@/components/editorial/primitives';
import { editorialCopy } from '@/components/editorial/copy';
import mediaPublication from '@/components/media/publication.json';
import type { MediaAsset } from '@/components/media/registry';
import styles from './constructor.module.css';
import { storyCopy } from '@/components/stories/copy';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData } from '@/lib/api';
import { IdentityFacts, type IdentityDetails } from '@/components/identity-facts';
export const dynamic = 'force-dynamic';
type Profile = { id: string; name: string; external_id: string; result_entries: number; races: number; seasons: number; first_season: number | null; last_season: number | null; wins: number; podium_finishes: number; driver_points: string | null; points_missing: number };
type Season = { year: number; races: number; wins: number; podium_finishes: number; driver_points: string | null; points_missing: number };
type DriverRoster = { driver_id: string; driver_name: string; races: number; wins: number };
type ConstructorCareer = {
  summary: { races: number; result_entries: number; winning_races: number };
  participation: Participation[];
  milestones: { first_appearance: { race: { id: string; name: string; year: number } } | null;
    first_win: { race: { id: string; name: string; year: number } } | null };
};
type Lineage = { id: string; subject_id: string; subject_name: string; object_id: string; object_name: string; relation_type: string; effective_year: number | null; source_url: string; source_title: string; source_publisher: string; evidence_note: string };
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ season?: string | string[] }> };
const valid = (id: string) => /^[1-9][0-9]*$/.test(id) && Number(id) <= 2147483647;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!valid(id)) return { title: t('constructorMissing') };
  const data = await getData<Profile>(`/api/constructors/${id}`);
  return { title: data[0] ? `${data[0].name} — ${t('constructor')}` : t('constructorMissing') };
}
export default async function ConstructorProfile({ params, searchParams }: Props) {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!valid(id)) notFound();
  const [profiles, seasons, lineage, careers, identities, championships] = await Promise.all([
    getData<Profile>(`/api/constructors/${id}`),
    getData<Season>(`/api/constructors/${id}/seasons`),
    getData<Lineage>(`/api/constructors/${id}/lineage`),
    getData<ConstructorCareer>(`/api/constructors/${id}/career?locale=${(await getLocale()) === 'en' ? 'en' : 'uk'}`),
    getData<IdentityDetails>(`/api/constructors/${id}/identity`),
    getData<ChampionshipRow>(`/api/constructors/${id}/championships`),
  ]);
  const locale = await getLocale() as 'uk' | 'en';
  const team = profiles[0];
  const career = careers[0];
  const driverYears = new Map<string, { id: string; name: string; years: Set<number> }>();
  for (const row of career?.participation ?? []) {
    const prior = driverYears.get(row.related_id);
    if (prior) { prior.years.add(row.year); }
    else driverYears.set(row.related_id, { id: row.related_id, name: row.related_name, years: new Set([row.year]) });
  }
  const drivers = [...driverYears.values()].sort((a,b) => Math.min(...a.years) - Math.min(...b.years) || a.name.localeCompare(b.name));
  if (!team) notFound();
  const query = await searchParams;
  const requestedYear = typeof query.season === 'string' && /^\d{4}$/.test(query.season) ? Number(query.season) : null;
  const selectedSeason = seasons.find(season => season.year === requestedYear) ?? seasons.reduce<Season | undefined>((latest, season) => !latest || season.year > latest.year ? season : latest, undefined);
  const firstRecordedSeason = seasons.reduce<Season | undefined>((earliest, season) => !earliest || season.year < earliest.year ? season : earliest, undefined);
  const roster = selectedSeason ? await getData<DriverRoster>(`/api/constructors/${id}/seasons/${selectedSeason.year}/drivers`) : [];
  const points = (value: string | null, missing: number) => `${value ?? '—'}${missing > 0 ? ` · ${locale === 'uk' ? 'Неповні дані' : 'Incomplete data'} (${missing})` : ''}`;
  const e = editorialCopy[locale];
  const range = team.first_season === null ? '—' : team.first_season === team.last_season ? String(team.first_season) : `${team.first_season}—${team.last_season}`;
  const format = (value: number) => new Intl.NumberFormat(locale).format(value);
  return <section className={`page ${styles.dossier}`} data-testid="constructor-dossier">
    <EditorialHero title={team.name} eyebrow={`${storyCopy[locale].constructorHeader} / ${team.external_id}`}
      context={<><span>{range}</span>{identities[0]?.fields.country && <span>{identities[0].fields.country}</span>}</>}
      lead={e.constructorLead} media={<EditorialMedia assets={mediaPublication.assets as MediaAsset[]} subject={{ type: 'constructor', id: team.external_id }} title={team.name} years={range} locale={locale}><RecordGraphic rows={seasons.map(season => ({ year: season.year, records: season.races, wins: season.wins }))} label={locale === 'uk' ? 'Зафіксовані гонки' : 'Recorded races'} winsLabel={locale === 'uk' ? 'Переможні гонки' : 'Winning races'} locale={locale} /></EditorialMedia>}
      actions={<><a href={selectedSeason ? "#constructor-season" : "#constructor-archive"}>{e.seasons} ↓</a>{firstRecordedSeason && <Link href={`/explorer/constructors/${id}?year=${firstRecordedSeason.year}`}>{e.atlas} ↗</Link>}</>}
      statistics={[{ label: t('seasons'), value: format(team.seasons) }, { label: t('races'), value: format(team.races) }, { label: t('wins'), value: format(team.wins) }, { label: t('driverPodiums'), value: format(team.podium_finishes) }]} scope={e.recordScope} />
    <SourceAttribution locale={locale} />
    <ArchiveHighlights locale={locale} title={locale === 'uk' ? 'Віхи конструктора' : 'Constructor milestones'} description={locale === 'uk' ? 'Перші результати та найуспішніші сезони за архівними протоколами.' : 'Early results and strongest recorded seasons, from the archive.'} items={[
      ...(career?.milestones.first_appearance ? [{ id: 'debut', eyebrow: locale === 'uk' ? 'ПЕРША УЧАСТЬ' : 'FIRST APPEARANCE', title: career.milestones.first_appearance.race.name, detail: String(career.milestones.first_appearance.race.year), href: `/${locale}/races/${career.milestones.first_appearance.race.id}` }] : []),
      ...(career?.milestones.first_win ? [{ id: 'first-win', eyebrow: locale === 'uk' ? 'ПЕРША ПЕРЕМОГА' : 'FIRST WIN', title: career.milestones.first_win.race.name, detail: String(career.milestones.first_win.race.year), href: `/${locale}/races/${career.milestones.first_win.race.id}` }] : []),
      ...[...seasons].sort((a,b) => b.wins-a.wins || a.year-b.year).slice(0,2).map((season,i) => ({ id: `season-${season.year}`, eyebrow: i === 0 ? (locale === 'uk' ? 'НАЙБІЛЬШЕ ПЕРЕМОГ' : 'MOST WINS') : (locale === 'uk' ? 'ЩЕ ОДИН СЕЗОН' : 'ANOTHER SEASON'), title: String(season.year), detail: `${season.wins} ${locale === 'uk' ? 'переможних гонок' : 'winning races'} · ${season.races} ${locale === 'uk' ? 'гонок' : 'races'}`, href: `/${locale}/constructors/${id}?season=${season.year}#constructor-season` }))
    ]} />
    <EditorialTabs label={e.contents} items={[{ id: 'constructor-archive-portrait', label: e.overview }, { id: 'constructor-key-eras', label: e.seasons }, ...(selectedSeason ? [{ id: 'constructor-season', label: e.drivers }] : []), { id: 'constructor-classifications', label: e.classifications }, { id: 'constructor-archive', label: e.archive }]} />
    <section className={styles.portrait} aria-labelledby="constructor-archive-portrait" data-testid="constructor-archive-portrait">
      <SectionHeading kicker={e.overview} id="constructor-archive-portrait" title={locale === 'uk' ? 'Історія конструктора за сезонами' : 'Constructor history across seasons'} />
      <p>{locale === 'uk'
        ? `В історичній базі конструктор ${team.name} має ${team.seasons} сезонів із зафіксованими результатами, ${team.races} різних гонок і ${drivers.length} пілотів у протоколах. Це не доказ безперервної юридичної історії команди.`
        : `In the historical database, constructor ${team.name} has ${team.seasons} seasons with recorded results, ${team.races} distinct races and ${drivers.length} drivers in classifications. This does not establish an uninterrupted legal team history.`}</p>
      {firstRecordedSeason && selectedSeason && <p>{locale === 'uk' ? 'Почніть із' : 'Start with'}{' '}
        <Link href={`/constructors/${team.id}?season=${firstRecordedSeason.year}`}>{firstRecordedSeason.year}</Link>
        {firstRecordedSeason.year !== selectedSeason.year && <> {locale === 'uk' ? 'або дослідіть' : 'or explore'}{' '}
          <Link href={`/constructors/${team.id}?season=${selectedSeason.year}`}>{selectedSeason.year}</Link></>}.
      </p>}
      <h3>{locale === 'uk' ? 'Найбільш результативні пілоти за переможними записами' : 'Drivers with the most recorded winning results'}</h3>
      {drivers.length ? <ol className="records">{[...drivers].map(driver => {
        const rows = career?.participation.filter(row => row.related_id === driver.id) ?? [];
        return { ...driver, winningRaces: rows.reduce((sum, row) => sum + row.winning_races, 0) };
      }).sort((a,b) => b.winningRaces-a.winningRaces || a.name.localeCompare(b.name)).slice(0,5).map(driver =>
        <li className="record" key={driver.id}><span className="position">{driver.winningRaces}</span>
          <span><strong><Link href={`/drivers/${driver.id}`}>{driver.name} ↗</Link></strong>
            <small>{[...driver.years].sort((a,b) => a-b).join(' · ')}</small></span></li>)}</ol>
        : <p>{locale === 'uk' ? 'Немає зафіксованих пілотів.' : 'No recorded drivers.'}</p>}
      <p>{locale === 'uk'
        ? 'Підсумок спирається лише на протоколи перегонів. Спільні автомобілі та історичні правила можуть відрізнятися від сучасного визначення перемоги; офіційні титули не виводяться.'
        : 'This summary uses race-result rows only. Shared cars and historical rules may differ from modern win definitions; official titles are not inferred.'}</p>
    </section>
    {selectedSeason && <section id="constructor-season" tabIndex={-1} className={styles.selectedSeason} aria-label={locale === 'uk' ? 'Показники команди за сезон' : 'Constructor season results'}>
      <h2>{locale === 'uk' ? 'Сезон команди' : 'Team season'}</h2>
      <form method="get" action={`/${locale}/constructors/${id}#constructor-season`} className={styles.seasonPicker}>
        <label htmlFor="constructor-season-select">{e.seasonLabel}</label>
        <select id="constructor-season-select" name="season" defaultValue={selectedSeason.year}>{seasons.map(season => <option key={season.year} value={season.year}>{season.year}</option>)}</select>
        <button type="submit">{e.viewSeason} ↗</button>
      </form>
      <ParticipationHistory kind="constructor" id={team.id} name={team.name} rows={career?.participation??[]} seasons={seasons.map(season=>season.year)} selectedYear={selectedSeason.year} locale={locale}/>
      <StatisticStrip stats={[
        { label: locale === 'uk' ? 'Гонки' : 'Races', value: selectedSeason.races },
        { label: locale === 'uk' ? 'Перемоги' : 'Wins', value: selectedSeason.wins },
        { label: locale === 'uk' ? 'Подіуми пілотів' : 'Driver podium entries', value: selectedSeason.podium_finishes },
        { label: locale === 'uk' ? 'Очки пілотів у результатах' : 'Driver result points', value: points(selectedSeason.driver_points, selectedSeason.points_missing) },
      ]} />
      <p>{locale === 'uk' ? 'Це статистика результатів гонок, а не офіційний залік Кубка конструкторів. Склад нижче походить із протоколів участі; технічні характеристики потребують окремих перевірених джерел.' : 'These are race-result statistics, not official Constructors’ Championship standings. The roster below comes from recorded participation; technical specifications require separate verified sources.'}</p>
    </section>}
    {!selectedSeason&&<ParticipationHistory kind="constructor" id={team.id} name={team.name} rows={career?.participation??[]} seasons={[]} locale={locale}/>}
    {selectedSeason && <section className={styles.roster} aria-label={locale === 'uk' ? 'Пілоти команди в обраному сезоні' : 'Constructor drivers in selected season'}>
      <h2>{locale === 'uk' ? 'Пілоти сезону' : 'Season driver roster'} · {selectedSeason.year}</h2>
      {roster.length > 0 ? <div className="lineup-grid">{roster.map(driver => <article className="lineup-team" key={driver.driver_id}>
        <h3><Link href={`/drivers/${driver.driver_id}`}>{driver.driver_name}</Link></h3>
        <p>{locale === 'uk' ? 'Гонки з результатами' : 'Races with recorded results'}: {driver.races} · {locale === 'uk' ? 'Перемоги' : 'Wins'}: {driver.wins}</p>
        {career?.participation.filter(row => row.year === selectedSeason.year && row.related_id === driver.driver_id).map(row => <div key={`${row.year}:${row.related_id}`}>
          <p>{locale === 'uk' ? 'Межі участі за протоколами' : 'Recorded participation boundaries'}:{' '}
            <Link href={`/races/${row.first_race.id}`}>{locale === 'uk' ? 'Етап' : 'Round'} {row.first_race.round} · {row.first_race.name}</Link>
            {row.last_race.id !== row.first_race.id && <> → <Link href={`/races/${row.last_race.id}`}>{locale === 'uk' ? 'Етап' : 'Round'} {row.last_race.round} · {row.last_race.name}</Link></>}</p>
          <Link href={`/explorer/constructors/${id}?year=${row.year}&selected=${row.related_id}`}>{locale === 'uk' ? 'Усі гоночні свідчення' : 'All race evidence'} ↗</Link>
        </div>)}
      </article>)}</div> : <p>{locale === 'uk' ? 'У цьому сезоні немає записів про пілотів.' : 'No driver entries are recorded for this season.'}</p>}
      <p>{locale === 'uk' ? 'Склад сформовано з результатів перегонів, а не з контрактів або заявок на весь сезон.' : 'This roster is derived from race results, not full-season contracts or entry lists.'}</p>
    </section>}
    <section className={styles.overview} aria-labelledby="constructor-archive-overview" data-testid="constructor-archive-overview">
      <h2 id="constructor-archive-overview">{locale === 'uk' ? 'Історія за результатами' : 'History through race results'}</h2>
      <p>{locale === 'uk'
        ? `Архів містить ${team.races} гонок за участю конструктора ${team.name}${team.first_season !== null ? ` від сезону ${team.first_season}` : ''}${team.last_season !== null && team.last_season !== team.first_season ? ` до ${team.last_season} року` : ''}. Зафіксовано ${team.wins} переможних гонок у цьому наборі результатів.`
        : `The archive records ${team.races} races associated with constructor ${team.name}${team.first_season !== null ? ` from the ${team.first_season} season` : ''}${team.last_season !== null && team.last_season !== team.first_season ? ` through ${team.last_season}` : ''}. It includes ${team.wins} distinct winning races in the imported results.`}</p>
      {seasons.length > 0 && <p>{locale === 'uk' ? 'Перегляньте зафіксовані сезони:' : 'Explore the recorded seasons:'}{' '}
        {seasons.slice(0, 6).map((season, index) => <span key={season.year}>{index > 0 ? ' · ' : ''}<Link href={`/seasons/${season.year}`}>{season.year}</Link></span>)}
        {seasons.length > 6 && <span> · {locale === 'uk' ? `ще ${seasons.length - 6} у таблиці нижче` : `${seasons.length - 6} more in the table below`}</span>}
      </p>}
      <p>{locale === 'uk' ? 'Це опис участі за протоколами, а не перевірена історія власності, контрактів чи юридичної спадковості команди. Сумарні очки пілотів не є офіційними очками Кубка конструкторів.' : 'This is a summary of recorded participation, not a verified history of team ownership, contracts or legal succession. Summed driver points are not official constructors championship points.'} <Link href="/sources">{locale === 'uk' ? 'Джерела архіву' : 'Archive sources'} ↗</Link></p>
    </section>
    <section className={styles.eras} aria-labelledby="constructor-key-eras" data-testid="constructor-key-eras">
      <h2 id="constructor-key-eras" tabIndex={-1}>{locale === 'uk' ? 'Епохи конструктора' : 'Constructor eras'}</h2>
      <p>{locale === 'uk' ? 'Сезони з найбільшою кількістю переможних гонок у цьому архіві. Це порівняння результатів, а не рейтинг офіційних чемпіонських титулів.' : 'Seasons with the most race wins in this archive. These are recorded winning races, not official championship titles.'}</p>
      {seasons.length > 0 ? <div className="driver-grid">{[...seasons].sort((a,b) => b.wins - a.wins || a.year - b.year).slice(0, 4).map(season =>
        <article className="driver" key={season.year}>
          <span className="index">{locale === 'uk' ? 'Сезон' : 'Season'} · {season.year}</span>
          <h3><Link href={`/seasons/${season.year}`}>{season.wins} {locale === 'uk' ? 'перемог' : 'wins'} ↗</Link></h3>
          <p>{season.races} {locale === 'uk' ? 'гонок у протоколах' : 'recorded races'}</p>
          <Link href={`/constructors/${team.id}?season=${season.year}`}>{locale === 'uk' ? 'Пілоти та результати сезону' : 'Season drivers and results'} ↗</Link>
        </article>)}</div> : <p>{locale === 'uk' ? 'Немає зафіксованих сезонів.' : 'No seasons recorded.'}</p>}
      <p>{locale === 'uk' ? 'Учасники, юридична спадковість, шасі й силові установки потребують окремих перевірених джерел. Не ототожнюємо однойменні команди та конструкторів без доказів.' : 'Entrants, legal succession, chassis and power units need separate verified evidence. Constructor identity alone does not establish legal team continuity.'}</p>
    </section>
    <MediaCollection assets={mediaPublication.assets as MediaAsset[]} subject={{type:'constructor',id:team.external_id}} label={team.name} locale={locale}/>
    <section id="constructor-archive" tabIndex={-1} className={styles.archive}>
    <SectionHeading kicker={e.archive} title={e.fullArchive} id="constructor-archive-title" />
    {identities[0] && <IdentityFacts identity={identities[0]} locale={locale} />}
    <h2>{t('participationTimeline')}</h2>
    <p>{t('participationLead')}</p>
    {seasons.length > 0 && team.first_season !== null && team.last_season !== null && <div className="timeline-scroll" role="region" aria-label={t('constructorRegion')} tabIndex={0}>
      <div className="timeline-track" style={{ gridTemplateColumns: `repeat(${team.last_season - team.first_season + 1}, minmax(46px,1fr))` }}>
        {Array.from({ length: team.last_season - team.first_season + 1 }, (_, i) => {
          const year = team.first_season! + i;
          const season = seasons.find(s => s.year === year);
          return season
            ? <Link className="timeline-year active" key={year} href={`/seasons/${year}`} title={`${year}: ${t('raceWins', { races: season.races, wins: season.wins })}`}><span>{year}</span><strong>{t('winCount', { count: season.wins })}</strong></Link>
            : <div className="timeline-year inactive" key={year} title={`${year}: ${t('noResultsShort')}`}><span>{year}</span><small>—</small></div>;
        })}
      </div>
    </div>}
    <h2>{t('seasonHistory')}</h2>
    {seasons.length ? <ArchiveTable label={t('seasonHistory')} locale={locale}><table><thead><tr><th scope="col">{t('season')}</th><th scope="col">{t('races')}</th><th scope="col">{t('wins')}</th><th scope="col">{t('driverPodiums')}</th><th scope="col">{t('driverPoints')}</th></tr></thead><tbody>
      {seasons.map(s=><tr key={s.year}><th scope="row"><Link href={`/seasons/${s.year}`}>{s.year}</Link></th><td>{s.races}</td><td>{s.wins}</td><td>{s.podium_finishes}</td><td>{points(s.driver_points, s.points_missing)}</td></tr>)}
    </tbody></table></ArchiveTable> : <p>{t('noResults')}</p>}
    <section aria-labelledby="constructor-driver-history" data-testid="constructor-driver-history">
      <h2 id="constructor-driver-history">{locale === 'uk' ? 'Пілоти в історії результатів команди' : 'Drivers in this constructor’s race records'}</h2>
      <p>{locale === 'uk' ? 'Кожен зв’язок підтверджується імпортованими гоночними результатами. Періоди означають зафіксовані сезони, а не контракти чи історію заявок.' : 'Each connection comes from imported race-result records. Years reflect recorded seasons, not employment contracts or entrant histories.'}</p>
      {drivers.length ? <ArchiveTable label={locale === 'uk' ? 'Пілоти за сезонами' : 'Drivers by season'} locale={locale}>
        <table><thead><tr><th scope="col">{locale === 'uk' ? 'Пілот' : 'Driver'}</th><th scope="col">{locale === 'uk' ? 'Сезони' : 'Recorded seasons'}</th><th scope="col">{locale === 'uk' ? 'Перша зафіксована гонка' : 'First recorded race'}</th></tr></thead>
          <tbody>{drivers.map(driver => {
            const rows = (career?.participation ?? []).filter(row => row.related_id === driver.id);
            const first = [...rows].sort((a,b) => a.year-b.year || a.first_race.round-b.first_race.round)[0]?.first_race;
            return <tr key={driver.id}><th scope="row"><Link href={`/drivers/${driver.id}`}>{driver.name}</Link></th>
              <td>{[...driver.years].sort((a,b) => a-b).join(', ')}</td>
              <td>{first ? <Link href={`/races/${first.id}`}>{first.year} · {first.name} ↗</Link> : '—'}</td></tr>;
          })}</tbody></table>
      </ArchiveTable> : <p>{locale === 'uk' ? 'Немає зафіксованих зв’язків із пілотами.' : 'No recorded driver associations.'}</p>}
      {career?.milestones.first_win && <p>{locale === 'uk' ? 'Перша зафіксована перемога конструктора' : 'First recorded constructor winning race'}:{' '}
        <Link href={`/races/${career.milestones.first_win.race.id}`}>{career.milestones.first_win.race.year} · {career.milestones.first_win.race.name} ↗</Link>
      </p>}
    </section>
    </section>
    <section className={styles.relations}>
    <h2>{t('historicalRelations')}</h2>
    <p>{t('relationsLead')}</p>
    {lineage.length > 0 && <div className="lineage-graph" role="region" aria-label={t('constructorGraph')}>
      {lineage.map(edge => <div className="lineage-edge" key={edge.id}>
        <Link className="lineage-node" href={`/constructors/${edge.subject_id}`}>
          <small>{t('constructor')}</small><strong>{edge.subject_name}</strong>
        </Link>
        <div className="lineage-arrow" aria-label={t.has(edge.relation_type) ? t(edge.relation_type) : edge.relation_type}>
          <span>{edge.effective_year ?? t('unknownDate')}</span>
          <span aria-hidden="true">→</span>
          <small>{t.has(edge.relation_type) ? t(edge.relation_type) : edge.relation_type}</small>
        </div>
        <Link className="lineage-node" href={`/constructors/${edge.object_id}`}>
          <small>{t('constructor')}</small><strong>{edge.object_name}</strong>
        </Link>
      </div>)}
    </div>}
    {lineage.length ? <div className="lineup-grid">{lineage.map(edge => <article className="lineup-team" key={edge.id}>
      <p className="eyebrow">{t.has(edge.relation_type) ? t(edge.relation_type) : edge.relation_type} {edge.effective_year ?? ''}</p>
      <h3><Link href={`/constructors/${edge.subject_id}`}>{edge.subject_name}</Link> → <Link href={`/constructors/${edge.object_id}`}>{edge.object_name}</Link></h3>
      <p>{edge.evidence_note}</p>
      <a className="back" href={edge.source_url} target="_blank" rel="noopener noreferrer">{t('source')}: {edge.source_title} · {edge.source_publisher} ↗</a>
    </article>)}</div> : <p>{t('noVerifiedRelations')}</p>}
    </section>
    <div id="constructor-classifications" tabIndex={-1} className={styles.classifications}><ChampionshipTable rows={championships} locale={locale} kind="constructors" scope="career" /></div>
    <Link className="back" href="/constructors">← {t('allConstructors')}</Link>
  </section>;
}
