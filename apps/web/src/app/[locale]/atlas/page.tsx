import { EditorialSelect } from '@/components/editorial/select';
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getData, type CatalogueEntity, type Season } from "@/lib/api";
import {
  getExplorerGraph,
  getConstructorExplorerGraph,
} from "@/lib/explorer-api";
import { CareerState } from "@/components/history-atlas/career-state";
import { AtlasWorkbench } from "@/components/history-atlas/workbench";
import { historyAtlasCopy } from "@/components/history-atlas/copy";
import {
  atlasHref,
  atlasId,
  atlasYear,
  parseAtlasCareer,
  parseTrail,
  encodeTrail,
  SEARCH_SIZE,
  type AtlasKind,
} from "@/components/history-atlas/model";
import { recordedCareer, careerPartners, suggestedComparisons } from "@/lib/recorded-career";
import { glossary } from "@/content/glossary";
import discoveryStyles from "@/components/history-atlas/discovery.module.css";
import styles from "@/components/history-atlas/history-atlas.module.css";

export const dynamic = "force-dynamic";
type Query = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Query>;
};
const one = (value: Query[string]) =>
  typeof value === "string" ? value : undefined;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = historyAtlasCopy[locale === "en" ? "en" : "uk"];
  return {
    title: t.title,
    description: t.intro,
    robots: { index: false, follow: true },
  };
}
export default async function AtlasPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params;
  if (rawLocale !== "uk" && rawLocale !== "en") notFound();
  const locale = rawLocale;
  const t = historyAtlasCopy[locale];
  const q = await searchParams;
  const kind: AtlasKind = q.kind === "constructor" ? "constructor" : "driver";
  const route = kind === "driver" ? "drivers" : "constructors";
  const id = one(q.id);
  if (q.id !== undefined && !atlasId(id)) notFound();
  const query = (one(q.q) ?? "").trim().slice(0, 100);
  const offset =
    typeof q.offset === "string" &&
    /^(0|[1-9][0-9]{0,5})$/.test(q.offset) &&
    Number(q.offset) <= 99996
      ? Number(q.offset)
      : 0;
  const validYear =
    q.year === undefined ||
    (typeof q.year === "string" &&
      /^\d{4}$/.test(q.year) &&
      atlasYear(Number(q.year)));
  const validKind =
    q.kind === undefined || q.kind === "driver" || q.kind === "constructor";
  const selected = atlasId(q.selected) ? q.selected : undefined;
  const trail = parseTrail(q.trail);
  const badTrail = q.trail !== undefined && encodeTrail(trail) !== q.trail;
  const [seasons, identities, careerRows] = await Promise.all([
    getData<Season>("/api/seasons"),
    !id || q.q !== undefined
      ? getData<CatalogueEntity>(
          `/api/${route}?${new URLSearchParams({ q: query, limit: String(SEARCH_SIZE), offset: String(offset) })}`,
        )
      : Promise.resolve([]),
    id
      ? getData<unknown>(`/api/${route}/${id}/career?locale=${locale}`)
      : Promise.resolve(null),
  ]);
  const career = careerRows ? parseAtlasCareer(careerRows, kind, id!) : null;
  const discovery = careerRows ? recordedCareer(careerRows, kind, id!) : null;
  const partners = discovery ? careerPartners(discovery) : [];
  const words = glossary[locale];
  const careerQuery = (one(q.careerQ) ?? '').trim().slice(0,100);
  const requestedCareerPage = typeof q.careerPage === 'string' && /^(0|[1-9][0-9]{0,4})$/.test(q.careerPage) ? Number(q.careerPage) : 0;
  const matchingPartners = partners.filter(p => p.name.toLocaleLowerCase(locale).includes(careerQuery.toLocaleLowerCase(locale)));
  const careerPage = Math.min(requestedCareerPage, Math.max(0, Math.ceil(matchingPartners.length / 12) - 1));
  const visiblePartners = matchingPartners.slice(careerPage * 12, careerPage * 12 + 12);
  const year = validYear
    ? q.year === undefined
      ? career?.years.at(-1)
      : Number(q.year)
    : undefined;
  const seasonConnections = discovery && year !== undefined ? discovery.observations.filter(o => o.year === year).length : undefined;
  const graphReader =
    kind === "driver" ? getExplorerGraph : getConstructorExplorerGraph;
  const graph =
    id && year !== undefined && validKind ? await graphReader(id, year) : null;
  const names = await Promise.allSettled(
    trail.map((s) =>
      (s.kind === "driver" ? getExplorerGraph : getConstructorExplorerGraph)(
        s.id,
        s.year,
      ).then((g) => g.nodes.find((n) => n.key === g.focus)!.name),
    ),
  );
  const searchHref = (nextOffset: number) =>
    `/${locale}/atlas?${new URLSearchParams({ kind, q: query, offset: String(nextOffset) })}`;
  const machineYears = career?.years ?? [];
  const otherYear = machineYears.filter(y => y !== year).sort((a, b) => Math.abs(a - (year ?? 0)) - Math.abs(b - (year ?? 0)))[0];
  return (
    <section className={`page ${styles.page}`}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>{career ? t.title : t.kicker}</p>
          <h1>
            {career?.name ?? t.title}
            <span aria-hidden="true">↗</span>
          </h1>
          <p>{career ? words.focusIntro : t.intro}</p>
        </div>
        <div className={styles.heroMarker} aria-hidden="true">
          <span>{year ?? "↔"}</span>
          <i />
          <small>GRID / ATLAS</small>
        </div>
      </header>
      {career && <dl className={discoveryStyles.focusFacts} data-testid="atlas-focus-facts">
        <div><dt>{words.available}</dt><dd>{career.years.length}</dd></div><div><dt>{words.seasonConnections}</dt><dd>{seasonConnections ?? '—'}</dd></div><div><dt>{words.careerConnections}</dt><dd>{partners.length}</dd></div>
      </dl>}
      <details className={styles.search} open={!career || q.q !== undefined}>
        <summary>
          {career ? words.changeSubject : t.search}
        </summary>
        <form method="get">
          <label>
            {t.kind}
            <EditorialSelect name="kind" defaultValue={kind}>
              <option value="driver">{t.driver}</option>
              <option value="constructor">{t.constructor}</option>
            </EditorialSelect>
          </label>
          <label>
            {t.query}
            <input
              name="q"
              type="search"
              maxLength={100}
              defaultValue={query}
            />
          </label>
          <button type="submit">{t.find} ↗</button>
        </form>
        {(!career || q.q !== undefined) && (
          <>
            <p>
              {t.choose}{" "}
              {identities.length > 0 &&
                `${offset + 1}–${offset + identities.length}`}
            </p>
            <ul className={styles.searchResults} aria-label={t.results}>
              {identities.map((entity) => (
                <li key={entity.id}>
                  <a href={atlasHref(locale, { kind, id: entity.id })}>
                    <span>{t[kind]}</span>
                    <strong>{entity.name}</strong>
                    <small>{entity.external_id}</small>
                    <b aria-hidden="true">↗</b>
                  </a>
                </li>
              ))}
            </ul>
            {!identities.length && <p role="status">{t.noResults}</p>}
            <nav className={styles.paging} aria-label={t.results}>
              {offset > 0 && (
                <a href={searchHref(Math.max(0, offset - SEARCH_SIZE))}>
                  ← {t.previous}
                </a>
              )}
              {identities.length === SEARCH_SIZE &&
                offset + SEARCH_SIZE <= 99996 && (
                  <a href={searchHref(offset + SEARCH_SIZE)}>{t.next} →</a>
                )}
            </nav>
          </>
        )}
      </details>
      {(!validYear ||
        !validKind ||
        (q.selected !== undefined && !selected)) && (
        <p className={styles.notice} role="alert">
          {t.invalid}
        </p>
      )}
      {badTrail && <p role="status">{t.invalidTrail}</p>}
      {career && (
        <>
          <nav className={styles.trail} aria-label={t.trail}>
            <a href={`/${locale}/atlas`}>{t.restart}</a>
            {trail.map((s, i) => (
              <a
                key={`${i}:${s.kind}:${s.id}`}
                href={atlasHref(locale, s, trail.slice(0, i))}
              >
                <span aria-hidden="true">← </span>
                {names[i].status === "fulfilled"
                  ? names[i].value
                  : `${t[s.kind]} #${s.id}`}{" "}
                · {s.year}
              </a>
            ))}
            <span aria-current="page">
              {career.name}
              {year !== undefined ? ` · ${year}` : ""}
            </span>
          </nav>
          {trail.length === 6 && <p className={styles.help}>{t.trailLimit}</p>}
          <section className={styles.timeline} aria-label={t.timeline}>
            <div className={styles.timelineHeading}>
              <div>
                <p className={styles.kicker}>{t.timeline}</p>
                <h2>{t.season}</h2>
              </div>
              <form method="get">
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="id" value={id} />
                {trail.length > 0 && (
                  <input
                    type="hidden"
                    name="trail"
                    value={encodeTrail(trail)}
                  />
                )}
                <label>
                  {t.season}
                  <EditorialSelect name="year" defaultValue={year}>
                    {year !== undefined &&
                      !seasons.some((s) => s.year === year) && (
                        <option value={year}>{year}</option>
                      )}
                    <optgroup label={words.available}>{career.years.map(y => <option key={y} value={y}>{y}</option>)}</optgroup>
                    <optgroup label={locale === 'uk' ? 'Інші сезони архіву' : 'Other archive seasons'}>{[...seasons].filter(s => !career.years.includes(s.year)).sort((a,b) => a.year-b.year).map(s => <option key={s.year} value={s.year}>{s.year}</option>)}</optgroup>
                  </EditorialSelect>
                </label>
                <button type="submit">{t.open} ↗</button>
              </form>
            </div>
            {career.years.length ? (
              <nav className={styles.yearRail} aria-label={t.timeline}>
                {career.years.map((y) => (
                  <a
                    key={y}
                    href={atlasHref(locale, { kind, id, year: y }, trail)}
                    aria-current={year === y ? "page" : undefined}
                  >
                    {y}
                    <i aria-hidden="true" />
                  </a>
                ))}
              </nav>
            ) : (
              <p role="status">{t.noYears}</p>
            )}
            <p className={styles.help}>{t.timelineNote}</p>
          </section>
        </>
      )}
      {discovery && <nav className={styles.continue} aria-label={words.overview}>
        <a href="#atlas-season">{words.seasonMap} ↓</a><a href="#atlas-career">{words.overviewLink} · {partners.length} ↓</a>
        {year !== undefined && discovery.years.filter(y => y < year).at(-1) !== undefined && <a href={atlasHref(locale, { kind, id, year: discovery.years.filter(y => y < year).at(-1)! }, trail)}>← {discovery.years.filter(y => y < year).at(-1)}</a>}
        {year !== undefined && discovery.years.find(y => y > year) !== undefined && <a href={atlasHref(locale, { kind, id, year: discovery.years.find(y => y > year)! }, trail)}>{discovery.years.find(y => y > year)} →</a>}
      </nav>}
      {graph && graph.edges.length <= 2 && <p className={styles.help}>{words.sparse}</p>}
      <div id="atlas-season" />
      {graph && (
        <AtlasWorkbench
          key={`${kind}:${id}:${year}:${encodeTrail(trail)}`}
          graph={graph}
          locale={locale}
          initialSelected={selected}
          trail={trail}
          totalConnections={seasonConnections !== undefined && seasonConnections >= graph.edges.length ? seasonConnections : undefined}
        />
      )}
      {discovery && <CareerState><section id="atlas-career" className={styles.connectionSection} aria-labelledby="atlas-career-title" data-testid="atlas-career-overview">
        <h2 id="atlas-career-title">{words.overview}</h2><p>{words.overviewNote}</p>
        {partners.length > 12 && <form method="get" action={`/${locale}/atlas#atlas-career`} className={discoveryStyles.filter}>
          <input type="hidden" name="kind" value={kind}/><input type="hidden" name="id" value={id}/>{year !== undefined && <input type="hidden" name="year" value={year}/>}<input type="hidden" name="selected" value={selected ?? ""} disabled={!selected}/>{trail.length > 0 && <input type="hidden" name="trail" value={encodeTrail(trail)}/>}
          <label>{locale === 'uk' ? 'Ім’я або назва в історії кар’єри' : 'Find a name in this career'}<input name="careerQ" type="search" maxLength={100} defaultValue={careerQuery}/></label><button type="submit">{t.find}</button>
        </form>}
        <p>{matchingPartners.length} · {locale === 'uk' ? 'зв’язків; на сторінці' : 'connections; on this page'} {visiblePartners.length}</p>
        {visiblePartners.length ? <ol className={styles.connectionList}>{visiblePartners.map(partner => <li key={partner.id}>
          <div className={discoveryStyles.partner}><h3>{partner.name}</h3>
            <p>{partner.seasons.map(s => s.year).join(' · ')}</p>
            <details><summary>{words.raceEvidence} · {partner.seasons.length}</summary>
              <ul>{partner.seasons.map(season => <li key={season.year} className={discoveryStyles.season}>
                <a href={atlasHref(locale, { kind, id, year: season.year, selected: partner.id }, trail)}>{season.year} · {words.seasonMap}</a>{' · '}
                <a href={`/${locale}/explorer/evidence/${kind === 'driver' ? id : partner.id}/${kind === 'constructor' ? id : partner.id}?year=${season.year}&from=${kind}&selected=${partner.id}`}>{words.raceEvidence} ↗</a>
              </li>)}</ul>
            </details>
          </div>
        </li>)}</ol> : <p>{careerQuery ? t.noResults : words.noYears}</p>}
        {matchingPartners.length > 12 && <nav className={styles.paging} aria-label={words.overview}>
          {[...(careerPage > 0 ? [careerPage - 1] : []), ...((careerPage + 1) * 12 < matchingPartners.length ? [careerPage + 1] : [])].map(p => <a data-career-page key={p} href={`${atlasHref(locale, {kind, id, year, selected}, trail)}&${new URLSearchParams({careerQ:careerQuery,careerPage:String(p)})}#atlas-career`}>{p < careerPage ? `← ${words.previous}` : `${words.next} →`}</a>)}
        </nav>}
        {discovery.years.length > 1 && <nav className={styles.continue} aria-label={words.suggestions}>
          {suggestedComparisons(discovery, year).slice(0, 3).map(pair => <a key={pair.from} href={`/${locale}/time-machine?kind=${kind}&id=${id}&from=${pair.from}&to=${pair.to}`}>{pair.from} → {pair.to} ↗</a>)}
        </nav>}
      </section></CareerState>}
      <div className={styles.related}>
        {career && otherYear !== undefined && year !== undefined && (
          <a
            href={`/${locale}/time-machine?${new URLSearchParams({ kind, id: career.id, from: String(Math.min(year, otherYear)), to: String(Math.max(year, otherYear)) })}`}
          >
            <span>01 / TIME MACHINE</span>
            <h2>{t.machine} ↗</h2>
          </a>
        )}
        <a href={`/${locale}/lineage`}>
          <span>
            02 / {locale === "uk" ? "ІСТОРІЯ КОМАНД" : "TEAM HISTORY"}
          </span>
          <h2>{t.lineage} ↗</h2>
          
        </a>
      </div>
      <details className={styles.help}><summary>{words.sources}</summary><p>{t.limitations} {t.lineageNote} {t.emptyNote}</p></details>
    </section>
  );
}
