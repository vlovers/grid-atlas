import { MediaCollection } from '@/components/media/collection';
import { LicensedMedia } from '@/components/media/licensed-media';
import { selectMediaCollection, type MediaAsset } from '@/components/media/registry';
import mediaPublication from '@/components/media/publication.json';
import { CircuitLayoutGallery } from '@/components/editorial/circuit-layout-gallery';
import { EditorialHero, EditorialTabs, SourceAttribution, ArchiveDisclosure } from '@/components/editorial/primitives';
import { ArchiveTable } from '@/components/editorial/archive-table';
import { CircuitExperience, type CircuitLayout, type CircuitTechnicalEvent } from '@/components/circuit-experience';
import { selectCircuitCoverArtwork } from '@/components/circuit-layout-registry';
import { CircuitCover } from '@/components/editorial/circuit-cover';
import { IdentityFacts, type IdentityDetails } from '@/components/identity-facts';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routeMetadata } from '@/lib/seo';
import { entitySeo } from '@/lib/entity-seo';
import SeoBreadcrumbs from '@/components/seo-breadcrumbs';
import { getData, getOptionalPublishedCircuitArticle } from '@/lib/api';
import { CircuitReviewedArticle } from '@/components/editorial/circuit-reviewed-article';
import { catalogueParams, pageHref, validId, type CatalogueParams } from '@/lib/catalogue';
import styles from './circuit.module.css';

export const dynamic = 'force-dynamic';
const CIRCUIT_PAGE_SIZE = 25;
type Circuit = { id: string; name: string; external_id: string; races: number; first_season: number | null; last_season: number | null };
type CircuitHistory = { race_id: string; season_year: number; round: number; race_date: string | null; race_name: string; recorded_drivers: number; recorded_constructors: number; winner_entries: number; winners: { driver_id: string; driver_name: string; constructor_id: string; constructor_name: string }[] };
type Props = { params: Promise<{ id: string; locale: string }>; searchParams: Promise<CatalogueParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const t = await getTranslations('UI');
  const { id, locale } = await params;
  if (!validId(id)) return { title: t('circuitMissing') };
  const [{ title, description }, [circuit]] = await Promise.all([
    entitySeo('circuits', id, locale), getData<Circuit>(`/api/circuits/${id}`),
  ]);
  const { page, q } = catalogueParams(await searchParams);
  const offset = (page - 1) * CIRCUIT_PAGE_SIZE;
  const suffix = page > 1 ? ` · ${locale === 'uk' ? 'Сторінка' : 'Page'} ${page}` : '';
  return { ...routeMetadata(locale, pageHref(`/circuits/${id}`, page), Boolean(q) || (page > 1 && offset >= circuit.races)),
    title: `${title}${suffix}`, description: `${description}${suffix}` };
}

