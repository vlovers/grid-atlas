import { StoryHeader } from '@/components/stories/story-header';
import { storyCopy } from '@/components/stories/copy';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData } from '@/lib/api';
export const dynamic = 'force-dynamic';
type Profile = { id: string; name: string; external_id: string; result_entries: number; races: number; seasons: number; first_season: number | null; last_season: number | null; wins: number; podium_finishes: number; driver_points: string };
type Season = { year: number; races: number; wins: number; podium_finishes: number; driver_points: string };
type Lineage = { id: string; subject_id: string; subject_name: string; object_id: string; object_name: string; relation_type: string; effective_year: number | null; source_url: string; source_title: string; source_publisher: string; evidence_note: string };
type Props = { params: Promise<{ id: string }> };
const valid = (id: string) => /^[1-9][0-9]*$/.test(id) && Number(id) <= 2147483647;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!valid(id)) return { title: t('constructorMissing') };
  const data = await getData<Profile>(`/api/constructors/${id}`);
  return { title: data[0] ? `${data[0].name} — ${t('constructor')}` : t('constructorMissing') };
}
export default async function ConstructorProfile({ params }: Props) {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!valid(id)) notFound();
  const [profiles, seasons, lineage] = await Promise.all([
    getData<Profile>(`/api/constructors/${id}`),
    getData<Season>(`/api/constructors/${id}/seasons`),
    getData<Lineage>(`/api/constructors/${id}/lineage`),
  ]);
  const locale = await getLocale() as 'uk' | 'en';
  const team = profiles[0];
  if (!team) notFound();
  return <section className="page">
    <StoryHeader title={team.name} eyebrow={storyCopy[locale].constructorHeader} locale={locale} kind="velocity" marker={team.first_season ?? undefined} lead={t('constructorLead')} />
    <div className="driver-grid" aria-label={t('constructorStats')}>
      {([[t('seasons'),team.seasons],[t('races'),team.races],[t('wins'),team.wins],[t('driverPodiums'),team.podium_finishes],[t('driverPoints'),team.driver_points]] as const).map(([label,value])=><article className="driver" key={label}><span className="index">{label}</span><h2>{value}</h2></article>)}
    </div>
    {seasons.length > 0 && <p>
      <Link href={`/explorer/constructors/${id}?year=${seasons[0].year}`}>
        {t('constructor')}: {t('season')} {seasons[0].year} → Explorer
      </Link>
    </p>}
    <section aria-labelledby="constructor-archive-overview" data-testid="constructor-archive-overview">
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
    {seasons.length ? <div className="table-scroll"><table><thead><tr><th>{t('season')}</th><th>{t('races')}</th><th>{t('wins')}</th><th>{t('driverPodiums')}</th><th>{t('driverPoints')}</th></tr></thead><tbody>
      {seasons.map(s=><tr key={s.year}><td><Link href={`/seasons/${s.year}`}>{s.year}</Link></td><td>{s.races}</td><td>{s.wins}</td><td>{s.podium_finishes}</td><td>{s.driver_points}</td></tr>)}
    </tbody></table></div> : <p>{t('noResults')}</p>}
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
    <Link className="back" href="/constructors">← {t('allConstructors')}</Link>
  </section>;
}
