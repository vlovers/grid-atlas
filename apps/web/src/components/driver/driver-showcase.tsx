import { CareerMap } from '@/components/atlas/career-map';
import { CareerSignature } from '@/components/atlas/career-signature';
import { CareerTimeline } from '@/components/discovery';
import { LicensedMedia } from '@/components/media/licensed-media';
import type { MediaAsset } from '@/components/media/registry';
import { selectMedia } from '@/components/media/registry';
import type { PublishedArticle } from '@/lib/api';
import { raceMoments, seasonMilestones, seasonPoints, teamEras, timeMachinePath,
  type DriverCareer, type DriverProfile, type DriverSeason, type DriverTeam } from './showcase-model';
import { showcaseCopy } from './showcase-copy';
import styles from './showcase.module.css';

type Props = { driver: DriverProfile; career: DriverCareer | null; seasons: DriverSeason[]; teams: DriverTeam[];
  article: PublishedArticle | null; media: readonly MediaAsset[]; locale: 'uk' | 'en'; selectedSeason?: string };

/** Shared public template: all facts and numeric destinations originate in public APIs. */
export function DriverShowcase({ driver, career, seasons, teams, article, media, locale, selectedSeason }: Props) {
  const t = showcaseCopy[locale];
  const format = (value: number | null | undefined) => value == null ? t.unavailable : new Intl.NumberFormat(locale).format(value);
  const peakSeasons = seasonMilestones(seasons);
  const years = [...new Set(seasons.map(s => s.year))].sort((a, b) => a - b);
  const selected = seasons.find(s => String(s.year) === selectedSeason) ?? peakSeasons[0] ?? seasons.at(-1);
  const eras = teamEras(career?.participation ?? []);
  const constructorCount = new Set(career?.participation.map(row => row.related_id) ?? []).size;
  const moments = career ? raceMoments(career.milestones) : [];
  const winningMoments = moments.filter(moment => moment.labels.some(label => label === 'first_win' || label === 'last_win'));
  const featuredMoments = winningMoments.length ? winningMoments : moments;
  const boundaries = moments.filter(moment => !featuredMoments.includes(moment));
  const compare = timeMachinePath(driver.id, years);
  const portrait = media.find(a => a.status === 'verified' && a.subject.type === 'driver' &&
    a.subject.id === driver.external_id && ['photograph', 'portrait'].includes(a.kind) &&
    selectMedia(media, a.id, { type: 'driver', id: driver.external_id }));
  const range = driver.first_season === null ? t.unavailable : driver.first_season === driver.last_season
    ? String(driver.first_season) : `${driver.first_season}—${driver.last_season}`;
  const timeline = (career?.participation ?? []).map(row => ({
    id: `${row.year}:${row.related_id}`, period: String(row.year), title: row.related_name,
    summary: `${t.races}: ${format(row.races)} · ${t.resultEntries}: ${format(row.result_entries)}`,
    entities: [{ id: row.related_id, href: `/${locale}/constructors/${row.related_id}`, label: row.related_name }],
    destination: { href: `/${locale}/explorer/drivers/${driver.id}?year=${row.year}&selected=${row.related_id}`, label: t.graph },
  }));

  return <section className={`page ${styles.showcase}`} data-testid="driver-showcase">
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>{t.archive} <span aria-hidden="true">/</span> {driver.external_id}</p>
        <p className={styles.period}><strong>{range}</strong><span>{t.period}</span></p>
        <h1>{driver.name}</h1>
        <p className={styles.declaration}>{career && career.summary.result_entries > 0
          ? locale === 'uk' ? `Зафіксовані сезони: ${format(career.summary.seasons)}. Різні конструктори: ${format(constructorCount)}. Простежте зв’язки між ними через записи гонок.`
            : `Recorded seasons: ${format(career.summary.seasons)}. Distinct constructors: ${format(constructorCount)}. Follow the race records that connect them.`
          : t.intro}</p>
        <div className={styles.actions}><a className={styles.primary} href="#driver-career">{t.begin} <span aria-hidden="true">↓</span></a>
          {compare && <a className={styles.textLink} href={`/${locale}${compare}`}>{t.compare} <span aria-hidden="true">↗</span></a>}</div>
      </div>
      <div className={styles.heroVisual}>
        <span className={styles.visualRule} aria-hidden="true" />
        {portrait ? <LicensedMedia assets={media} assetId={portrait.id} subject={{ type: 'driver', id: driver.external_id }} label={driver.name} locale={locale} />
          : <CareerSignature seasons={seasons} name={driver.name} locale={locale} />}

      </div>
      <dl className={styles.heroFacts}>
        {[{ label: t.races, value: career?.summary.races }, { label: t.wins, value: career?.summary.winning_races },
          { label: t.podiums, value: career?.summary.podium_result_entries }, { label: t.period, value: driver.seasons }].map(fact =>
          <div key={fact.label}><dt>{fact.label}</dt><dd>{format(fact.value)}</dd></div>)}
      </dl>
      <p className={styles.heroScope}>{t.scope}</p>
    </header>

    <nav className={styles.chapters} aria-label={t.chapters}>
      {[[t.career, 'driver-career'], [t.teams, 'driver-teams'], [t.moments, 'driver-moments'],
        [t.biography, 'driver-biography'], [t.statistics, 'driver-archive']].map(([label, anchor], index) =>
        <a href={`#${anchor}`} key={anchor}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{label}</a>)}
    </nav>

    <CareerMap rows={career?.participation ?? []} driverId={driver.id} locale={locale} />

    <section id="driver-career" className={styles.chapter} aria-labelledby="driver-season-title" tabIndex={-1}>
      <SectionHeading kicker={t.seasonKicker} title={t.seasonTitle} id="driver-season-title" note={t.seasonNote} />
      {peakSeasons.length > 0 ? <ol className={styles.seasonMilestones}>{peakSeasons.map((season, index) =>
        <li key={season.year}><span className={styles.cardIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <a href={`/${locale}/seasons/${season.year}`} className={styles.yearLink}>{season.year} <span aria-hidden="true">↗</span></a>
          <p><strong>{format(season.wins)}</strong> {t.winningEntries}</p>
          <span>{format(season.starts)} {t.resultEntries.toLocaleLowerCase(locale)}</span>
        </li>)}</ol> : <p className={styles.empty}>{t.noWins}</p>}
      <aside className={styles.coverage}><strong>{t.titleGap}</strong><p>{t.titleGapNote}</p></aside>
      {years.length > 0 && <div className={styles.seasonExplorer}>
        <nav aria-label={t.seasonLinks} className={styles.yearNav}>{years.map(year => <a key={year}
          href={`/${locale}/drivers/${driver.id}?season=${year}#driver-career`} aria-current={selected?.year === year ? 'true' : undefined}>{year}</a>)}</nav>
        {selected && <section className={styles.selectedSeason} aria-label={`${t.season} ${selected.year}`}>
          <div><span className={styles.kicker}>{t.season}</span><h3>{selected.year}</h3><a className={styles.textLink} href={`/${locale}/seasons/${selected.year}`}>{t.seasonsTable} ↗</a></div>
          <dl>{[{ label: t.resultEntries, value: selected.starts }, { label: t.winningEntries, value: selected.wins },
            { label: t.podiums, value: selected.podiums }].map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{format(fact.value)}</dd></div>)}</dl>
          <a className={styles.outlineLink} href={`/${locale}/explorer/drivers/${driver.id}?year=${selected.year}`}>{t.exploreConnections} ↗</a>
        </section>}
      </div>}
    </section>

    <section id="driver-teams" className={styles.chapter} aria-labelledby="driver-team-title" tabIndex={-1}>
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

    <section id="driver-moments" className={styles.chapter} aria-labelledby="driver-moments-title" tabIndex={-1}>
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

    <section id="driver-biography" className={styles.chapter} aria-labelledby="driver-editorial-title" tabIndex={-1}>
      {article && <SectionHeading kicker={t.editorialKicker} title={t.editorialTitle} id="driver-editorial-title" />}
      {article ? <article className={styles.biography}><h3>{article.title}</h3>
        {article.body_markdown.split(/\n\s*\n/).filter(Boolean).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        {article.references.length > 0 && <aside><h4>{t.sourceTitle}</h4><ol>{article.references.map((source, i) => <li key={`${source.url}:${i}`}><a href={source.url} rel="noreferrer">{source.title}</a> — {source.publisher}</li>)}</ol></aside>}
      </article> : <div className={styles.editorialEmpty}><span aria-hidden="true">¶</span><div><h2 id="driver-editorial-title">{t.unpublished}</h2><p>{t.unpublishedNote}</p></div></div>}
    </section>

    <section id="driver-archive" className={styles.chapter} aria-labelledby="driver-archive-title" tabIndex={-1}>
      <SectionHeading kicker={t.archiveKicker} title={t.archiveTitle} id="driver-archive-title" note={t.archiveNote} />
      <details id="driver-seasons" className={styles.disclosure}><summary>{t.seasonsTable} <span>{format(seasons.length)}</span></summary>
        {seasons.length ? <div className={styles.tableScroll} role="region" aria-label={t.seasonsTable} tabIndex={0}><table><caption>{t.seasonsTable} · {driver.name}</caption><thead><tr>
          {[t.season, t.resultEntries, t.winningEntries, t.podiums, t.points].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
          {seasons.map(season => { const points = seasonPoints(season, career?.participation ?? []); return <tr key={season.year}><th scope="row"><a href={`/${locale}/seasons/${season.year}`}>{season.year}</a></th>
            <td>{format(season.starts)}</td><td>{format(season.wins)}</td><td>{format(season.podiums)}</td><td>{points.value ?? t.unavailable}{points.value !== null && points.partial && <small className={styles.partialPoints}>{t.partialPoints}</small>}</td></tr>; })}
        </tbody></table></div> : <p>{t.empty}</p>}
        <p className={styles.note}>{t.sourceNote}</p>
      </details>
      <details className={styles.disclosure}><summary>{t.teamsTable} <span>{format(teams.length)}</span></summary>
        {teams.length ? <div className={styles.tableScroll} role="region" aria-label={t.teamsTable} tabIndex={0}><table><caption>{t.teamsTable} · {driver.name}</caption><thead><tr>{[t.season, t.constructor, t.races, t.winningEntries].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
          <tbody>{teams.map(team => <tr key={`${team.year}:${team.constructor_id}`}><th scope="row"><a href={`/${locale}/seasons/${team.year}`}>{team.year}</a></th><td><a href={`/${locale}/constructors/${team.constructor_id}`}>{team.constructor_name} ↗</a></td><td>{format(team.races)}</td><td>{format(team.wins)}</td></tr>)}</tbody></table></div> : <p>{t.empty}</p>}
      </details>
      <details className={styles.disclosure}><summary>{t.timeline} <span>{format(timeline.length)}</span></summary>
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
    <a className={styles.back} href={`/${locale}/drivers`}>← {t.back}</a>
  </section>;
}

function SectionHeading({ kicker, title, note, id }: { kicker: string; title: string; note?: string; id: string }) {
  return <header className={styles.sectionHeading}><div><p className={styles.kicker}>{kicker}</p><h2 id={id}>{title}</h2></div>{note && <p>{note}</p>}</header>;
}
