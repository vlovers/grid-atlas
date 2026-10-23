import { EditorialHero, EditorialTabs, SourceAttribution } from '@/components/editorial/primitives';
import { ArchiveTable } from '@/components/editorial/archive-table';
import styles from './circuit.module.css';
import { MediaCollection } from '@/components/media/collection';
import mediaPublication from '@/components/media/publication.json';
import type { MediaAsset } from '@/components/media/registry';
import { ArchiveRhythm } from '@/components/stories/archive-rhythm';
import { ArchiveJourney } from '@/components/stories/archive-journey';
import { CircuitExperience, type CircuitLayout, type CircuitTechnicalEvent } from '@/components/circuit-experience';
import { selectCircuitCoverArtwork } from '@/components/circuit-layout-registry';
import { ArchivePlate } from '@/components/editorial/archive-plate';
import { CircuitCover } from '@/components/editorial/circuit-cover';
import { RecordReadingNote } from '@/components/editorial/record-reading-note';
import { archiveCopy } from '@/components/editorial/archive-copy';
import archiveStyles from '@/components/editorial/archive.module.css';
import { storyCopy } from '@/components/stories/copy';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routeMetadata } from '@/lib/seo';
import { entitySeo } from '@/lib/entity-seo';
import SeoBreadcrumbs from '@/components/seo-breadcrumbs';
import { getData } from '@/lib/api';
import { IdentityFacts, type IdentityDetails } from '@/components/identity-facts';
import { catalogueParams, pageHref, MAX_OFFSET, validId, type CatalogueParams } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';
const CIRCUIT_PAGE_SIZE = 25;
type Circuit = { id: string; name: string; external_id: string; races: number; first_season: number | null; last_season: number | null };
type Race = { id: string; season_year: number; round: number; race_date: string | null; official_name: string };
type CircuitHistory = { race_id: string; season_year: number; round: number; race_date: string | null; race_name: string; recorded_drivers: number; recorded_constructors: number; winner_entries: number; winners: { driver_id: string; driver_name: string; constructor_id: string; constructor_name: string }[] };
type Props = { params: Promise<{ id: string; locale: string }>; searchParams: Promise<CatalogueParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const t = await getTranslations('UI');
  const { id, locale } = await params;
  if (!validId(id)) return { title: t('circuitMissing') };
  const [{ title, description }, [circuit]] = await Promise.all([
    entitySeo('circuits', id, locale), getData<Circuit>(`/api/circuits/${id}`),
  ]);
  const { page } = catalogueParams(await searchParams);
  const offset = (page - 1) * CIRCUIT_PAGE_SIZE;
  const suffix = page > 1 ? ` · ${locale === 'uk' ? 'Сторінка' : 'Page'} ${page}` : '';
  return { ...routeMetadata(locale, pageHref(`/circuits/${id}`, page), page > 1 && offset >= circuit.races),
    title: `${title}${suffix}`, description: `${description}${suffix}` };
}

