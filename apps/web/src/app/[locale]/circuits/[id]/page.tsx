import { CircuitBiography, CircuitMoments, hasPublicCircuitMoments } from '@/components/editorial/circuit-narrative';
import { cornerGuideFor } from '@/components/editorial/circuit-corner-model';
import { CircuitCornerGuide, legacyNamedCircuitIds } from '@/components/editorial/circuit-corner-guide';
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
import { getData } from '@/lib/api';
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
  const wins = new Map<string, { id: string; name: string; races: Set<string> }>();
  for (const race of history) for (const winner of race.winners) {
    const driver = wins.get(winner.driver_id) ?? { id: winner.driver_id, name: winner.driver_name, races: new Set<string>() };
    driver.races.add(race.race_id); wins.set(winner.driver_id, driver);
  }
  const maxWins = Math.max(0, ...[...wins.values()].map(driver => driver.races.size));
  const leaders = [...wins.values()].filter(driver => driver.races.size === maxWins).sort((a,b) => a.name.localeCompare(b.name)).slice(0,3);
  const filtered = history.filter(race => !q || `${race.season_year} ${race.race_name} ${race.winners.map(winner => winner.driver_name).join(' ')}`.toLocaleLowerCase(lang).includes(q.toLocaleLowerCase(lang)));
  const visible = filtered.slice(offset, offset + CIRCUIT_PAGE_SIZE);
  const { crumbs, description } = await entitySeo('circuits', id, locale);
  const coverArtwork = selectCircuitCoverArtwork(layouts);
  const circuitPath = `/circuits/${id}`;
  const hasCorners = legacyNamedCircuitIds.includes(circuit.external_id) || Boolean(cornerGuideFor(circuit.external_id, layouts.map(layout => layout.external_layout_id)));
  const hasMoments = hasPublicCircuitMoments(circuit.external_id);
  return <><SeoBreadcrumbs locale={locale} crumbs={crumbs.map((crumb, index) => index === crumbs.length - 1 ? { ...crumb, path: pageHref(circuitPath, page) } : crumb)} description={description} /><section className={`page ${styles.dossier}`} data-testid="circuit-dossier">
    <EditorialHero title={circuit.name} eyebrow={uk ? 'ТРАСА / ІСТОРІЯ ФОРМУЛИ-1' : 'THE CIRCUIT / FORMULA 1 HISTORY'}
      context={<><span>{identities[0]?.fields.country}</span><span>{circuit.first_season ?? '—'}–{circuit.last_season ?? '—'}</span></>}
      lead={<><p>{uk ? 'Історії поворотів, пам’ятні гонки та конфігурації різних епох.' : 'The stories behind the corners, memorable races and layouts across the eras.'}</p>{leaders.length > 0 && <p data-testid="circuit-win-leader">{uk ? 'Найбільше перемог у результатах F1DB' : 'Most wins in the F1DB results'}: {leaders.map((driver,index) => <span key={driver.id}>{index > 0 && ' · '}<Link href={`/drivers/${driver.id}`}>{driver.name}</Link></span>)} · {maxWins}</p>}</>}
      media={coverArtwork ? <CircuitCover circuitArtwork={coverArtwork} title={circuit.name} locale={lang} /> : <div className={styles.noOutline}><p>{uk ? 'Дослідіть Гран-прі цієї траси' : 'Explore the Grands Prix at this circuit'}</p><a href="#circuit-history">{circuit.races} GP ↓</a></div>}
      statistics={[{ label: t('grandsPrix'), value: circuit.races }, { label: uk ? 'Конфігурації' : 'Layouts', value: layouts.length }, { label: t('seasons'), value: new Set(history.map(race => race.season_year)).size }]} />
    <SourceAttribution locale={lang} />
    <EditorialTabs label={uk ? 'Розділи траси' : 'Circuit sections'} items={[
      { id: 'circuit-biography', label: uk ? 'Історія траси' : 'Circuit history' },
      ...(hasCorners ? [{ id: 'circuit-corners', label: uk ? 'Повороти' : 'Corners' }] : []),
      ...(hasMoments ? [{ id: 'circuit-moments', label: uk ? 'Легендарні моменти' : 'Memorable moments' }] : []),
      { id: 'circuit-layouts', label: uk ? 'Зміни траси' : 'Changing layouts' },
      { id: 'circuit-history', label: uk ? 'Усі Гран-прі' : 'All Grands Prix' },
    ]} />
    <section id="circuit-biography" tabIndex={-1}><CircuitBiography circuitId={circuit.external_id} locale={lang} />
      {identities[0] && <IdentityFacts identity={identities[0]} locale={lang} />}
    </section>
    {hasCorners && <section id="circuit-corners" tabIndex={-1}><CircuitCornerGuide circuitId={circuit.external_id} locale={lang} availableLayouts={layouts.map(layout => layout.external_layout_id)} /></section>}
    {hasMoments && <section id="circuit-moments" tabIndex={-1}><CircuitMoments circuitId={circuit.external_id} locale={lang} history={history} /></section>}
    <section id="circuit-layouts" tabIndex={-1}>
      <CircuitExperience layouts={layouts} events={technicalEvents} locale={lang} />
      <ArchiveDisclosure label={uk ? 'Порівняти всі контури' : 'Compare all outlines'} count={layouts.length}><CircuitLayoutGallery layouts={layouts} title={circuit.name} locale={lang} /></ArchiveDisclosure>
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
