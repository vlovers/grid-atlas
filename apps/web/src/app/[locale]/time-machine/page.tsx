import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getData, type CatalogueEntity, type Season } from "@/lib/api";
import {
  getTimeMachineComparison,
  type TimeMachineAssociation,
  type TimeMachineCount,
} from "@/lib/time-machine-api";
import discoveryStyles from "@/components/history-atlas/discovery.module.css";
import styles from "./time-machine.module.css";
import { ComparisonStage } from "./comparison-stage";
import { machineCopy } from "./copy";
import { recordedCareer, suggestedComparisons, comparisonHref, neighboringComparisons } from "@/lib/recorded-career";
import { ukrainianNoun } from "@/content/editorial-language";
import { glossary } from "@/content/glossary";
import TimeMachineYearForm from "./time-machine-year-form";

export const dynamic = "force-dynamic";
type Query = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Query>;
};
const one = (value: string | string[] | undefined) =>
  Array.isArray(value) ? undefined : value;
const validYear = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}$/.test(value) &&
  Number(value) >= 1950 &&
  Number(value) <= 2200;
const validId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[1-9][0-9]{0,18}$/.test(value) &&
  BigInt(value) <= 9223372036854775807n;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("UI");
  return { title: t("timeMachineTitle"), description: t("timeMachineLead") };
}

function formatCount(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "uk" ? "uk-UA" : "en").format(value);
}