export default async function CircuitPage({ params, searchParams }: Props) {
  const t = await getTranslations('UI');
  const { id, locale } = await params;
  if (!validId(id)) notFound();
  const { page } = catalogueParams(await searchParams);
  const offset = (page - 1) * CIRCUIT_PAGE_SIZE;
  const [[circuit], races, history, identities, layouts, technicalEvents] = await Promise.all([
    getData<Circuit>(`/api/circuits/${id}`),
    getData<Race>(`/api/circuits/${id}/races?limit=${CIRCUIT_PAGE_SIZE}&offset=${offset}`),
    getData<CircuitHistory>(`/api/circuits/${id}/history`),
    getData<IdentityDetails>(`/api/circuits/${id}/identity`),
    getData<CircuitLayout>(`/api/circuits/${id}/layouts`),
    getData<CircuitTechnicalEvent>(`/api/circuits/${id}/technical-history`),
  ]);
  if (!circuit) notFound();
  const chronologicalHistory = [...history].sort((a, b) => a.season_year - b.season_year || a.round - b.round || Number(a.race_id) - Number(b.race_id));
  const winnerCounts = new Map<string, { id: string; name: string; races: Set<string> }>();
  for (const race of history) for (const winner of race.winners) {
    const prior = winnerCounts.get(winner.driver_id);
    if (prior) prior.races.add(race.race_id);
    else winnerCounts.set(winner.driver_id, { id: winner.driver_id, name: winner.driver_name, races: new Set([race.race_id]) });
  }
  const leadingWinners = [...winnerCounts.values()].sort((a,b) => b.races.size-a.races.size || a.name.localeCompare(b.name)).slice(0,6);
  const path = `/circuits/${id}`;
  const decades = new Map<number, Race[]>();
  for (const race of races) {
    const decade = Math.floor(race.season_year / 10) * 10;
    decades.set(decade, [...(decades.get(decade) ?? []), race]);
  }
  const { crumbs, description } = await entitySeo('circuits', id, locale);
  const coverArtwork = selectCircuitCoverArtwork(layouts);
  const currentCrumbs = crumbs.map((crumb, index) => index === crumbs.length - 1
    ? { ...crumb, path: pageHref(path, page) } : crumb);
  const a = archiveCopy[locale === 'en' ? 'en' : 'uk'];
  return <><SeoBreadcrumbs locale={locale} crumbs={currentCrumbs} description={description} /><section className={`page ${archiveStyles.page} ${styles.dossier}`} data-testid="circuit-dossier">
    <EditorialHero title={circuit.name} eyebrow={storyCopy[locale as 'uk' | 'en'].circuitHeader}
      context={<><span>{circuit.first_season ?? '—'}—{circuit.last_season ?? '—'}</span><span>{identities[0]?.fields.country}</span></>}
      lead={t('circuitLayouts')} media={coverArtwork ? <CircuitCover circuitArtwork={coverArtwork} title={circuit.name} locale={locale === 'en' ? 'en' : 'uk'} /> : <ArchivePlate marker={String(circuit.first_season ?? '—')} label={a.history} note={a.evidenceNote}
        entries={chronologicalHistory.slice(0, 3).map(race => ({ id: race.race_id, href: `/races/${race.race_id}`, title: race.race_name, meta: `${race.season_year} / R${race.round}` }))} />}
      actions={<><a href="#circuit-layouts">{a.identity} ↓</a><a href="#circuit-history">{a.history} ↓</a></>}
      statistics={[{ label: t('grandsPrix'), value: circuit.races }, { label: a.layouts, value: layouts.length }, { label: t('seasons'), value: new Set(history.map(race => race.season_year)).size }]} scope={a.scope} />
    <SourceAttribution locale={locale === 'en' ? 'en' : 'uk'} />
    <EditorialTabs label={locale === 'uk' ? 'Розділи траси' : 'Circuit sections'} items={[
      { id: 'circuit-layouts', label: locale === 'uk' ? 'Конфігурації' : 'Layouts' },
      { id: 'circuit-chronology', label: locale === 'uk' ? 'Хронологія' : 'Chronology' },
      { id: 'circuit-results', label: locale === 'uk' ? 'Результати' : 'Results' },
      { id: 'circuit-archive', label: locale === 'uk' ? 'Архів і джерела' : 'Archive & sources' },
    ]} />
    <RecordReadingNote kind="circuit" locale={locale === 'en' ? 'en' : 'uk'} />
    <div id="circuit-layouts" tabIndex={-1}><CircuitExperience layouts={layouts} events={technicalEvents} locale={locale === 'en' ? 'en' : 'uk'} /></div>
    <div id="circuit-history" tabIndex={-1}><div id="circuit-chronology" tabIndex={-1}><ArchiveRhythm testId="circuit-archive-rhythm" locale={locale === 'en' ? 'en' : 'uk'} title={locale === 'uk' ? 'Хронологія Гран-прі' : 'Grand Prix chronology'} description={locale === 'uk' ? 'Усі зафіксовані етапи на цій трасі за роками.' : 'All recorded events at this circuit, arranged by year.'} entries={chronologicalHistory.map(race => ({ id: race.race_id, year: race.season_year, label: race.race_name, href: `/races/${race.race_id}`, detail: `R${race.round}` }))} /></div></div>
    <div data-testid="circuit-era-journey"><ArchiveJourney editorial testId="circuit-visual-journey" locale={locale === 'en' ? 'en' : 'uk'} title={locale === 'uk' ? 'Гран-прі крізь роки' : 'Grands Prix across the years'} description={locale === 'uk' ? 'Події з історичного архіву цієї траси. Це хронологічна навігація, а не рейтинг найважливіших гонок.' : 'Recorded events at this circuit. A chronological archive journey, not a ranking of the most important races.'} items={chronologicalHistory.length ? [chronologicalHistory[0], ...(chronologicalHistory.length > 2 ? [chronologicalHistory[Math.floor((chronologicalHistory.length - 1) / 2)]] : []), ...(chronologicalHistory.length > 1 ? [chronologicalHistory[chronologicalHistory.length - 1]] : [])].map(entry => ({ id: entry.race_id, href: `/races/${entry.race_id}`, year: entry.season_year, overline: `R${entry.round}`, title: entry.race_name, detail: entry.winners.length ? entry.winners.map(w => w.driver_name).join(', ') : undefined })) : []} /><p>{locale === 'uk' ? 'Послідовність не підтверджує незмінну конфігурацію траси.' : 'The sequence does not establish an unchanged circuit layout.'}</p></div>
    <section aria-labelledby="circuit-result-legends" data-testid="circuit-result-legends">
      <h2 id="circuit-result-legends">{locale === 'uk' ? 'Пілоти, що неодноразово перемагали тут' : 'Drivers with repeated recorded wins here'}</h2>
      <p>{locale === 'uk'
        ? 'Показано кількість різних гонок, де пілот має запис із першою позицією на цій трасі. Це не універсальний офіційний рекорд усіх конфігурацій.'
        : 'Counts are distinct archived Grands Prix with a first-position result entry for that driver at this circuit identity. This is not an official all-layout record.'}</p>
      {leadingWinners.length ? <ol className="records">{leadingWinners.map(driver =>
        <li className="record" key={driver.id}><span className="position">{driver.races.size}</span>
          <span><strong><Link href={`/drivers/${driver.id}`}>{driver.name} ↗</Link></strong>
          <small>{locale === 'uk' ? 'Гонки з першою позицією в результатах' : 'Races with first-position entries'}</small></span></li>)}</ol>
        : <p>{locale === 'uk' ? 'Переможних записів у цьому архіві немає.' : 'No first-position entries in this archive.'}</p>}
    </section>
    <section id="circuit-results" tabIndex={-1} aria-label={locale === 'uk' ? 'Історія траси за десятиліттями' : 'Circuit history by decade'}>
      <h2>{locale === 'uk' ? 'Епохи траси' : 'Circuit eras'}</h2>
      <p>{locale === 'uk' ? 'Гран-прі згруповано за десятиліттями за датами в архіві. Кількість переможців — це записи з першою позицією, а не окремо підтверджений офіційний протокол.' : 'Grands Prix are grouped by archived decades. Winners are first-position result entries, not independently verified official classifications.'}</p>
      <div className="driver-grid">{[...new Set(history.map(race => Math.floor(race.season_year / 10) * 10))].sort((a,b) => b-a).map(decade => {
        const events = history.filter(race => Math.floor(race.season_year / 10) * 10 === decade);
        return <article className="driver" key={decade}>
          <span className="index">{decade}–{decade+9}</span>
          <h3>{events.length} {locale === 'uk' ? 'Гран-прі' : 'Grands Prix'}</h3>
          <p>{events.map(race => race.season_year).join(' · ')}</p>
        </article>;
      })}</div>
      <h2>{locale === 'uk' ? 'Переможці та результати' : 'Winners and results'}</h2>
      {history.length ? <ArchiveTable label={locale === 'uk' ? 'Переможці та результати' : 'Winners and results'} locale={locale === 'en' ? 'en' : 'uk'}><table data-testid="circuit-history-table">
        <thead><tr><th scope="col">{locale === 'uk' ? 'Сезон' : 'Season'}</th><th scope="col">{locale === 'uk' ? 'Гран-прі' : 'Grand Prix'}</th><th scope="col">{locale === 'uk' ? 'Переможні записи' : 'Winning entries'}</th><th scope="col">{locale === 'uk' ? 'Пілоти в результатах' : 'Recorded drivers'}</th></tr></thead>
        <tbody>{history.slice(offset, offset + CIRCUIT_PAGE_SIZE).map(race => <tr key={race.race_id}>
          <th scope="row"><Link href={`/seasons/${race.season_year}`}>{race.season_year}</Link></th>
          <td><Link href={`/races/${race.race_id}`}>{race.race_name}</Link></td>
          <td>{race.winners.length ? race.winners.map(winner => <div key={`${winner.driver_id}:${winner.constructor_id}`}><Link href={`/drivers/${winner.driver_id}`}>{winner.driver_name}</Link> · <Link href={`/constructors/${winner.constructor_id}`}>{winner.constructor_name}</Link></div>) : '—'}</td>
          <td>{race.recorded_drivers}</td>
        </tr>)}</tbody>
      </table></ArchiveTable> : <p>{locale === 'uk' ? 'Немає зафіксованих Гран-прі.' : 'No recorded Grands Prix.'}</p>}
    </section>
    <section aria-labelledby="circuit-archive-overview" data-testid="circuit-archive-overview">
      <h2 id="circuit-archive-overview">{locale === 'uk' ? 'Історія проведених Гран-прі' : 'Recorded Grand Prix history'}</h2>
      <p>{locale === 'uk'
        ? `Архів пов’язує трасу ${circuit.name} із ${circuit.races} гонками${circuit.first_season !== null ? ` починаючи із сезону ${circuit.first_season}` : ''}${circuit.last_season !== null && circuit.last_season !== circuit.first_season ? ` і до ${circuit.last_season} року` : ''}. Нижче наведено офіційні назви та дати імпортованих етапів.`
        : `The historical archive associates ${circuit.name} with ${circuit.races} races${circuit.first_season !== null ? `, beginning in ${circuit.first_season}` : ''}${circuit.last_season !== null && circuit.last_season !== circuit.first_season ? ` and extending through ${circuit.last_season}` : ''}. The imported event names and dates are listed below.`}</p>
      <p>{locale === 'uk' ? 'Запис про трасу не підтверджує незмінність її конфігурації, довжини чи рекордів кола в різні роки. Схеми трас публікуватимуться лише після перевірки історичної конфігурації та прав на зображення.' : 'A circuit identity does not establish that its layout, length or lap records stayed the same across eras. Track maps require separate historical-layout verification and image-rights clearance.'} <Link href="/sources">{locale === 'uk' ? 'Джерела архіву' : 'Archive sources'} ↗</Link></p>
    </section>
    <h2>{t('grandPrixHistory')}</h2>
    {races.length ? <div data-testid="circuit-decade-history">
      <p>{locale === 'uk' ? 'Гран-прі за десятиліттями в межах цієї сторінки архіву. Кожен запис веде до конкретної гонки; рік — до сезону.' : 'Grand Prix by decade within this archive page. Each result links to its race; the year links to its season.'}</p>
      {[...decades].map(([decade, events]) => <section key={decade} aria-label={`${decade}s`}>
        <h3>{decade}–{decade + 9}</h3>
        <div className="records">{events.map(race => <div className="record" key={race.id}>
          <span className="position"><Link href={`/seasons/${race.season_year}`}>{race.season_year}</Link></span>
          <span><strong><Link href={`/races/${race.id}`}>{race.official_name} ↗</Link></strong>
            <small>{t('round', { round: race.round })}{race.race_date ? ` · ${race.race_date}` : ''}</small></span>
        </div>)}</div>
      </section>)}
    </div> : <p>{t('noCircuitRaces')}</p>}
    <nav className="actions" aria-label={t('circuitPages')}>
      {page > 1 && <a className="secondary" href={`/${locale}${pageHref(path, page - 1)}`}>← {t('previous')}</a>}
      {offset + CIRCUIT_PAGE_SIZE < circuit.races && offset + CIRCUIT_PAGE_SIZE <= MAX_OFFSET && <a className="secondary" href={`/${locale}${pageHref(path, page + 1)}`}>{t('next')} →</a>}
    </nav>
    <section id="circuit-archive" tabIndex={-1} aria-label={locale === 'uk' ? 'Архів і джерела траси' : 'Circuit archive and sources'}>
      <IdentityFacts identity={identities[0]} locale={locale === 'en' ? 'en' : 'uk'} />
      <MediaCollection assets={mediaPublication.assets as MediaAsset[]} subject={{type:'circuit',id:circuit.external_id}} label={circuit.name} locale={locale==='en'?'en':'uk'}/>
    </section>
    <Link className="back" href="/circuits">← {t('allCircuits')}</Link>
  </section></>;
}
