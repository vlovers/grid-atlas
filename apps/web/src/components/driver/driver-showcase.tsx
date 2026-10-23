import { RecordGraphic } from '@/components/editorial/record-graphic';
import { ArchiveTable } from '@/components/editorial/archive-table';
import { MediaCollection } from '@/components/media/collection';
import { PublishedChapters } from '@/components/stories/published-chapters';
import { releasePilot } from '@/components/stories/release-model';
import { storyCopy } from '@/components/stories/copy';
import { openingRecord, seasonStories } from '@/components/stories/story-model';
import { CareerMap } from '@/components/atlas/career-map';
import { DriverSeasonChart } from './driver-season-chart';
import { CareerEraRail } from './career-era-rail';
import { CareerSignature } from '@/components/atlas/career-signature';
import { CareerTimeline } from '@/components/discovery';
import type { MediaAsset } from '@/components/media/registry';
import type { PublishedArticle } from '@/lib/api';
import type { IdentityDetails } from '@/components/identity-facts';
import { ChampionshipTable, type ChampionshipRow } from '@/components/championship-table';
import { EditorialHero, EditorialMedia, EditorialTabs, SectionHeading, SourceAttribution } from '@/components/editorial/primitives';
import { editorialCopy } from '@/components/editorial/copy';
import { driverArchiveOverview, raceMoments, seasonPoints, teamEras, timeMachinePath,
  type DriverCareer, type DriverProfile, type DriverSeason, type DriverTeam, type DriverSeasonResult } from './showcase-model';
import { showcaseCopy } from './showcase-copy';
import styles from './showcase.module.css';

type Props = { driver: DriverProfile; career: DriverCareer | null; seasons: DriverSeason[]; teams: DriverTeam[]; editorialUnavailable?: boolean;
  article: PublishedArticle | null; media: readonly MediaAsset[]; locale: 'uk' | 'en'; selectedSeason?: string; seasonResults: DriverSeasonResult[]; identity?: React.ReactNode; identityDetails?: IdentityDetails; championships: ChampionshipRow[]; relatedDrivers: { driver_id: string; driver_name: string }[] };

