import { LicensedMedia } from '@/components/media/licensed-media';
import type { MediaAsset } from '@/components/media/registry';
import mediaPublication from '@/components/media/publication.json';
import styles from './driver-hero.module.css';
import { QuickFacts, CareerTimeline, RelatedJourneys } from '@/components/discovery';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData, getPublishedArticle } from '@/lib/api';

export const dynamic = 'force-dynamic';
type Profile = { id: string; name: string; external_id: string; starts: number; seasons: number; first_season: number | null; last_season: number | null; wins: number; podiums: number; points: string };
type SeasonSummary = { year: number; starts: number; wins: number; podiums: number; points: string };
type TeamSeason = { year: number; constructor_id: string; constructor_name: string; races: number; wins: number };
type Props = { params: Promise<{ id: string; locale: string }> };
type Career = {
  summary: { result_entries: number; races: number; seasons: number; winning_races: number; recorded_points: string | null };
  participation: { year: number; related_id: string; related_name: string; races: number; result_entries: number }[];
  source_slug: string; source_url: string; attribution: string;
};

function validId(id: string) { return /^[1-9][0-9]*$/.test(id) && Number(id) <= 2147483647; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!validId(id)) return { title: t('driverMissing') };
  const profiles = await getData<Profile>(`/api/drivers/${id}`);
  return { title: profiles[0]?.name ?? t('driverMissing') };
}

