import { MediaCollection } from '@/components/media/collection';
import { LicensedMedia } from '@/components/media/licensed-media';
import { selectMediaCollection } from '@/components/media/registry';
import { readCircuitPublication } from '@/components/media/circuit-publication';
import { EditorialHero, EditorialTabs, SourceAttribution } from '@/components/editorial/primitives';
import { ArchiveTable } from '@/components/editorial/archive-table';
import { CircuitExperience, type CircuitLayout, type CircuitTechnicalEvent } from '@/components/circuit-experience';
import { circuitReadingModel, type CircuitRaceRecord } from '@/components/editorial/circuit-reader-model';
import { CircuitRecordIntroduction, CircuitReadingJourney, CircuitConfigurationChapters, CircuitRecordCover } from '@/components/editorial/circuit-reading-journey';
import { IdentityFacts, type IdentityDetails } from '@/components/identity-facts';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { entitySeo } from '@/lib/entity-seo';
import SeoBreadcrumbs from '@/components/seo-breadcrumbs';
import { getData, getOptionalPublishedCircuitArticle } from '@/lib/api';
import { CircuitReviewedArticle } from '@/components/editorial/circuit-reviewed-article';
import { catalogueParams, pageHref, type CatalogueParams } from '@/lib/catalogue';
import styles from '@/app/[locale]/circuits/[id]/circuit.module.css';
import { circuitReaderDescription } from './circuit-reader-cohort';
import { CircuitBiography, CircuitMoments } from './circuit-narrative';

const CIRCUIT_PAGE_SIZE = 25;
type Circuit = { id: string; name: string; external_id: string; races: number; first_season: number | null; last_season: number | null };
type Props = { circuit: Circuit; id: string; locale: string; query: CatalogueParams & { race?: string | string[] } };

