import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getData, type CatalogueEntity, type Season } from "@/lib/api";
import {
  getExplorerGraph,
  getConstructorExplorerGraph,
} from "@/lib/explorer-api";
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
  const [seasons, identities, career] = await Promise.all([
    getData<Season>("/api/seasons"),
    !id || q.q !== undefined
      ? getData<CatalogueEntity>(
          `/api/${route}?${new URLSearchParams({ q: query, limit: String(SEARCH_SIZE), offset: String(offset) })}`,
        )
      : Promise.resolve([]),
    id
      ? getData<unknown>(`/api/${route}/${id}/career?locale=${locale}`).then(
          (rows) => parseAtlasCareer(rows, kind, id),
        )
      : Promise.resolve(null),
  ]);
  const year = validYear
    ? q.year === undefined
      ? career?.years.at(-1)
      : Number(q.year)
    : undefined;
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
  const otherYear = machineYears.find((y) => y !== year);
  return (
    <section className={`page ${styles.page}`}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>{t.kicker}</p>
          <h1>
            {t.title}
            <span aria-hidden="true">↗</span>
          </h1>
          <p>{t.intro}</p>
        </div>
        <div className={styles.heroMarker} aria-hidden="true">
          <span>{year ?? "↔"}</span>
          <i />
          <small>GRID / ATLAS</small>
        </div>
      </header>
      <details className={styles.search} open={!career || q.q !== undefined}>
        <summary>
          {t.search}
          {career ? ` / ${career.name}` : ""}
        </summary>
        <form method="get">
          <label>
            {t.kind}
            <select name="kind" defaultValue={kind}>
              <option value="driver">{t.driver}</option>
              <option value="constructor">{t.constructor}</option>
            </select>
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
                <h2>{career.name}</h2>
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
                  <select name="year" defaultValue={year}>
                    {year !== undefined &&
                      !seasons.some((s) => s.year === year) && (
                        <option value={year}>{year}</option>
                      )}
                    {[...seasons]
                      .sort((a, b) => a.year - b.year)
                      .map((s) => (
                        <option key={s.year} value={s.year}>
                          {s.year}
                        </option>
                      ))}
                  </select>
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
      {graph && (
        <AtlasWorkbench
          key={`${kind}:${id}:${year}:${encodeTrail(trail)}`}
          graph={graph}
          locale={locale}
          initialSelected={selected}
          trail={trail}
        />
      )}
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
            02 / {locale === "uk" ? "ПЕРЕВІРЕНІ ТВЕРДЖЕННЯ" : "REVIEWED CLAIMS"}
          </span>
          <h2>{t.lineage} ↗</h2>
          <p>{t.lineageNote}</p>
        </a>
      </div>
      <p className={styles.help}>
        {t.limitations} {t.emptyNote}
      </p>
    </section>
  );
}