export default async function DriverProfile({ params }: Props) {
  const t = await getTranslations('UI');
  const { id, locale } = await params;
  if (!validId(id)) notFound();
  const [profiles, seasons, teams, careers, article] = await Promise.all([
    getData<Profile>(`/api/drivers/${id}`),
    getData<SeasonSummary>(`/api/drivers/${id}/seasons`),
    getData<TeamSeason>(`/api/drivers/${id}/teams`),
    getData<Career>(`/api/drivers/${id}/career`),
    getPublishedArticle(id, locale === 'en' ? 'en' : 'uk'),
  ]);
  const driver = profiles[0];
  if (!driver) notFound();
  const career = careers[0];
  const timeline = career?.participation.map(row => ({
    id: `${row.year}:${row.related_id}`,
    period: String(row.year),
    title: row.related_name,
    summary: t('goldenTimelineSummary', { races: row.races, entries: row.result_entries }),
    entities: [{ id: `constructor:${row.related_id}`, href: `/constructors/${row.related_id}`, label: row.related_name }],
    destination: { href: `/seasons/${row.year}`, label: t('goldenExploreSeason') },
  })) ?? [];
  return <section className="page">
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <p className="eyebrow">{t('archive')} / {t('driver')} · {driver.external_id}</p>
        <h1>{driver.name}</h1>
        <p className="lead">{t('driverLead')}</p>
        <div className={styles.metrics} aria-label={locale === 'uk' ? 'Показники архіву' : 'Archive indicators'}>
          <div><strong>{driver.seasons}</strong><span>{t('seasons')}</span></div>
          <div><strong>{driver.wins}</strong><span>{t('wins')}</span></div>
          <div><strong>{driver.podiums}</strong><span>{t('podiums')}</span></div>
        </div>
        <p className={styles.scope}>{t('goldenArchiveScope')}</p>
        {driver.first_season !== null && <Link className={styles.jump} href={`/seasons/${driver.first_season}`}>{locale === 'uk' ? 'Почати з першого сезону' : 'Start with first recorded season'} ↗</Link>}
      </div>
      <div className={styles.visual}>
        <LicensedMedia assets={mediaPublication.assets as MediaAsset[]} subject={{ type: 'driver', id: driver.external_id }} label={driver.name} locale={locale === 'en' ? 'en' : 'uk'} />
      </div>
    </header>
    <nav className={styles.sectionNav} aria-label={locale === 'uk' ? 'Розділи профілю' : 'Profile sections'}>
      {article && <a href="#driver-biography">{locale === 'uk' ? 'Біографія' : 'Biography'} <span aria-hidden="true">↘</span></a>}
      {career && <a href="#driver-career">{locale === 'uk' ? 'Кар’єра' : 'Career'} <span aria-hidden="true">↘</span></a>}
      <a href="#driver-seasons">{locale === 'uk' ? 'Результати сезонів' : 'Season results'} <span aria-hidden="true">↘</span></a>
      <a href="#driver-teams">{locale === 'uk' ? 'Команди' : 'Teams'} <span aria-hidden="true">↘</span></a>
    </nav>
    {article && <section id="driver-biography" aria-label={article.title} className="editorial-article">
      <h2>{article.title}</h2>
      {article.body_markdown.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) =>
        <p key={index}>{paragraph}</p>)}
      {article.references?.length > 0 && <aside aria-label={locale === 'uk' ? 'Джерела' : 'Sources'}>
        <h3>{locale === 'uk' ? 'Джерела' : 'Sources'}</h3>
        <ol>{article.references.map(source => <li key={source.url}>
          <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a> — {source.publisher}
        </li>)}</ol>
      </aside>}
    </section>}
    {career && career.participation.length > 0 && <p>
      <Link href={`/explorer/drivers/${id}?year=${career.participation[0].year}`}>
        {locale === 'uk' ? 'Дослідити зв’язки за сезоном →' : 'Explore season connections →'}
      </Link>
    </p>}
    <div id="driver-career" className={styles.sectionAnchor} />
    {career && <QuickFacts
      label={t('goldenFacts')}
      unavailableLabel={t('goldenUnknown')}
      emptyLabel={t('noResults')}
      note={t('goldenArchiveScope')}
      facts={[
        { id: 'races', label: t('goldenRecordedRaces'), value: String(career.summary.races) },
        { id: 'wins', label: t('goldenWinningRaces'), value: String(career.summary.winning_races) },
        { id: 'seasons', label: t('seasons'), value: String(career.summary.seasons) },
        { id: 'points', label: t('goldenRecordedPoints'), value: career.summary.recorded_points },
      ]}
    />}
    {career && <CareerTimeline
      label={t('goldenCareer')}
      entries={timeline}
      emptyLabel={t('noTeams')}
      note={t('goldenCareerScope')}
    />}
    {career && <RelatedJourneys
      label={t('goldenJourneys')}
      items={career.participation.slice(0, 3).map(row => ({
        id: `driver:${id}:constructor:${row.related_id}:year:${row.year}`,
        kind: t('constructor'),
        destination: { href: `/constructors/${row.related_id}`, label: row.related_name },
        relationship: t('goldenJourneyRelation', { year: row.year }),
        context: t('goldenTimelineSummary', { races: row.races, entries: row.result_entries }),
      }))}
      emptyLabel={t('noTeams')}
    />}
    <h2 id="driver-seasons" className={styles.sectionAnchor}>{t('seasonResults')}</h2>
    {seasons.length ? <div className="table-scroll"><table><thead><tr><th>{t('season')}</th><th>{t('appearances')}</th><th>{t('wins')}</th><th>{t('podiums')}</th><th>{t('points')}</th></tr></thead><tbody>{seasons.map(s =>
      <tr key={s.year}><td><Link href={`/seasons/${s.year}`}>{s.year}</Link></td><td>{s.starts}</td><td>{s.wins}</td><td>{s.podiums}</td><td>{s.points}</td></tr>
    )}</tbody></table></div> : <p>{t('noResults')}</p>}
    <h2 id="driver-teams" className={styles.sectionAnchor}>{t('seasonTeams')}</h2>
    <p>{t('seasonTeamsLead')}</p>
    {teams.length ? <div className="table-scroll"><table><thead><tr><th>{t('season')}</th><th>{t('constructor')}</th><th>{t('races')}</th><th>{t('wins')}</th></tr></thead><tbody>{teams.map(team=>
      <tr key={`${team.year}-${team.constructor_id}`}><td><Link href={`/seasons/${team.year}`}>{team.year}</Link></td><td><Link href={`/constructors/${team.constructor_id}`}>{team.constructor_name} ↗</Link></td><td>{team.races}</td><td>{team.wins}</td></tr>
    )}</tbody></table></div> : <p>{t('noTeams')}</p>}
    <Link className="back" href="/drivers">← {t('allDrivers')}</Link>
  </section>;
}