export async function CircuitProductionPage({ circuit, id, locale, query }: Props) {
  const t = await getTranslations('UI');
  const lang = locale === 'en' ? 'en' : 'uk';
  const uk = lang === 'uk';
  const { page, q } = catalogueParams(query);
  const offset = (page - 1) * CIRCUIT_PAGE_SIZE;
  const [history, identities, layouts, technicalEvents] = await Promise.all([
    getData<CircuitRaceRecord>(`/api/circuits/${id}/history`),
    getData<IdentityDetails>(`/api/circuits/${id}/identity`),
    getData<CircuitLayout>(`/api/circuits/${id}/layouts`),
    getData<CircuitTechnicalEvent>(`/api/circuits/${id}/technical-history`),
  ]);
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
  const reading = circuitReadingModel(history, layouts, technicalEvents,
    query.race === undefined ? undefined : typeof query.race === 'string' ? query.race : 'invalid');
  const readerEvents = reading.records.flatMap(record => record.event ? [record.event] : []);

  const { crumbs } = await entitySeo('circuits', id, locale);
  const publication = await readCircuitPublication(circuit.external_id, layouts, readerEvents);
  const approvedPhoto = selectMediaCollection(publication, { type: 'circuit', id: circuit.external_id })[0];
  const circuitPath = `/circuits/${id}`;
  return <><SeoBreadcrumbs locale={locale} crumbs={crumbs.map((crumb, index) => index === crumbs.length - 1 ? { ...crumb, path: pageHref(circuitPath, page) } : crumb)} description={circuitReaderDescription(circuit.name, locale)} /><section className={`page ${styles.dossier}`} data-testid="circuit-dossier">
    <EditorialHero title={circuit.name} eyebrow={uk ? 'ТРАСА / ІСТОРІЯ ФОРМУЛИ-1' : 'THE CIRCUIT / FORMULA 1 HISTORY'}
      context={<><span>{identities[0]?.fields.country}</span><span>{circuit.first_season ?? '—'}–{circuit.last_season ?? '—'}</span></>}
      lead={<><p>{uk ? 'Конфігурації різних епох та результати Гран-прі з архіву F1DB.' : 'Historic layouts and Grand Prix results from the pinned F1DB archive.'}</p>{leaders.length > 0 && <p data-testid="circuit-win-leader">{uk ? 'Найбільше перемог у результатах F1DB' : 'Most wins in the F1DB results'}: {leaders.map((driver,index) => <span key={driver.id}>{index > 0 && ' · '}<Link href={`/drivers/${driver.id}`}>{driver.name}</Link></span>)} · {maxWins}</p>}</>}
      media={approvedPhoto ? <LicensedMedia assets={publication} assetId={approvedPhoto.id} subject={{ type: 'circuit', id: circuit.external_id }} label={circuit.name} locale={lang} presentation="hero" /> : <CircuitRecordCover model={reading} locale={lang} />}
      statistics={[{ label: t('grandsPrix'), value: circuit.races }, { label: uk ? 'Конфігурації' : 'Layouts', value: layouts.length }, { label: t('seasons'), value: new Set(history.map(race => race.season_year)).size }]} />
    <SourceAttribution locale={lang} />
    <EditorialTabs label={uk ? 'Розділи траси' : 'Circuit sections'} items={[
      { id: 'circuit-biography', label: uk ? 'Історія траси' : 'Circuit history' },
      ...(!publishedArticle ? [{ id: 'circuit-moments', label: uk ? 'Події та джерела' : 'Events & sources' }] : []),
      ...(publishedArticle ? [{ id: 'circuit-reviewed-article', label: uk ? 'Редакційна стаття' : 'Editorial article' }] : []),
      { id: 'circuit-race-journey', label: uk ? 'Гонки різних епох' : 'Races across eras' },
      { id: 'circuit-corners', label: uk ? 'Назви поворотів' : 'Corner names' },
      { id: 'circuit-layouts', label: uk ? 'Зміни траси' : 'Changing layouts' },
      ...(publication.some(asset => asset.kind !== 'circuit-diagram') ? [{ id: 'circuit-photos', label: uk ? 'Фотоархів' : 'Image archive' }] : []),
      { id: 'circuit-history', label: uk ? 'Усі Гран-прі' : 'All Grands Prix' },
      { id: 'circuit-sources', label: uk ? 'Джерела й межі' : 'Sources & limits' },
    ]} />
    <section id="circuit-biography" tabIndex={-1}>
      {!publishedArticle && <CircuitBiography circuitId={circuit.external_id} locale={lang} allowExpandedEdition={false} />}
      <CircuitRecordIntroduction model={reading} name={circuit.name} locale={lang} />
      {identities[0] && <details open><summary>{uk ? 'Ідентичність у джерелі' : 'Identity in the source'}</summary><IdentityFacts identity={identities[0]} locale={lang} /></details>}
    </section>
    {publishedArticle && <CircuitReviewedArticle article={publishedArticle} locale={lang} />}
    {!publishedArticle && <p data-testid="circuit-article-status">
      {reviewed?.status === 'unavailable'
        ? (uk ? 'Редакційна стаття тимчасово недоступна. Архівні відомості можна дослідити нижче.' : 'The editorial article is temporarily unavailable. Explore the archive records below.')
        : (uk ? 'Опублікованої редакційної статті ще немає. Нижче наведено архівні відомості.' : 'A published editorial article is not available yet. Explore the archive records below.')}
    </p>}
    {!publishedArticle && <section id="circuit-moments" tabIndex={-1}><CircuitMoments circuitId={circuit.external_id} locale={lang} history={history} allowExpandedEdition={false} /></section>}
    <CircuitReadingJourney model={reading} circuitId={id} name={circuit.name} locale={lang} />
    <section id="circuit-corners" tabIndex={-1} className={styles.cornerStatus} data-testid="circuit-corner-status">
      <h2>{uk ? 'Назви, які потребують своєї епохи' : 'Names need their own era'}</h2>
      <p>{uk ? 'Назви й номери поворотів не переносяться з сучасної конфігурації на давнішу. Окремий довідник назв з’явиться лише після перевірки джерел і конкретної конфігурації; дослідницькі позначення тут не показано.' : 'Corner names and numbers do not carry automatically from a modern layout to an earlier one. A separate name guide requires reviewed sources and an exact period configuration; research labels are not displayed here.'}</p>
      <a href="#circuit-layouts">{uk ? 'Перевірити конфігурацію гонки' : 'Inspect the event configuration'} ↓</a>
    </section>
    <section id="circuit-layouts" tabIndex={-1}>
      <CircuitConfigurationChapters model={reading} circuitId={id} name={circuit.name} locale={lang} />
      {reading.unknownRace && <p role="status" data-testid="circuit-unknown-race">{uk ? 'Ця гонка не пов’язана з трасою в архіві. Оберіть подію з наведених записів.' : 'That race is not linked to this circuit in the archive. Choose an event from the records below.'} <Link href={circuitPath}>{uk ? 'Скинути вибір' : 'Reset selection'}</Link></p>}
      <CircuitExperience readerMode key={reading.selected?.race.race_id ?? 'none'} layouts={layouts} events={readerEvents} locale={lang}
        initialRaceId={reading.selected?.event?.race_id ?? 'unavailable'} approvedDiagrams={publication.filter(asset => asset.kind === 'circuit-diagram' &&
          asset.layout?.id === reading.selected?.layout?.external_layout_id && asset.layout!.race_ids.includes(reading.selected?.event?.external_race_id ?? ''))} />
    </section>
    {publication.some(asset => asset.kind !== 'circuit-diagram') && <section id="circuit-photos" tabIndex={-1} aria-label={uk ? 'Фотоархів траси' : 'Circuit image archive'}>
      <MediaCollection assets={publication} subject={{ type: 'circuit', id: circuit.external_id }} label={circuit.name} locale={lang} />
    </section>}
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
      <Link className="back" href="/circuits">← {t('allCircuits')}</Link>
    </section>
    <section id="circuit-sources" tabIndex={-1} aria-labelledby="circuit-sources-title" className={styles.sourceNote}>
      <h2 id="circuit-sources-title">{uk ? 'Звідки починається розповідь' : 'Where the story starts'}</h2>
      <p>{uk ? 'Ідентичності, результати та параметри гонок — із закріпленого випуску F1DB v2026.17.0. Вони не підтверджують причини подій, назви поворотів або точну геометрію. Спільні автомобілі можуть мати кількох переможців; відсутній запис не доводить, що гонки не було. Дані за 2026 рік попередні.' : 'Identities, results and race measurements follow the pinned F1DB release v2026.17.0. They do not establish causes, corner names or exact geometry. Shared drives may have several winning drivers; a missing record does not prove that a race never happened. The 2026 records remain provisional.'}</p>
      <p>{uk ? 'Схеми й фотографії потребують окремого одобрення прав; наявність файлу або ліцензійної позначки не є таким одобренням. Джерела редакційних тверджень наведено біля самих тверджень, коли статтю опубліковано.' : 'Diagrams and photographs require individual rights approval; an available file or a license label does not grant that approval. Published editorial claims carry their own source links alongside the text.'}</p>
      <Link href="/sources">{t('sourcesTitle')} ↗</Link>
    </section>
  </section></>;
}