export default async function CircuitPage({ params, searchParams }: Props) {
  const t = await getTranslations('UI');
  const { id, locale } = await params;
  if (!validId(id)) notFound();
  const lang = locale === 'en' ? 'en' : 'uk';
  const uk = lang === 'uk';
  const { page, q } = catalogueParams(await searchParams);
  const offset = (page - 1) * CIRCUIT_PAGE_SIZE;
  const [[circuit], history, identities, layouts, technicalEvents] = await Promise.all([
    getData<Circuit>(`/api/circuits/${id}`),
    getData<CircuitHistory>(`/api/circuits/${id}/history`),
    getData<IdentityDetails>(`/api/circuits/${id}/identity`),
    getData<CircuitLayout>(`/api/circuits/${id}/layouts`),
    getData<CircuitTechnicalEvent>(`/api/circuits/${id}/technical-history`),
  ]);
  if (!circuit) notFound();
  // Independent operator switch: off means no circuit editorial API request at all.
  // The API has its own default-off release gate; neither flag approves manuscripts.
  const reviewed = process.env.CIRCUIT_EDITORIAL_UI_ENABLED === '1'
    ? await getOptionalPublishedCircuitArticle(id, lang) : null;
  const publishedArticle = reviewed?.status === 'available' ? reviewed.value : null;
  const wins = new Map<string, { id: string; name: string; races: Set<string> }>();
  for (const race of history) for (const winner of race.winners) {
    const driver = wins.get(winner.driver_id) ?? { id: winner.driver_id, name: winner.driver_name, races: new Set<string>() };
    driver.races.add(race.race_id); wins.set(winner.driver_id, driver);
  }
  const maxWins = Math.max(0, ...[...wins.values()].map(driver => driver.races.size));
  const leaders = [...wins.values()].filter(driver => driver.races.size === maxWins).sort((a,b) => a.name.localeCompare(b.name)).slice(0,3);
  const filtered = history.filter(race => !q || `${race.season_year} ${race.race_name} ${race.winners.map(winner => winner.driver_name).join(' ')}`.toLocaleLowerCase(lang).includes(q.toLocaleLowerCase(lang)));
  const visible = filtered.slice(offset, offset + CIRCUIT_PAGE_SIZE);
  // Archive-derived reading path: exact recorded races only, never invented editorials.
  const orderedRaces = [...history].sort((a, b) => a.season_year - b.season_year || a.round - b.round);
  const journeyCandidates = [orderedRaces[0], orderedRaces[Math.floor((orderedRaces.length - 1) / 2)], orderedRaces.at(-1)];
  const raceJourney = journeyCandidates.filter((race, index, all): race is CircuitHistory =>
    Boolean(race) && all.findIndex(candidate => candidate?.race_id === race?.race_id) === index);

  const { crumbs, description } = await entitySeo('circuits', id, locale);
  const coverArtwork = selectCircuitCoverArtwork(layouts);
  const approvedPhoto = selectMediaCollection(mediaPublication.assets as MediaAsset[], { type: 'circuit', id: circuit.external_id })[0];
  const circuitPath = `/circuits/${id}`;
  return <><SeoBreadcrumbs locale={locale} crumbs={crumbs.map((crumb, index) => index === crumbs.length - 1 ? { ...crumb, path: pageHref(circuitPath, page) } : crumb)} description={description} /><section className={`page ${styles.dossier}`} data-testid="circuit-dossier">
    <EditorialHero title={circuit.name} eyebrow={uk ? 'ТРАСА / ІСТОРІЯ ФОРМУЛИ-1' : 'THE CIRCUIT / FORMULA 1 HISTORY'}
      context={<><span>{identities[0]?.fields.country}</span><span>{circuit.first_season ?? '—'}–{circuit.last_season ?? '—'}</span></>}
      lead={<><p>{uk ? 'Конфігурації різних епох та результати Гран-прі з архіву F1DB.' : 'Historic layouts and Grand Prix results from the pinned F1DB archive.'}</p>{leaders.length > 0 && <p data-testid="circuit-win-leader">{uk ? 'Найбільше перемог у результатах F1DB' : 'Most wins in the F1DB results'}: {leaders.map((driver,index) => <span key={driver.id}>{index > 0 && ' · '}<Link href={`/drivers/${driver.id}`}>{driver.name}</Link></span>)} · {maxWins}</p>}</>}
      media={approvedPhoto ? <LicensedMedia assets={mediaPublication.assets as MediaAsset[]} assetId={approvedPhoto.id} subject={{ type: 'circuit', id: circuit.external_id }} label={circuit.name} locale={lang} presentation="hero" /> : coverArtwork ? <CircuitCover circuitArtwork={coverArtwork} title={circuit.name} locale={lang} /> : <div className={styles.noOutline}><p>{uk ? 'Дослідіть Гран-прі цієї траси' : 'Explore the Grands Prix at this circuit'}</p><a href="#circuit-history">{circuit.races} GP ↓</a></div>}
      statistics={[{ label: t('grandsPrix'), value: circuit.races }, { label: uk ? 'Конфігурації' : 'Layouts', value: layouts.length }, { label: t('seasons'), value: new Set(history.map(race => race.season_year)).size }]} />
    <SourceAttribution locale={lang} />
    <EditorialTabs label={uk ? 'Розділи траси' : 'Circuit sections'} items={[
      { id: 'circuit-biography', label: uk ? 'Архівні відомості' : 'Archive identity' },
      ...(publishedArticle ? [{ id: 'circuit-reviewed-article', label: uk ? 'Редакційна стаття' : 'Editorial article' }] : []),
      ...(raceJourney.length ? [{ id: 'circuit-race-journey', label: uk ? 'Гонки різних епох' : 'Races across eras' }] : []),
      { id: 'circuit-layouts', label: uk ? 'Зміни траси' : 'Changing layouts' },
      { id: 'circuit-photos', label: uk ? 'Фотоархів' : 'Image archive' },
      { id: 'circuit-history', label: uk ? 'Усі Гран-прі' : 'All Grands Prix' },
    ]} />
    <section id="circuit-biography" tabIndex={-1}><div data-testid="circuit-biography">
      <h2>{uk ? 'Архівні відомості' : 'Archive identity'}</h2>
      <p>{uk ? 'Відомості про трасу, конфігурації та результати наведено за закріпленим випуском F1DB.' :
        'Circuit identity, layouts and results follow the pinned F1DB release.'}</p>
    </div>
      {identities[0] && <IdentityFacts identity={identities[0]} locale={lang} />}
    </section>
    {publishedArticle && <CircuitReviewedArticle article={publishedArticle} locale={lang} />}
    {reviewed && !publishedArticle && <p data-testid="circuit-article-status">
      {reviewed.status === 'unavailable'
        ? (uk ? 'Редакційна стаття тимчасово недоступна. Архівні відомості можна дослідити нижче.' : 'The editorial article is temporarily unavailable. Explore the archive records below.')
        : (uk ? 'Опублікованої редакційної статті ще немає. Нижче наведено архівні відомості.' : 'A published editorial article is not available yet. Explore the archive records below.')}
    </p>}
    {raceJourney.length > 0 && <section id="circuit-race-journey" tabIndex={-1} aria-labelledby="circuit-race-journey-title">
      <h2 id="circuit-race-journey-title">{uk ? 'Гонки різних епох' : 'Races across eras'}</h2>
      <p>{uk ? 'Переглянь гонки з різних періодів історії траси. Події вибрано за порядком в архіві, а не за редакційною оцінкою їхньої важливості.' :
        'Explore recorded Grands Prix from different eras of the circuit. The selection follows archive order, not an editorial ranking of importance.'}</p>
      <div className={styles.journeyGrid}>{raceJourney.map((race, index) => <article className={styles.journeyCard} key={race.race_id}>
        <span>{index === 0 ? (uk ? 'Перша в архіві' : 'Earliest recorded') :
          index === raceJourney.length - 1 ? (uk ? 'Остання в архіві' : 'Latest recorded') :
          (uk ? 'Між епохами' : 'Between eras')}</span>
        <h3><Link href={`/races/${race.race_id}`}>{race.season_year} · {race.race_name}</Link></h3>
        <p>{uk ? 'Переможці за результатами архіву' : 'Winners in the recorded results'}: {race.winners.length
          ? race.winners.map(winner => <span key={`${winner.driver_id}:${winner.constructor_id}`}><Link href={`/drivers/${winner.driver_id}`}>{winner.driver_name}</Link> · <Link href={`/constructors/${winner.constructor_id}`}>{winner.constructor_name}</Link></span>)
          : (uk ? 'немає запису' : 'not recorded')}</p>
      </article>)}</div>
    </section>}
    <section id="circuit-layouts" tabIndex={-1}>
      <CircuitExperience layouts={layouts} events={technicalEvents} locale={lang} />
      <ArchiveDisclosure label={uk ? 'Порівняти всі контури' : 'Compare all outlines'} count={layouts.length}><CircuitLayoutGallery layouts={layouts} title={circuit.name} locale={lang} /></ArchiveDisclosure>
    </section>
    <section id="circuit-photos" tabIndex={-1} aria-label={uk ? 'Фотоархів траси' : 'Circuit image archive'}>
      <MediaCollection assets={mediaPublication.assets as MediaAsset[]} subject={{ type: 'circuit', id: circuit.external_id }} label={circuit.name} locale={lang} />
    </section>
    <section id="circuit-history" tabIndex={-1} aria-labelledby="all-grands-prix">
      <h2 id="all-grands-prix">{uk ? 'Усі Гран-прі' : 'All Grands Prix'}</h2>
      <form action={`/${locale}${circuitPath}#circuit-history`} role="search" className="catalogue-search">
        <label htmlFor="circuit-race-query">{uk ? 'Рік, назва гонки або переможець' : 'Year, race name or winner'}</label>
        <div className="actions"><input id="circuit-race-query" name="q" type="search" defaultValue={q} maxLength={100} /><button type="submit" className="primary">{t('search')}</button>{q && <a className="secondary" href={`/${locale}${circuitPath}#circuit-history`}>{t('resetSearch')}</a>}</div>
      </form>
      <p role="status">{uk ? 'Знайдено гонок' : 'Races found'}: {filtered.length}</p>
      {visible.length ? <ArchiveTable label={uk ? 'Усі Гран-прі' : 'All Grands Prix'} locale={lang}><table data-testid="circuit-history-table"><thead><tr><th scope="col">{t('season')}</th><th scope="col">{t('grandsPrix')}</th><th scope="col">{uk ? 'Переможці' : 'Winners'}</th><th scope="col">{uk ? 'Дата' : 'Date'}</th></tr></thead>
        <tbody>{visible.map(race => <tr key={race.race_id}><th scope="row"><Link href={`/seasons/${race.season_year}`}>{race.season_year}</Link></th><td><Link href={`/races/${race.race_id}`}>{race.race_name}<span aria-hidden="true"> ↗</span></Link></td><td>{race.winners.length ? race.winners.map(winner => <div key={`${winner.driver_id}:${winner.constructor_id}`}><Link href={`/drivers/${winner.driver_id}`}>{winner.driver_name}</Link> · <Link href={`/constructors/${winner.constructor_id}`}>{winner.constructor_name}</Link></div>) : '—'}</td><td>{race.race_date ?? '—'}</td></tr>)}</tbody>
      </table></ArchiveTable> : <p>{q ? t('noMatches') : t('noCircuitRaces')}</p>}
      <nav className="actions" aria-label={t('circuitPages')}>
        {page > 1 && <a className="secondary" href={`/${locale}${pageHref(circuitPath, page-1, q)}#circuit-history`}>← {t('previous')}</a>}
        {offset + CIRCUIT_PAGE_SIZE < filtered.length && <a className="secondary" href={`/${locale}${pageHref(circuitPath, page+1, q)}#circuit-history`}>{t('next')} →</a>}
      </nav>
      <details><summary>{uk ? 'Джерела результатів' : 'Result sources'}</summary><p>{uk ? 'F1DB: результати різних років і конфігурацій. Спільні автомобілі можуть мати кількох переможців. Відсутній результат не означає, що гонка не відбулася.' : 'F1DB results across years and layouts. Shared drives may have more than one winning driver. A missing result does not establish that a race never took place.'} <Link href="/sources">{t('sourcesTitle')} ↗</Link></p></details>
      <Link className="back" href="/circuits">← {t('allCircuits')}</Link>
    </section>
  </section></>;
}
