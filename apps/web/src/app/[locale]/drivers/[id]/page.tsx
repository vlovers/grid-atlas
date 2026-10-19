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
  const [profiles, seasons, teams, article] = await Promise.all([
    getData<Profile>(`/api/drivers/${id}`),
    getData<SeasonSummary>(`/api/drivers/${id}/seasons`),
    getData<TeamSeason>(`/api/drivers/${id}/teams`),
    getPublishedArticle(id, locale === 'en' ? 'en' : 'uk'),
  ]);
  const driver = profiles[0];
  if (!driver) notFound();
  return <section className="page">
    <p className="eyebrow">{t('archive')} / {t('driver')} · {driver.external_id}</p>
    <h1>{driver.name}</h1>
    <p className="lead">{t('driverLead')}</p>
    {article && <section aria-label={article.title} className="editorial-article">
      <h2>{article.title}</h2>
      {article.body_markdown.split(/\\n\\s*\\n/).filter(Boolean).map((paragraph, index) =>
        <p key={index}>{paragraph}</p>)}
    </section>}
    <div className="driver-grid" aria-label={t('careerStats')}>
      {([[t('seasons'), driver.seasons], [t('appearances'), driver.starts], [t('wins'), driver.wins], [t('podiums'), driver.podiums], [t('points'), driver.points]] as const).map(([label, value]) =>
        <article className="driver" key={label}><span className="index">{label}</span><h2>{value}</h2></article>)}
    </div>
    <h2>{t('careerTimeline')}</h2>
    <p>{t('careerLead')}</p>
    {driver.first_season !== null && driver.last_season !== null && teams.length > 0 &&
      <div className="timeline-scroll" role="region" aria-label={t('careerRegion')} tabIndex={0}>
        <div className="career-timeline" style={{ gridTemplateColumns: `repeat(${driver.last_season - driver.first_season + 1}, minmax(140px,1fr))` }}>
          {Array.from({ length: driver.last_season - driver.first_season + 1 }, (_, i) => {
            const year = driver.first_season! + i;
            const entries = teams.filter(t => t.year === year);
            return <section className={entries.length ? 'career-year active' : 'career-year inactive'} key={year}>
              <Link href={`/seasons/${year}`} className="career-year-label">{year} ↗</Link>
              {entries.length ? entries.map(team => <Link key={team.constructor_id} className="career-team" href={`/constructors/${team.constructor_id}`} title={t('raceWins', { races: team.races, wins: team.wins })}>
                <strong>{team.constructor_name}</strong><small>{t('raceWins', { races: team.races, wins: team.wins })}</small>
              </Link>) : <small>{t('noResultsShort')}</small>}
            </section>;
          })}
        </div>
      </div>}
    <h2>{t('seasonResults')}</h2>
    {seasons.length ? <div className="table-scroll"><table><thead><tr><th>{t('season')}</th><th>{t('appearances')}</th><th>{t('wins')}</th><th>{t('podiums')}</th><th>{t('points')}</th></tr></thead><tbody>{seasons.map(s =>
      <tr key={s.year}><td><Link href={`/seasons/${s.year}`}>{s.year}</Link></td><td>{s.starts}</td><td>{s.wins}</td><td>{s.podiums}</td><td>{s.points}</td></tr>
    )}</tbody></table></div> : <p>{t('noResults')}</p>}
    <h2>{t('seasonTeams')}</h2>
    <p>{t('seasonTeamsLead')}</p>
    {teams.length ? <div className="table-scroll"><table><thead><tr><th>{t('season')}</th><th>{t('constructor')}</th><th>{t('races')}</th><th>{t('wins')}</th></tr></thead><tbody>{teams.map(team=>
      <tr key={`${team.year}-${team.constructor_id}`}><td><Link href={`/seasons/${team.year}`}>{team.year}</Link></td><td><Link href={`/constructors/${team.constructor_id}`}>{team.constructor_name} ↗</Link></td><td>{team.races}</td><td>{team.wins}</td></tr>
    )}</tbody></table></div> : <p>{t('noTeams')}</p>}
    <Link className="back" href="/drivers">← {t('allDrivers')}</Link>
  </section>;
}