function AssociationCard({
  association,
  focusName,
  kind,
  id,
  fromYear,
  toYear,
  locale,
  t,
}: {
  association: TimeMachineAssociation;
  kind: "driver" | "constructor";
  id: string;
  focusName: string;
  fromYear: number;
  toYear: number;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"UI">>>;
}) {
  const driverId = kind === "driver" ? id : association.entity_id;
  const constructorId = kind === "constructor" ? id : association.entity_id;
  const otherExplorer = kind === "driver" ? "constructors" : "drivers";
  const graphHref = (year: number) =>
    `/explorer/${otherExplorer}/${association.entity_id}?${new URLSearchParams({ year: String(year), selected: id })}`;
  const evidenceHref = (year: number) =>
    `/explorer/evidence/${driverId}/${constructorId}?${new URLSearchParams({
      year: String(year),
      from: kind,
      selected: association.entity_id,
    })}`;
  return (
    <article className={styles.association}>
      <div className={styles.relationship}>
        <div className={styles.entity}>
          <span>{t(kind === "driver" ? "driver" : "constructor")}</span>
          <strong>{focusName}</strong>
        </div>
        <span className={styles.connector} aria-hidden="true">
          <i />
        </span>
        <Link
          className={styles.entity}
          href={`/${otherExplorer}/${association.entity_id}`}
        >
          <span>{t(kind === "driver" ? "constructor" : "driver")}</span>
          <strong>{association.name}</strong>
        </Link>
      </div>
      <div className={styles.seasons}>
        <SeasonCount
          year={fromYear}
          counts={association.from}
          locale={locale}
          t={t}
          evidenceHref={association.from ? evidenceHref(fromYear) : undefined}
          graphHref={association.from ? graphHref(fromYear) : undefined}
        />
        <SeasonCount
          year={toYear}
          counts={association.to}
          locale={locale}
          t={t}
          evidenceHref={association.to ? evidenceHref(toYear) : undefined}
          graphHref={association.to ? graphHref(toYear) : undefined}
        />
      </div>
      {association.from && association.to && (
        <p className={styles.delta}>
          {t("timeMachineDelta", {
            entries: signed(
              association.to.result_entries - association.from.result_entries,
            ),
            races: signed(association.to.races - association.from.races),
            wins: signed(
              association.to.winning_races - association.from.winning_races,
            ),
          })}
        </p>
      )}
    </article>
  );
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function SeasonCount({
  year,
  counts,
  locale,
  t,
  evidenceHref,
  graphHref,
}: {
  year: number;
  counts: TimeMachineCount | null;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"UI">>>;
  evidenceHref?: string;
  graphHref?: string;
}) {
  return (
    <div className={styles.seasonCard}>
      <strong>{year}</strong>
      {counts ? (
        <>
          <dl>
            <div>
              <dt>{t("timeMachineEntries")}</dt>
              <dd>{formatCount(counts.result_entries, locale)}</dd>
            </div>
            <div>
              <dt>{t("races")}</dt>
              <dd>{formatCount(counts.races, locale)}</dd>
            </div>
            <div>
              <dt>{t("timeMachineWinningResults")}</dt>
              <dd>{formatCount(counts.winning_races, locale)}</dd>
            </div>
          </dl>
          {evidenceHref && (
            <Link href={evidenceHref}>{t("timeMachineEvidence")} ↗</Link>
          )}
          {graphHref && (
            <Link href={graphHref}>
              {t("timeMachineGraphLink", { year })} →
            </Link>
          )}
        </>
      ) : (
        <p>{t("timeMachineNoRecordedAssociation")}</p>
      )}
    </div>
  );
}

export default async function TimeMachinePage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!["uk", "en"].includes(locale)) notFound();
  const t = await getTranslations("UI");
  const query = await searchParams;
  const kindValue = one(query.kind) ?? "driver";
  if (kindValue !== "driver" && kindValue !== "constructor") notFound();
  const kind = kindValue;
  const id = one(query.id);
  const search = (one(query.q) ?? "").trim().slice(0, 100);
  const requestedFrom = one(query.from);
  const requestedTo = one(query.to);
  const seasons = await getData<Season>("/api/seasons");
  const latest = seasons.reduce(
    (maximum, season) => Math.max(maximum, season.year),
    1950,
  );
  const words = glossary[locale as 'en' | 'uk'];
  const career = id && validId(id) ? recordedCareer(await getData<unknown>(`/api/${kind}s/${id}/career?locale=${locale}`), kind, id) : null;
  const suggestions = career ? suggestedComparisons(career) : [];
  const recommended = suggestions[0];
  const defaultTo = recommended?.to ?? (latest === 1950 ? 1951 : latest);
  const defaultFrom = recommended?.from ?? Math.max(1950, defaultTo - 1);
  const fromText = requestedFrom ?? String(defaultFrom);
  const toText = requestedTo ?? String(defaultTo);
  const yearsValid = validYear(fromText) && validYear(toText);
  const fromYear = yearsValid ? Number(fromText) : defaultFrom;
  const toYear = yearsValid ? Number(toText) : defaultTo;
  const entityValid = id === undefined || validId(id);
  const formPath = `/${locale}/time-machine`;
  let entities: CatalogueEntity[] = [];
  if (!id && search.length > 0) {
    entities = await getData<CatalogueEntity>(
      `/api/${kind === "driver" ? "drivers" : "constructors"}?${new URLSearchParams({ q: search, limit: "50" })}`,
    );
  }

  let comparison = null;
  let compareError: string | null = null;
  if (id && entityValid) {
    if (!yearsValid) compareError = t("timeMachineInvalidYear");
    else if (fromYear === toYear) compareError = t("timeMachineSameYear");
    else if (fromYear > toYear) compareError = t("timeMachineOrderError");
    else
      comparison = await getTimeMachineComparison(kind, id, fromYear, toYear);
  } else if (id) compareError = t("timeMachineInvalidEntity");

  const adjacentPairs = career ? neighboringComparisons(career, fromYear, toYear) : [];
  const seasonCaption = (year: number) => {
    const observations = career?.observations.filter(o => o.year === year) ?? [];
    return kind === 'driver' ? observations.map(o => o.name).join(' · ') : `${observations.length} ${locale === 'uk' ? ukrainianNoun(observations.length, 'пілот', 'пілоти', 'пілотів') : observations.length === 1 ? 'driver' : 'drivers'}`;
  };
  const hasConnections = !!comparison && comparison.added.length + comparison.removed.length + comparison.unchanged.length > 0;
  return (
    <section className={`page ${styles.page}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className="eyebrow">{machineCopy[locale as "en" | "uk"].kicker}</p>
          <h1>{t("timeMachineTitle")}</h1>
          <h2>{machineCopy[locale as "en" | "uk"].title}</h2>
        </div>
        <p className="lead">{t("timeMachineLead")}</p>
      </header>

      <details className={styles.archiveDisclosure} open={!id || !!search}><summary>{t("timeMachineSearchLabel")}</summary>
      <form className={styles.entityForm} action={formPath} method="get">
        <label>
          {t("timeMachineFocusType")}
          <select name="kind" defaultValue={kind}>
            <option value="driver">{t("driver")}</option>
            <option value="constructor">{t("constructor")}</option>
          </select>
        </label>
        <label>
          {t("timeMachineSearchLabel")}
          <input
            type="search"
            name="q"
            maxLength={100}
            defaultValue={search}
            placeholder={t("timeMachineSearchPlaceholder")}
          />
        </label>
        {requestedFrom && <input type="hidden" name="from" value={requestedFrom} />}
        {requestedTo && <input type="hidden" name="to" value={requestedTo} />}
        <button className="primary" type="submit">
          {t("search")}
        </button>
      </form></details>

      {search && !id && (
        <section
          className={styles.searchResults}
          aria-labelledby="tm-search-results"
        >
          <h2 id="tm-search-results">
            {t("timeMachineSearchResults", { count: entities.length })}
          </h2>
          {entities.length ? (
            <ul>
              {entities.map((entity) => {
                const selection = new URLSearchParams({
                  kind,
                  id: entity.id,
                  ...(requestedFrom ? { from: requestedFrom } : {}),
                  ...(requestedTo ? { to: requestedTo } : {}),
                });
                return (
                  <li key={entity.id}>
                    <a href={`${formPath}?${selection}`}>
                      <span>{entity.external_id}</span>
                      <strong>{entity.name}</strong>
                      <span aria-hidden="true">→</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>{t("noMatches")}</p>
          )}
        </section>
      )}

      {career && (
        <section className={discoveryStyles.period} aria-labelledby="tm-career-heading" data-testid="comparison-career">
          <h2 id="tm-career-heading">{career.name}</h2>
          {career.years.length ? <>
            <p>{words.available} · <strong>{career.years.length === 1 ? career.years[0] : `${career.years[0]}–${career.years.at(-1)}`}</strong></p>
            {yearsValid && (!career.years.includes(fromYear) || !career.years.includes(toYear)) && (
              <div role="status" data-testid="comparison-period-notice">
                <h3>{[fromYear, toYear].some(y => y < career.years[0] || y > career.years.at(-1)!) ? words.outside : words.gap}</h3>
                <p>{[fromYear, toYear].some(y => y < career.years[0] || y > career.years.at(-1)!) ? words.outsideNote : words.gapNote}</p>
              </div>
            )}
            <details><summary>{words.available}</summary><nav className={styles.archiveLinks} aria-label={words.available}>
              {career.years.map(year => <a key={year} href={`/${locale}/atlas?kind=${kind}&id=${id}&year=${year}`}>{year}</a>)}
            </nav></details>
          </> : <p role="status">{words.noYears}</p>}
          {suggestions.length > 0 && <details open={!hasConnections}><summary>{words.suggestions}</summary><nav className={discoveryStyles.comparisonChoices} aria-label={words.suggestions}>
            {suggestions.map(pair => <a key={pair.from} href={comparisonHref(locale, career, pair.from, pair.to)} aria-current={pair.from === fromYear && pair.to === toYear ? 'page' : undefined}><strong>{pair.from} → {pair.to}</strong><span>{seasonCaption(pair.from)} → {seasonCaption(pair.to)}</span><small>{pair.changed ? words.changed : words.adjacent}</small></a>)}
          </nav></details>}
        </section>
      )}
      {career && adjacentPairs.length > 0 && <nav className={styles.archiveLinks} aria-label={locale === 'uk' ? 'Сусідні порівняння' : 'Neighboring comparisons'}>{adjacentPairs.map(pair => <a key={pair.direction} href={comparisonHref(locale, career, pair.from, pair.to)}>{pair.direction < 0 ? `← ${words.previousPair}` : `${words.nextPair} →`} · {pair.from}–{pair.to}</a>)}</nav>}
      {id && entityValid && (
        <TimeMachineYearForm
          locale={locale}
          kind={kind}
          id={id}
          fromYear={fromText}
          toYear={toText}
          years={career?.years ?? []}
          labels={{
            earlier: t("timeMachineEarlierSeason"),
            later: t("timeMachineLaterSeason"),
            compare: t("timeMachineCompare"),
          }}
        />
      )}

      {!id && !search && (
        <div className={styles.startPrompt}>
          <span className={styles.promptLine} aria-hidden="true" />
          <p>{t("timeMachineChooseEntity")}</p>
        </div>
      )}
      {compareError && (
        <p className={styles.error} role="alert">
          {compareError}
        </p>
      )}

      {comparison && (
        <>
          {hasConnections && <ComparisonStage
            key={`${kind}:${id}:${fromYear}:${toYear}`}
            comparison={comparison}
            locale={locale as "en" | "uk"}
            selectedId={one(query.selected)}
            labels={{
              races: t("races"),
              entries: t("timeMachineEntries"),
              wins: t("timeMachineWinningResults"),
            }}
          />}
          <details className={styles.archiveDisclosure}><summary>{words.sources}</summary><p className={styles.disclaimer}>{t("timeMachineLimitations")}</p><p>{t("timeMachineProvenance")}</p><Link href="/sources">{words.sources} ↗</Link></details>
          {comparison.added.length +
            comparison.removed.length +
            comparison.unchanged.length ===
          0 ? (
            <p className={styles.empty} role="status">
              {t("timeMachineNoAssociations")}
            </p>
          ) : (
            <details className={styles.archiveDisclosure} data-testid="comparison-details">
              <summary>{machineCopy[locale as "en" | "uk"].detail}</summary>
              <div className={styles.groups}>
                <AssociationGroup
                  title={t("timeMachineAdded")}
                  note={t("timeMachineAddedNote", { year: toYear })}
                  associations={comparison.added}
                  focusName={comparison.focus.name}
                  kind={kind}
                  id={comparison.focus.entity_id}
                  fromYear={fromYear}
                  toYear={toYear}
                  locale={locale}
                  t={t}
                />
                <AssociationGroup
                  title={t("timeMachineRemoved")}
                  note={t("timeMachineRemovedNote", { year: fromYear })}
                  associations={comparison.removed}
                  focusName={comparison.focus.name}
                  kind={kind}
                  id={comparison.focus.entity_id}
                  fromYear={fromYear}
                  toYear={toYear}
                  locale={locale}
                  t={t}
                />
                <AssociationGroup
                  title={t("timeMachineUnchanged")}
                  note={t("timeMachineUnchangedNote")}
                  associations={comparison.unchanged}
                  focusName={comparison.focus.name}
                  kind={kind}
                  id={comparison.focus.entity_id}
                  fromYear={fromYear}
                  toYear={toYear}
                  locale={locale}
                  t={t}
                />
              </div>
            </details>
          )}

          <nav
            className={styles.archiveLinks}
            aria-label={t("timeMachineSeasonGraphs")}
          >
            <Link
              href={
                kind === "driver"
                  ? `/explorer/drivers/${id}?year=${fromYear}`
                  : `/explorer/constructors/${id}?year=${fromYear}`
              }
            >
              {t("timeMachineGraphFocus", { year: fromYear })} ↗
            </Link>
            <Link
              href={
                kind === "driver"
                  ? `/explorer/drivers/${id}?year=${toYear}`
                  : `/explorer/constructors/${id}?year=${toYear}`
              }
            >
              {t("timeMachineGraphFocus", { year: toYear })} ↗
            </Link>
          </nav>
        </>
      )}
    </section>
  );
}

function AssociationGroup({
  title,
  note,
  associations,
  ...cardProps
}: {
  title: string;
  note: string;
  associations: TimeMachineAssociation[];
  focusName: string;
  kind: "driver" | "constructor";
  id: string;
  fromYear: number;
  toYear: number;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"UI">>>;
}) {
  return (
    <section className={styles.group} aria-label={title}>
      <header>
        <div>
          <h2>{title}</h2>
          <p>{note}</p>
        </div>
        <span>{associations.length}</span>
      </header>
      {associations.length ? (
        <div className={styles.cards}>
          {associations.map((association) => (
            <AssociationCard
              key={association.entity_id}
              association={association}
              {...cardProps}
            />
          ))}
        </div>
      ) : (
        <p className={styles.groupEmpty}>
          {cardProps.t("timeMachineGroupEmpty")}
        </p>
      )}
    </section>
  );
}
