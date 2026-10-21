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
type DriverRoster = { driver_id: string; driver_name: string; races: number; wins: number };
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
  const [profiles, seasons, lineage] = await Promise.all([
    getData<Profile>(`/api/constructors/${id}`),
    getData<Season>(`/api/constructors/${id}/seasons`),
    getData<Lineage>(`/api/constructors/${id}/lineage`),
  ]);
  const locale = await getLocale() as 'uk' | 'en';
  const team = profiles[0];
  if (!team) notFound();
  const query = await searchParams;
  const requestedYear = typeof query.season === 'string' && /^\d{4}$/.test(query.season) ? Number(query.season) : null;
  const selectedSeason = seasons.find(season => season.year === requestedYear) ?? seasons.reduce<Season | undefined>((latest, season) => !latest || season.year > latest.year ? season : latest, undefined);
  const firstRecordedSeason = seasons.reduce<Season | undefined>((earliest, season) => !earliest || season.year < earliest.year ? season : earliest, undefined);
  const roster = selectedSeason ? await getData<DriverRoster>(`/api/constructors/${id}/seasons/${selectedSeason.year}/drivers`) : [];
  return <section className="page">
    <StoryHeader title={team.name} eyebrow={storyCopy[locale].constructorHeader} locale={locale} kind="velocity" marker={team.first_season ?? undefined} lead={t('constructorLead')} />
    <div className="driver-grid" aria-label={t('constructorStats')}>
      {([[t('seasons'),team.seasons],[t('races'),team.races],[t('wins'),team.wins],[t('driverPodiums'),team.podium_finishes],[t('driverPoints'),team.driver_points]] as const).map(([label,value])=><article className="driver" key={label}><span className="index">{label}</span><h2>{value}</h2></article>)}
    </div>
    {seasons.length > 0 && <p>
      <Link href={`/explorer/constructors/${id}?year=${firstRecordedSeason?.year}`}>
        {t('constructor')}: {t('season')} {firstRecordedSeason?.year} → Explorer
      </Link>
    </p>}
    <section aria-label={locale === 'uk' ? 'Історичний профіль команди' : 'Constructor history facts'}>
      <h2>{locale === 'uk' ? 'Історичні факти' : 'Historical quick facts'}</h2>
      <div className="driver-grid">
        {team.first_season !== null && <article className="driver"><span className="index">{locale === 'uk' ? 'Перший сезон у базі' : 'First recorded season'}</span><h3><Link href={`/seasons/${team.first_season}`}>{team.first_season}</Link></h3></article>}
        {team.last_season !== null && <article className="driver"><span className="index">{locale === 'uk' ? 'Останній сезон у базі' : 'Latest recorded season'}</span><h3><Link href={`/seasons/${team.last_season}`}>{team.last_season}</Link></h3></article>}
        <article className="driver"><span className="index">{locale === 'uk' ? 'Подіуми пілотів у результатах' : 'Driver podium result entries'}</span><h3>{team.podium_finishes}</h3></article>
      </div>
      <p>{locale === 'uk' ? 'Показники відображають зафіксовані результати перегонів, а не офіційні очки чи місце в Кубку конструкторів. Технічні характеристики болідів і керівництво команди будуть показані лише після перевірки джерел для конкретного року.' : 'Figures reflect recorded race results, not official Constructors’ Championship points or standings. Chassis, engine and team leadership require independently verified season-specific sources.'}</p>
    </section>
    {selectedSeason && <section aria-label={locale === 'uk' ? 'Показники команди за сезон' : 'Constructor season results'}>
      <h2>{locale === 'uk' ? 'Сезон команди' : 'Team season'}</h2>
      <nav className="timeline-scroll" aria-label={locale === 'uk' ? 'Оберіть сезон' : 'Select a season'}>
        {seasons.map(season => <Link key={season.year} href={`/constructors/${id}?season=${season.year}`}
          aria-current={selectedSeason.year === season.year ? 'page' : undefined}
          className={selectedSeason.year === season.year ? 'timeline-year active' : 'timeline-year'}>{season.year}</Link>)}
      </nav>
      <div className="driver-grid">
        {([[locale === 'uk' ? 'Гонки' : 'Races', selectedSeason.races],
          [locale === 'uk' ? 'Перемоги' : 'Wins', selectedSeason.wins],
          [locale === 'uk' ? 'Подіуми пілотів' : 'Driver podium entries', selectedSeason.podium_finishes],
          [locale === 'uk' ? 'Очки пілотів у результатах' : 'Driver result points', selectedSeason.driver_points]] as const).map(([label, value]) =>
          <article className="driver" key={label}><span className="index">{label}</span><h3>{value}</h3></article>)}
      </div>
      <p>{locale === 'uk' ? 'Це статистика результатів гонок, а не офіційний залік Кубка конструкторів. Склад пілотів і технічні дані за сезонами потребують окремих підтверджених записів.' : 'These are race-result statistics, not official Constructors’ Championship standings. Season-specific lineups and technical facts require separately verified records.'}</p>
    </section>}
    {selectedSeason && <section aria-label={locale === 'uk' ? 'Пілоти команди в обраному сезоні' : 'Constructor drivers in selected season'}>
      <h2>{locale === 'uk' ? 'Пілоти сезону' : 'Season driver roster'} · {selectedSeason.year}</h2>
      {roster.length > 0 ? <div className="lineup-grid">{roster.map(driver => <article className="lineup-team" key={driver.driver_id}>
        <h3><Link href={`/drivers/${driver.driver_id}`}>{driver.driver_name}</Link></h3>
        <p>{locale === 'uk' ? 'Гонки з результатами' : 'Races with recorded results'}: {driver.races} · {locale === 'uk' ? 'Перемоги' : 'Wins'}: {driver.wins}</p>
      </article>)}</div> : <p>{locale === 'uk' ? 'У цьому сезоні немає записів про пілотів.' : 'No driver entries are recorded for this season.'}</p>}
      <p>{locale === 'uk' ? 'Склад сформовано з результатів перегонів, а не з контрактів або заявок на весь сезон.' : 'This roster is derived from race results, not full-season contracts or entry lists.'}</p>
    </section>}
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
