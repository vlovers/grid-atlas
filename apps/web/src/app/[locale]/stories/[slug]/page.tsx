import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { releasePilot, journeyYears, selectedYear } from '@/components/stories/release-model';
import { resolveReleaseDriver, releaseResults } from '@/components/stories/release-data';
import { getPublishedArticle } from '@/lib/api';
import { teamEras, timeMachinePath } from '@/components/driver/showcase-model';
import { MotorsportArt } from '@/components/stories/motorsport-art';
import { PublishedChapters } from '@/components/stories/published-chapters';
import { CareerMap } from '@/components/atlas/career-map';
import { routeMetadata, pageStructuredData, serializeJsonLd, siteOrigin } from '@/lib/seo';
import styles from '@/components/stories/release.module.css';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ year?: string | string[] }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params, locale = raw === 'en' ? 'en' : 'uk';
  if (!releasePilot(slug)) notFound();
  const data = await resolveReleaseDriver(slug, locale);
  if (!data) return { ...routeMetadata(locale, `/stories/${slug}`, true), title: locale === 'uk' ? 'Записи недоступні' : 'Records unavailable' };
  return { ...routeMetadata(locale, `/stories/${slug}`), title: `${data.profile.name} — ${locale === 'uk' ? 'історія в протоколах' : 'a journey through the records'}`,
    description: locale === 'uk' ? 'Дослідіть сезони, конструкторів і гонки за перевірюваними записами архіву.' : 'Explore seasons, constructors and races through traceable archive records.' };
}
export default async function DriverStory({ params, searchParams }: Props) {
  const { locale: raw, slug } = await params, locale = raw === 'en' ? 'en' : 'uk', uk = locale === 'uk';
  const pilot = releasePilot(slug);
  if (!pilot) notFound();
  const data = await resolveReleaseDriver(slug, locale);
  if (!data) return <section className={`page ${styles.release}`}><h1>{uk ? 'Записи недоступні' : 'Records unavailable'}</h1><p>{uk ? 'Канонічного пілота немає в поточному імпорті. Жодних історичних даних не підставлено.' : 'The canonical driver is absent from this import. No historical records have been substituted.'}</p><a href={`/${locale}/stories`}>{uk ? 'Історії пілотів' : 'Driver stories'} →</a></section>;
  const { profile: driver, career } = data;
  const years = [...new Set(career.participation.map(r => r.year))].sort((a, b) => a - b);
  const query = await searchParams, featured = journeyYears(pilot, career.participation);
  const year = selectedYear(query.year, years), eras = teamEras(career.participation);
  const [article, records, selectedRecords, peer] = await Promise.all([
    getPublishedArticle(driver.id, locale),
    Promise.all(pilot.races.filter(p => years.includes(p.year)).map(async pick => ({ pick, rows: (await releaseResults(driver.id, pick.year)).filter(r => r.round === pick.round) }))),
    year === null ? Promise.resolve([]) : releaseResults(driver.id, year),
    resolveReleaseDriver(pilot.peer, locale),
  ]);
  const related = peer && career.participation.some(r => r.year === pilot.peerYear) && peer.career.participation.some(r => r.year === pilot.peerYear) ? peer : null;
  const first = career.milestones.first_appearance?.race;
  const selected = career.participation.filter(r => r.year === year);
  const compare = timeMachinePath(driver.id, years), origin = siteOrigin();
  const labels = { years: uk ? 'Зафіксовані сезони' : 'Observed seasons', entries: uk ? 'Записи результатів' : 'Result entries', wins: uk ? 'Переможні гонки в архіві' : 'Winning races in the archive', races: uk ? 'Зафіксовані гонки' : 'Recorded races' };
  return <div className={`page ${styles.release}`} data-testid="driver-story">
    {origin && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageStructuredData(origin, locale, [{ name: 'Grid Atlas', path: '/' }, { name: uk ? 'Історії пілотів' : 'Driver stories', path: '/stories' }, { name: driver.name, path: `/stories/${slug}` }], pilot.prompt[locale])) }} />}
    <header className={styles.hero}>
      <div className={styles.art}><MotorsportArt kind="helmet" tone={pilot.tone} /></div>
      <div className={styles.heroCopy}><a className={styles.eyebrow} href={`/${locale}/stories`}>← {uk ? 'ІСТОРІЇ ПІЛОТІВ' : 'DRIVER STORIES'}</a>
        <p className={styles.years}>{career.summary.first_season ?? '—'}<span> — {career.summary.last_season ?? '—'}</span></p><h1>{driver.name}</h1><p className={styles.lead}>{pilot.prompt[locale]}</p>
        <a className={styles.button} href="#story-seasons">{uk ? 'Почати подорож' : 'Begin the journey'} ↓</a><p className={styles.note}>{uk ? 'Авторська абстрактна графіка. Не фотографія, не історична реконструкція.' : 'Original abstract artwork. Not a photograph or a historical reconstruction.'}</p></div>
    </header>
    <nav className={styles.chapterNav} aria-label={uk ? 'Розділи історії' : 'Story chapters'}>{[['story-seasons', uk ? 'Сезони' : 'Seasons'], ['story-teams', uk ? 'Команди' : 'Constructors'], ['story-races', uk ? 'Гонки' : 'Races'], ['story-connections', uk ? 'Зв’язки' : 'Connections'], ['story-context', uk ? 'Контекст і джерела' : 'Context & sources']].map(([id, title], i) => <a href={`#${id}`} key={id}><small>0{i + 1}</small>{title}</a>)}</nav>
    <section className={styles.opening} aria-labelledby="story-opening" data-story-reveal><div><p className={styles.eyebrow}>{uk ? 'ПОЧНІМО З ПРОТОКОЛУ' : 'START WITH A RECORD'}</p><h2 id="story-opening">{uk ? 'Історія має точку входу.' : 'Every story has a way in.'}</h2>
      {first ? <p>{uk ? 'Перша зафіксована гонка в цьому імпорті' : 'First recorded race in this import'}: <a href={`/${locale}/races/${first.id}`}>{first.year} · {first.name}</a>.</p> : <p>{uk ? 'У цьому імпорті немає гоночних результатів.' : 'This import contains no race results.'}</p>}
      <p>{uk ? 'Відкрийте гонку, простежте зв’язок із конструктором, а потім змініть рік. Усі цифри нижче — агрегати імпортованих результатів, не офіційні чемпіонатні підсумки.' : 'Open the race, follow its constructor connection, then change the year. Figures below aggregate imported results; they are not official championship standings.'}</p></div>
      <dl className={styles.metrics}>{[[labels.races, career.summary.races], [labels.entries, career.summary.result_entries], [labels.wins, career.summary.winning_races], [labels.years, years.length]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>
    <section id="story-seasons" className={styles.chapter} aria-labelledby="seasons-title" tabIndex={-1} data-story-reveal>
      <p className={styles.eyebrow}>01 / {uk ? 'КРІЗЬ РОКИ' : 'THROUGH THE YEARS'}</p><h2 id="seasons-title">{uk ? 'Змініть сезон. Змініть перспективу.' : 'Change the season. Change the perspective.'}</h2>
      <p>{uk ? 'Редакційна добірка років — початок дослідження, а не рейтинг досягнень.' : 'These curated years are starting points, not a ranking of achievements.'}</p>
      <nav className={styles.seasonRail} aria-label={uk ? 'Обрані сезони' : 'Selected seasons'}>{featured.map(y => <a key={y} href={`?year=${y}#story-seasons`} aria-current={year === y ? 'true' : undefined}><span>{y}</span><small>{uk ? 'Відкрити записи' : 'Open records'} ↗</small></a>)}</nav>
      {years.length > 0 && <form action={`/${locale}/stories/${slug}#story-seasons`} className={styles.selector}><label htmlFor="story-year">{uk ? 'Будь-який зафіксований сезон' : 'Any observed season'}</label><select id="story-year" name="year" defaultValue={year ?? undefined}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select><button type="submit">{uk ? 'Показати' : 'Explore'}</button></form>}
      {year !== null && <div className={styles.seasonPanel} data-testid="story-selected-season"><strong className={styles.bigYear}>{year}</strong><div><h3>{uk ? 'Слідами результатів' : 'Follow the results'}</h3><p>{labels.entries}: {selected.reduce((n, r) => n + r.result_entries, 0)} · {labels.races}: {new Set(selectedRecords.map(r => r.race_id)).size}</p>
        {selected.map(row => <p key={row.related_id}><a href={`/${locale}/constructors/${row.related_id}`}>{row.related_name}</a> · {row.result_entries} {labels.entries.toLowerCase()} · <a href={`/${locale}/atlas?kind=driver&id=${driver.id}&year=${year}&selected=${row.related_id}`}>{uk ? 'Відкрити зв’язок в Атласі' : 'Open connection in Atlas'} ↗</a></p>)}<a href={`/${locale}/seasons/${year}`}>{uk ? 'Усі гонки сезону' : 'All season races'} →</a></div></div>}
      {!years.length && <p>{uk ? 'Немає імпортованих сезонів.' : 'No imported seasons.'}</p>}
    </section>
    <section id="story-teams" className={styles.chapter} aria-labelledby="teams-title" tabIndex={-1} data-story-reveal><p className={styles.eyebrow}>02 / {uk ? 'КАР’ЄРНА МАПА' : 'CAREER MAP'}</p><h2 id="teams-title">{uk ? 'Роки та конструктори' : 'Years and constructors'}</h2>
      <CareerMap rows={career.participation} driverId={driver.id} locale={locale} />
      <ol className={styles.eras}>{eras.map(era => <li key={era.key}><span>{era.years[0]}{era.years.length > 1 ? `—${era.years.at(-1)}` : ''}</span><a href={`/${locale}/constructors/${era.id}`}>{era.name} ↗</a><small>{era.rows.reduce((n, r) => n + r.result_entries, 0)} {labels.entries.toLowerCase()}</small></li>)}</ol>
      <p className={styles.note}>{uk ? 'Це зв’язки у результатах гонок, не хронологія контрактів. Повернення й прогалини збережено; заявники та конструктори не ототожнюються.' : 'These are race-result associations, not a contract chronology. Returns and gaps are preserved; entrants and constructors are not conflated.'}</p>
    </section>
    <section id="story-races" className={styles.chapter} aria-labelledby="races-title" tabIndex={-1} data-story-reveal><p className={styles.eyebrow}>03 / {uk ? 'ЧОТИРИ ТОЧКИ ВХОДУ' : 'FOUR WAYS IN'}</p><h2 id="races-title">{uk ? 'Гонки, які можна дослідити' : 'Races you can explore'}</h2><div className={styles.raceGrid}>
      {records.filter(r => r.rows.length > 0).map(({ pick, rows }) => <article key={`${pick.year}:${pick.round}`}><p className={styles.eyebrow}>{pick.year} / {uk ? 'ЕТАП' : 'ROUND'} {pick.round}</p><h3><a href={`/${locale}/races/${rows[0].race_id}`}>{rows[0].race_name} ↗</a></h3>{rows.map((r, i) => <p key={i}>{r.constructor_name} · {uk ? 'Результат' : 'Result'}: <strong>{r.position_text}</strong></p>)}<a href={`/${locale}/drivers/${driver.id}?season=${pick.year}#driver-archive`}>{uk ? 'Протоколи пілота' : 'Driver result records'} →</a></article>)}
      {!records.some(r => r.rows.length) && <p>{uk ? 'Обраних гоночних записів у цьому імпорті немає.' : 'The selected race records are absent from this import.'}</p>}</div></section>
    <section id="story-connections" className={styles.connections} aria-labelledby="connections-title" tabIndex={-1} data-story-reveal><div className={styles.connectionArt}><MotorsportArt kind="grid" tone={pilot.tone} /></div><div><p className={styles.eyebrow}>04 / {uk ? 'ІНШИЙ ПОГЛЯД' : 'ANOTHER PERSPECTIVE'}</p><h2 id="connections-title">{uk ? 'Один сезон. Дві траєкторії.' : 'One season. Two trajectories.'}</h2>
      {related ? <><p>{driver.name} · {related.profile.name} / {pilot.peerYear}</p><p>{uk ? 'Відкрийте записи обох пілотів за той самий рік. Спільний сезон сам по собі не є доказом історичного суперництва.' : 'Open both drivers’ records for the same year. Sharing a season does not itself establish a historical rivalry.'}</p><a className={styles.button} href={`/${locale}/drivers/${related.profile.id}?season=${pilot.peerYear}#driver-career`}>{related.profile.name} →</a></> : <p>{uk ? 'Для іншої перспективи потрібні записи обох пілотів за той самий сезон.' : 'Another perspective requires observed records for both drivers in the same season.'}</p>}
      {year !== null && <p><a href={`/${locale}/atlas?kind=driver&id=${driver.id}&year=${year}`}>{uk ? 'Дослідити мережу в Атласі історії' : 'Explore the network in History Atlas'} ↗</a></p>}{compare && <a href={`/${locale}${compare}`}>{uk ? 'Порівняти краї кар’єри в Машині часу' : 'Compare career boundaries in Time Machine'} ↗</a>}</div></section>
    <section id="story-context" className={styles.chapter} aria-labelledby="context-title" tabIndex={-1}><p className={styles.eyebrow}>05 / {uk ? 'КОНТЕКСТ І ДОКАЗИ' : 'CONTEXT & EVIDENCE'}</p><h2 id="context-title">{uk ? 'Історія, яку можна перевірити' : 'History you can trace'}</h2>
      {article ? <PublishedChapters article={article} locale={locale} /> : <p data-testid="story-editorial-empty">{uk ? 'Схваленого історичного тексту цією мовою ще немає. Сезони, гонки та зв’язки вище доступні незалежно від біографії.' : 'No approved historical text is available in this language yet. Seasons, races and connections above remain independently available.'}</p>}
      <details className={styles.provenance}><summary>{uk ? 'Походження та межі архіву' : 'Archive provenance & limitations'}</summary><p>{career.attribution}</p><a href={career.source_url} rel="noreferrer">{career.source_slug} ↗</a><ul>{career.observations.map(o => <li key={`${o.release_tag}:${o.artifact_name}`}><strong>{o.release_tag}</strong> · {o.artifact_name}<code>{o.sha256}</code></li>)}</ul><p>{uk ? 'Пропущені записи не доводять відсутності участі. Кількість результатів не дорівнює офіційним стартам; очки імпортованих рядків не є чемпіонатним заліком.' : 'Missing records do not prove nonparticipation. Result counts are not official starts; imported result-row points are not championship standings.'}</p></details>
      <p><a href={`/${locale}/drivers/${driver.id}`}>{uk ? 'Повний профіль і докладна статистика' : 'Full profile & detailed statistics'} →</a> · <a href={`/${locale}/sources`}>{uk ? 'Політика джерел' : 'Source policy'} ↗</a></p>
    </section>
  </div>;
}