/** Shared public template: all facts and numeric destinations originate in public APIs. */
export function DriverShowcase({ driver, career, seasons, teams, article, editorialUnavailable, media, locale, selectedSeason, seasonResults, identity, identityDetails, championships, relatedDrivers }: Props) {
  const pilot = releasePilot(driver.external_id);
  const t = showcaseCopy[locale];
  const story = storyCopy[locale];
  const e = editorialCopy[locale];
  const opening = openingRecord(career);
  const overview = driverArchiveOverview(driver, career, locale);
  const format = (value: number | null | undefined) => value == null ? t.unavailable : new Intl.NumberFormat(locale).format(value);
  const peakSeasons = seasonStories(seasons);
  const years = [...new Set(seasons.map(s => s.year))].sort((a, b) => a - b);
  const selected = seasons.find(s => String(s.year) === selectedSeason) ?? peakSeasons[0] ?? seasons.at(-1);
  const eras = teamEras(career?.participation ?? []);
  const moments = career ? raceMoments(career.milestones) : [];
  const winningMoments = moments.filter(moment => moment.labels.some(label => label === 'first_win' || label === 'last_win'));
  const featuredMoments = winningMoments.length ? winningMoments : moments;
  const boundaries = moments.filter(moment => !featuredMoments.includes(moment));
  const compare = timeMachinePath(driver.id, years);
  const range = driver.first_season === null ? t.unavailable : driver.first_season === driver.last_season
    ? String(driver.first_season) : `${driver.first_season}—${driver.last_season}`;
  const timeline = (career?.participation ?? []).map(row => ({
    id: `${row.year}:${row.related_id}`, period: String(row.year), title: row.related_name,
    summary: `${t.races}: ${format(row.races)} · ${t.resultEntries}: ${format(row.result_entries)}`,
    entities: [{ id: row.related_id, href: `/${locale}/constructors/${row.related_id}`, label: row.related_name }],
    destination: { href: `/${locale}/explorer/drivers/${driver.id}?year=${row.year}&selected=${row.related_id}`, label: t.graph },
  }));

  return <section className={`page ${styles.showcase}`} data-testid="driver-showcase">
    <EditorialHero title={driver.name} eyebrow={`${story.driverCover} / ${driver.external_id}`}
      context={<><span>{range}</span>{identityDetails?.fields.nationality && <span>{identityDetails.fields.nationality}</span>}</>}
      lead={story.driverLead}
      media={<EditorialMedia assets={media} subject={{ type: 'driver', id: driver.external_id }} title={driver.name} years={range} locale={locale}><RecordGraphic rows={seasons.map(season => ({ year: season.year, records: season.starts, wins: season.wins }))} label={t.resultEntries} winsLabel={t.winningEntries} locale={locale} /></EditorialMedia>}
      actions={<>{pilot && <a href={`/${locale}/stories/${pilot.slug}`}>{locale === 'uk' ? 'Дослідити історію' : 'Explore the story'} ↗</a>}<a href="#driver-career">{t.begin} ↓</a>{compare && <a href={`/${locale}${compare}`}>{t.compare} ↗</a>}</>}
      statistics={[{ label: t.races, value: format(career?.summary.races) }, { label: t.wins, value: format(career?.summary.winning_races) },
        { label: t.podiums, value: format(career?.summary.podium_result_entries) }, { label: t.period, value: format(driver.seasons) }]} scope={t.scope} />
    <SourceAttribution locale={locale} />
    <EditorialTabs label={t.chapters} items={[[t.biography, 'driver-biography'], [t.career, 'driver-career'], [t.teams, 'driver-teams'], [t.moments, 'driver-moments'], [e.classifications, 'driver-classifications'], [t.statistics, 'driver-archive']].map(([label, id]) => ({ label, id }))} />


    <section id="driver-biography" className={styles.chapter} aria-labelledby="driver-editorial-title" tabIndex={-1}>
      <SectionHeading kicker={t.editorialKicker} title={t.editorialTitle} id="driver-editorial-title" />
      {overview && <article className={styles.biography} data-testid="driver-archive-overview">
        <h3>{locale === 'en' ? 'Career in the historical record' : 'Кар’єра за історичними протоколами'}</h3>
        {overview.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        <p>{locale === 'en'
          ? 'This is a factual summary of recorded results, not an independently reviewed life story. Constructor associations do not prove employment or legal team continuity.'
          : 'Це фактичний підсумок зафіксованих результатів, а не незалежно перевірена біографія. Зв’язки з конструкторами не засвідчують контракти чи юридичну спадковість команд.'}</p>
        <ul>{overview.firstRace && <li><a href={`/${locale}/races/${overview.firstRace.id}`}>
          {locale === 'en' ? 'First recorded race' : 'Перша зафіксована гонка'}: {overview.firstRace.name} ({overview.firstRace.year}) ↗
        </a></li>}
        {overview.firstWin && <li><a href={`/${locale}/races/${overview.firstWin.id}`}>
          {locale === 'en' ? 'First recorded win' : 'Перша зафіксована перемога'}: {overview.firstWin.name} ({overview.firstWin.year}) ↗
        </a></li>}</ul>
        <a href={`/${locale}/sources`}>{locale === 'en' ? 'Archive source and methodology' : 'Джерело та методологія архіву'} ↗</a>
      </article>}
      {editorialUnavailable ? <p role="status" data-testid="editorial-unavailable">{locale === 'uk' ? 'Редакційний матеріал тимчасово недоступний. Архівні записи доступні нижче.' : 'Editorial content is temporarily unavailable. Archive records remain available below.'}</p>
        : article ? <div><h3>{t.biography}</h3><PublishedChapters article={article} locale={locale} /></div> : <div className={styles.editorialEmpty}><span aria-hidden="true">¶</span><div><h3>{t.unpublished}</h3><p>{t.unpublishedNote}</p></div></div>}
    </section>

    {career && <section className={styles.chapter} aria-labelledby="driver-facts-title">
      <SectionHeading kicker={locale === 'uk' ? 'ФАКТИ / АРХІВ' : 'FACTS / ARCHIVE'}
        title={locale === 'uk' ? 'Кар’єра в цифрах' : 'Career at a glance'} id="driver-facts-title"
        note={locale === 'uk' ? 'За результатами гонок у перевіреному архіві' : 'From recorded race results in the pinned archive'} />
      <dl className={styles.quickFacts}>
        {career.milestones.first_appearance && <div><dt>{locale === 'uk' ? 'Перша участь' : 'First appearance'}</dt>
          <dd><a href={`/${locale}/races/${career.milestones.first_appearance.race.id}`}>{career.milestones.first_appearance.race.year} · {career.milestones.first_appearance.race.name}</a></dd></div>}
        {career.milestones.first_win && <div><dt>{locale === 'uk' ? 'Перша перемога' : 'First win'}</dt>
          <dd><a href={`/${locale}/races/${career.milestones.first_win.race.id}`}>{career.milestones.first_win.race.year} · {career.milestones.first_win.race.name}</a></dd></div>}
        <div><dt>{locale === 'uk' ? 'Команди за кар’єру' : 'Career constructors'}</dt>
          <dd>{new Set(career.participation.map(row => row.related_id)).size}</dd></div>
        <div><dt>{locale === 'uk' ? 'Зафіксовані результати' : 'Recorded result entries'}</dt>
          <dd>{format(career.summary.result_entries)}</dd></div>
      </dl>
      <p>{locale === 'uk' ? 'Титули чемпіона світу, поул-позиції та сходи не виводяться без окремого перевіреного джерела. Кількість команд означає унікальні ідентифікатори конструкторів у результатах.' : 'World titles, pole positions and retirements are not inferred without separately verified sources. Constructor count reflects distinct constructor IDs in race results.'}</p>
    </section>}

    {opening && <section className={styles.openingScene} aria-labelledby="driver-opening-title" data-story-reveal data-testid="driver-opening">
      <div className={styles.openingArt}><span>{opening.race.year}</span><small>{career?.milestones.first_win ? e.firstWin : e.firstRecord}</small></div>
      <div className={styles.openingCopy}><p className={styles.kicker}>{story.opening}</p><h2 id="driver-opening-title">{story.openingTitle}</h2><p>{story.openingNote}</p>
        <span className={styles.openingLabel}>{career?.milestones.first_win ? story.firstWin : story.firstRace} / {opening.race.year}</span>
        <h3><a href={`/${locale}/races/${opening.race.id}`}>{opening.race.name}</a></h3><a className={styles.primary} href={`/${locale}/races/${opening.race.id}`}>{story.openRace} ↗</a></div>
    </section>}

    <section data-story-reveal id="driver-career" className={styles.chapter} aria-labelledby="driver-season-title" tabIndex={-1}>
      <SectionHeading kicker={t.seasonKicker} title={story.seasonTitle} id="driver-season-title" note={story.seasonNote} />
      {peakSeasons.length > 0 ? <ol className={styles.seasonMilestones}>{peakSeasons.map((season, index) =>
        <li key={season.year}><span className={styles.cardIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <a href={`/${locale}/seasons/${season.year}`} className={styles.yearLink}>{season.year} <span aria-hidden="true">↗</span></a>
          <p><strong>{format(season.wins)}</strong> {t.winningEntries}</p>
          <span>{format(season.starts)} {t.resultEntries.toLocaleLowerCase(locale)}</span>
        </li>)}</ol> : <p className={styles.empty}>{t.noWins}</p>}
      <CareerEraRail career={career} seasons={seasons} driverId={driver.id} name={driver.name} locale={locale} selectedYear={selected?.year} />
      <DriverSeasonChart seasons={seasons} locale={locale} driverId={driver.id} selectedYear={selected?.year} />
      {years.length > 0 && <div className={styles.seasonExplorer}>
        <nav aria-label={t.seasonLinks} className={styles.yearNav}>{years.map(year => <a key={year}
          href={`/${locale}/drivers/${driver.id}?season=${year}#driver-career`} aria-current={selected?.year === year ? 'true' : undefined}>{year}</a>)}</nav>
        {selected && <section className={styles.selectedSeason} aria-label={`${t.season} ${selected.year}`}>
          <div><span className={styles.kicker}>{t.season}</span><h3>{selected.year}</h3><a className={styles.textLink} href={`/${locale}/seasons/${selected.year}`}>{t.seasonsTable} ↗</a></div>
          <dl>{[{ label: t.resultEntries, value: selected.starts }, { label: t.winningEntries, value: selected.wins },
            { label: t.podiums, value: selected.podiums }].map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{format(fact.value)}</dd></div>)}</dl>
          <div>
            <h4>{locale === 'uk' ? 'Команди цього сезону' : 'Teams this season'}</h4>
            <ul>{teams.filter(team => team.year === selected.year).map(team =>
              <li key={team.constructor_id}><a href={`/${locale}/constructors/${team.constructor_id}`}>{team.constructor_name}</a> · {format(team.races)} {t.races}</li>)}</ul>
            <p>{locale === 'uk' ? 'Очки за зафіксованими результатами (не офіційний залік):' : 'Points in recorded results (not official standings):'} {seasonPoints(selected, career?.participation ?? []).value ?? t.unavailable}{seasonPoints(selected, career?.participation ?? []).partial && <> · {t.partialPoints}</>}</p>
            <p>{locale === 'uk' ? 'Класифікації F1DB показано в окремому розділі нижче. Поули й сходи не виводяться з цих підсумків.' : 'F1DB classifications appear in a separate section below. Poles and retirements are not inferred from these totals.'}</p>
          </div>
          {career && <div className={styles.seasonTeamBreakdown}>
            <h4>{locale === 'uk' ? 'Результати за командами' : 'Results by constructor'} · {selected.year}</h4>
            <div className={styles.seasonTeamRows}>
              {career.participation.filter(row => row.year === selected.year).map(row => <article key={row.related_id}>
                <h5><a href={`/${locale}/constructors/${row.related_id}?season=${selected.year}`}>{row.related_name}</a></h5>
                <dl>
                  <div><dt>{locale === 'uk' ? 'Гонки' : 'Races'}</dt><dd>{format(row.races)}</dd></div>
                  <div><dt>{locale === 'uk' ? 'Записи результатів' : 'Result entries'}</dt><dd>{format(row.result_entries)}</dd></div>
                  <div><dt>{locale === 'uk' ? 'Переможні гонки' : 'Winning races'}</dt><dd>{format(row.winning_races)}</dd></div>
                </dl>
                <p>{locale === 'uk' ? 'Очки у результатах' : 'Recorded result points'}: {row.recorded_points ?? t.unavailable}{row.points_missing > 0 ? ` · ${locale === 'uk' ? 'Є пропуски' : 'Incomplete'}` : ''}</p>
                <p><a href={`/${locale}/races/${row.first_race.id}`}>{locale === 'uk' ? 'Перша гонка' : 'First race'} ↗</a> · <a href={`/${locale}/races/${row.last_race.id}`}>{locale === 'uk' ? 'Остання гонка' : 'Last race'} ↗</a></p>
              </article>)}
            </div>
            <p>{locale === 'uk' ? 'Групування за конструктором у записах гонок, не за контрактами. Спільні автомобілі та відсутні очки можуть впливати на підсумки.' : 'Grouped by constructor in recorded race results, not by contracts. Shared cars and missing points may affect totals.'}</p>
          </div>}
          <section className={styles.seasonRaceLedger} aria-label={locale === 'uk' ? 'Результати гонок обраного сезону' : 'Selected season race results'}>
            <h4>{locale === 'uk' ? 'Усі результати гонок' : 'Race-by-race results'} · {selected.year}</h4>
            <p>{locale === 'uk' ? 'Кожен запис результату показано окремо: спільні автомобілі можуть створювати кілька записів для одного Гран-прі. Це не офіційна таблиця чемпіонату.' : 'Every recorded result entry is preserved; shared cars may produce multiple entries per Grand Prix. This is not an official championship classification.'}</p>
            {seasonResults.length ? <ArchiveTable label={locale === 'uk' ? 'Результати гонок сезону' : 'Season race results'} locale={locale}><table>
              <thead><tr>
                <th>{locale === 'uk' ? 'Етап' : 'Round'}</th>
                <th>{locale === 'uk' ? 'Гран-прі' : 'Grand Prix'}</th>
                <th>{locale === 'uk' ? 'Команда' : 'Constructor'}</th>
                <th>{locale === 'uk' ? 'Номер у гонці' : 'Race number'}</th>
                <th>{locale === 'uk' ? 'Результат' : 'Result'}</th>
                <th>{locale === 'uk' ? 'Кола' : 'Laps'}</th>
                <th>{locale === 'uk' ? 'Очки' : 'Points'}</th>
              </tr></thead>
              <tbody>{seasonResults.map((result, index) => <tr key={`${result.race_id}:${result.constructor_id}:${result.position_display_order}:${index}`}>
                <td>{result.round}</td>
                <td><a href={`/${locale}/races/${result.race_id}`}>{result.race_name}</a>{result.race_date && <small>{result.race_date}</small>}</td>
                <td><a href={`/${locale}/constructors/${result.constructor_id}?season=${selected.year}`}>{result.constructor_name}</a></td>
                <td>{result.driver_number ?? '—'}</td>
                <td>{result.position_text}{result.shared_car && <small>{locale === 'uk' ? 'Спільний автомобіль' : 'Shared car'}</small>}{result.reason_retired && <small>{result.reason_retired}</small>}</td>
                <td>{result.laps ?? '—'}</td><td>{result.points ?? '—'}</td>
              </tr>)}</tbody>
            </table></ArchiveTable> : <p>{locale === 'uk' ? 'Результатів у цьому сезоні немає.' : 'No race results recorded for this season.'}</p>}
          </section>
          <a className={styles.outlineLink} href={`/${locale}/explorer/drivers/${driver.id}?year=${selected.year}`}>{t.exploreConnections} ↗</a>
        </section>}
      </div>}
    </section>

    <section data-story-reveal id="driver-teams" className={styles.chapter} aria-labelledby="driver-team-title" tabIndex={-1}>
      <SectionHeading kicker={t.teamKicker} title={t.teamTitle} id="driver-team-title" note={t.teamNote} />
      {eras.length ? <ol className={styles.eras}>{eras.map((era, index) => <li key={era.key}>
        <div className={styles.eraRail}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <strong>{era.years[0]}{era.years.length > 1 && <>—{era.years.at(-1)}</>}</strong></div>
        <div className={styles.eraBody}><h3><a href={`/${locale}/constructors/${era.id}`}>{era.name} <span aria-hidden="true">↗</span></a></h3>
          <ul className={styles.eraYears}>{era.years.map(year => <li key={year}><a href={`/${locale}/explorer/drivers/${driver.id}?year=${year}&selected=${era.id}`}>{year}<span className={styles.srOnly}> · {t.graph} · {era.name}</span></a></li>)}</ul>
          <div className={styles.eraLinks}><a href={`/${locale}/explorer/evidence/${driver.id}/${era.id}?year=${era.years[0]}&from=driver&selected=${era.id}`}>{t.evidence} · {era.years[0]} ↗</a></div>
        </div>
      </li>)}</ol> : <p className={styles.empty}>{t.empty}</p>}
    </section>

    <section data-story-reveal id="driver-moments" className={styles.chapter} aria-labelledby="driver-moments-title" tabIndex={-1}>
      <SectionHeading kicker={t.momentKicker} title={t.momentTitle} id="driver-moments-title" note={t.momentNote} />
      {moments.length ? <ol className={styles.moments}>{featuredMoments.map(moment => <li key={moment.race.id}>
        <div className={styles.momentTop}><span>{moment.race.year}</span><span>{t.round} {moment.race.round}</span></div>
        <p className={styles.momentLabel}>{moment.labels.map(label => t[label]).join(' / ')}</p>
        <h3><a href={`/${locale}/races/${moment.race.id}`}>{moment.race.name}</a></h3>
        <p className={styles.classification}>{t.classification}: {moment.results.map(r => r.position_text + (r.shared_car ? ` · ${t.shared}` : '')).join(' / ')}</p>
        <a className={styles.textLink} href={`/${locale}/races/${moment.race.id}`}>{t.raceLink} <span aria-hidden="true">↗</span></a>
      </li>)}</ol> : <p className={styles.empty}>{t.empty}</p>}
      {boundaries.length > 0 && <ul className={styles.boundaries}>{boundaries.map(moment => <li key={moment.race.id}>
        <a href={`/${locale}/races/${moment.race.id}`}><span>{moment.labels.map(label => t[label]).join(' / ')} · {moment.race.year}</span>
          <strong>{moment.race.name} ↗</strong><small>{t.classification}: {moment.results.map(r => r.position_text + (r.shared_car ? ` · ${t.shared}` : '')).join(' / ')}</small></a>
      </li>)}</ul>}
    </section>

    {compare && <aside className={styles.timeMachine}><div><p className={styles.kicker}>TIME MACHINE / {range}</p>
      <h2>{t.compareTitle}</h2><p>{t.compareNote}</p></div><a className={styles.primary} href={`/${locale}${compare}`}>{t.compare} ↗</a></aside>}

    <section id="driver-perspectives" className={styles.chapter} aria-labelledby="driver-perspectives-title" data-testid="driver-perspectives">
      <SectionHeading kicker={e.connections} title={e.perspectives} note={e.perspectivesNote} id="driver-perspectives-title" />
      {relatedDrivers.length ? <ul className={styles.related}>{relatedDrivers.map(related => <li key={related.driver_id}><a href={`/${locale}/drivers/${related.driver_id}?season=${selected?.year}`}>{related.driver_name} <span aria-hidden="true">↗</span></a></li>)}</ul> : <p>{e.noPerspectives}</p>}
    </section>
    <div id="driver-classifications" tabIndex={-1} className={styles.chapter}><ChampionshipTable rows={championships} locale={locale} kind="drivers" scope="career" /></div>
    <section id="driver-archive" className={styles.chapter} aria-labelledby="driver-archive-title" tabIndex={-1}>
      <SectionHeading kicker={t.archiveKicker} title={story.records} id="driver-archive-title" note={t.archiveNote} />
      {identity}
      <aside className={styles.coverage}><strong>{t.titleGap}</strong><p>{t.titleGapNote}</p></aside>
      <details id="driver-graphic" className={styles.disclosure}><summary>{story.graphic}</summary><CareerSignature seasons={seasons} name={driver.name} locale={locale} /></details>
      <details id="driver-seasons" className={styles.disclosure}><summary>{t.seasonsTable} <span>{format(seasons.length)}</span></summary>
        {seasons.length ? <ArchiveTable label={t.seasonsTable} locale={locale}><table><caption>{t.seasonsTable} · {driver.name}</caption><thead><tr>
          {[t.season, t.resultEntries, t.winningEntries, t.podiums, t.points].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
          {seasons.map(season => { const points = seasonPoints(season, career?.participation ?? []); return <tr key={season.year}><th scope="row"><a href={`/${locale}/seasons/${season.year}`}>{season.year}</a></th>
            <td>{format(season.starts)}</td><td>{format(season.wins)}</td><td>{format(season.podiums)}</td><td>{points.value ?? t.unavailable}{points.value !== null && points.partial && <small className={styles.partialPoints}>{t.partialPoints}</small>}</td></tr>; })}
        </tbody></table></ArchiveTable> : <p>{t.empty}</p>}
        <p className={styles.note}>{t.sourceNote}</p>
      </details>
      <details className={styles.disclosure}><summary>{t.teamsTable} <span>{format(teams.length)}</span></summary>
        {teams.length ? <ArchiveTable label={t.teamsTable} locale={locale}><table><caption>{t.teamsTable} · {driver.name}</caption><thead><tr>{[t.season, t.constructor, t.races, t.winningEntries].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody>{teams.map(team => <tr key={`${team.year}:${team.constructor_id}`}><th scope="row"><a href={`/${locale}/seasons/${team.year}`}>{team.year}</a></th><td><a href={`/${locale}/constructors/${team.constructor_id}`}>{team.constructor_name} ↗</a></td><td>{format(team.races)}</td><td>{format(team.wins)}</td></tr>)}</tbody></table></ArchiveTable> : <p>{t.empty}</p>}
      </details>
      <details id="driver-timeline" className={styles.disclosure}><summary>{t.timeline} <span>{format(timeline.length)}</span></summary>
        <CareerMap rows={career?.participation ?? []} driverId={driver.id} locale={locale} />
        <CareerTimeline label={t.timeline} entries={timeline} emptyLabel={t.empty} note={t.teamNote} />
      </details>
      <details className={styles.disclosure}><summary>{t.sourceTitle}</summary>
        <p>{t.sourceNote}</p><p>{t.reviewNote}</p>
        {career && <><p>{career.attribution}</p><dl className={styles.sourceFacts}>
          <div><dt>{t.resultEntries}</dt><dd>{format(career.summary.result_entries)}</dd></div>
          <div><dt>{t.points}</dt><dd>{career.summary.recorded_points ?? t.unavailable}</dd></div>
          <div><dt>{t.missingPoints}</dt><dd>{format(career.summary.points_missing)}</dd></div></dl>
          <ul>{career.observations.map(o => <li key={`${o.release_tag}:${o.artifact_name}:${o.sha256}`}>{o.release_tag} · {o.artifact_name}<code>{o.sha256}</code></li>)}</ul></>}
        <a className={styles.textLink} href={`/${locale}/sources`}>{t.sourceLink} ↗</a>
      </details>
    </section>
    <MediaCollection assets={media} subject={{type:'driver',id:driver.external_id}} label={driver.name} locale={locale}/>
    <a className={styles.back} href={`/${locale}/drivers`}>← {t.back}</a>
  </section>;
}
