"use client";
import { useEffect, useState } from "react";
import type {
  TimeMachineComparison,
  TimeMachineCount,
} from "@/lib/time-machine-contract";
import {
  comparisonRows,
  eraSummary,
  comparisonWindow,
  type ComparisonRow,
} from "./comparison-model";
import { machineCopy } from "./copy";
import styles from "./time-machine.module.css";
type Props = {
  comparison: TimeMachineComparison;
  locale: "en" | "uk";
  selectedId?: string;
  labels: { races: string; entries: string; wins: string };
};
export function ComparisonStage({
  comparison: data,
  locale,
  selectedId,
  labels,
}: Props) {
  const t = machineCopy[locale];
  const rows = comparisonRows(data);
  const [id, setId] = useState(
    rows.find((row) => row.entity_id === selectedId)?.entity_id ??
      rows[0]?.entity_id ??
      "",
  );
  const [filter, setFilter] = useState<"all" | ComparisonRow["status"]>("all");
  const selected = rows.find((row) => row.entity_id === id) ?? rows[0];
  const filtered = rows.filter(
    (row) => filter === "all" || row.status === filter,
  );
  const window = comparisonWindow(filtered, id);
  const from = eraSummary(rows, "from");
  const to = eraSummary(rows, "to");
  const kind = data.focus.entity_type;
  const focusKind = kind === "driver" ? "drivers" : "constructors";
  const otherKind = kind === "driver" ? "constructors" : "drivers";
  const choose = (next: string) => {
    setId(next);
    const url = new URL(globalThis.window.location.href);
    url.searchParams.set("selected", next);
    globalThis.window.history.pushState(
      null,
      "",
      url.pathname + url.search + url.hash,
    );
  };
  useEffect(() => {
    const sync = () => {
      setId(
        new URL(globalThis.window.location.href).searchParams.get("selected") ??
          data.added[0]?.entity_id ??
          data.removed[0]?.entity_id ??
          data.unchanged[0]?.entity_id ??
          "",
      );
      setFilter("all");
    };
    globalThis.window.addEventListener("popstate", sync);
    return () => globalThis.window.removeEventListener("popstate", sync);
  }, [data]);
  const evidence = (year: number) =>
    `/${locale}/explorer/evidence/${kind === "driver" ? data.focus.entity_id : selected?.entity_id}/${kind === "constructor" ? data.focus.entity_id : selected?.entity_id}?year=${year}&from=${kind}&selected=${selected?.entity_id}`;
  const renderEra = (
    side: "from" | "to",
    year: number,
    summary: ReturnType<typeof eraSummary>,
  ) => (
    <section
      className={`${styles.era} ${side === "from" ? styles.then : styles.now}`}
      aria-label={`${side === "from" ? t.earlier : t.later} ${year}`}
    >
      <header>
        <p>{side === "from" ? t.earlier : t.later}</p>
        <a
          href={`/${locale}/seasons/${year}`}
          aria-label={`${t.season} ${year}`}
          className={styles.eraYear}
        >
          {year} <span>↗</span>
        </a>
        <div className={styles.eraOverview}>
          <span>
            <strong>{summary.associations}</strong>
            {t.partners}
          </span>
          <span>
            <strong>{summary.resultEntries}</strong>
            {t.entries}
          </span>
        </div>
      </header>
      <div
        className={styles.selectedEra}
        key={`${side}:${selected?.entity_id}`}
      >
        <p className={styles.smallLabel}>{t.association}</p>
        <h3>{selected?.name ?? t.empty}</h3>
        <EraCounts
          counts={selected?.[side] ?? null}
          labels={labels}
          locale={locale}
        />
        {selected?.[side] && (
          <nav aria-label={`${year} / ${t.association}`}>
            <a href={evidence(year)}>{t.evidence} ↗</a>
            <a
              href={`/${locale}/explorer/${otherKind}/${selected.entity_id}?year=${year}&selected=${data.focus.entity_id}`}
            >
              {t.reciprocal} ↗
            </a>
          </nav>
        )}
      </div>
      <a
        className={styles.eraGraph}
        href={`/${locale}/explorer/${focusKind}/${data.focus.entity_id}?year=${year}`}
      >
        {t.graph} · {year} ↗
      </a>
    </section>
  );
  return (
    <section
      className={styles.stage}
      data-testid="comparison-stage"
      aria-label={
        locale === "uk" ? "Інтерактивне порівняння" : "Interactive comparison"
      }
    >
      <div className={styles.stageHeader}>
        <div>
          <p className={styles.smallLabel}>{t.kicker}</p>
          <h2>{data.from_year} → {data.to_year}</h2>
        </div>
        <a href={`/${locale}/${focusKind}/${data.focus.entity_id}`}>
          {locale === "uk" ? "Профіль у фокусі" : "Focus profile"} ↗
        </a>
      </div>
      <div className={styles.eras}>
        {renderEra("from", data.from_year, from)}
        <div className={styles.sharedCenter}>
          <span aria-hidden="true">↔</span>
          <strong>{locale === "uk" ? "РЕЗУЛЬТАТИ" : "RESULTS"}</strong>
          <span>
            {data.from_year}
            <br />
            {data.to_year}
          </span>
        </div>
        {renderEra("to", data.to_year, to)}
      </div>
      <div className={styles.selector}>
        <header>
          <h3>{t.browse}</h3>
          <p>{t.note}</p>
        </header>
        <div className={styles.filters} role="group" aria-label={t.filter}>
          {(["all", "added", "removed", "unchanged"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                const row = rows.find(
                  (row) => value === "all" || row.status === value,
                );
                if (row) choose(row.entity_id);
              }}
            >
              {value === "all" ? t.all : t[value]}{" "}
              <span>{value === "all" ? rows.length : data[value].length}</span>
            </button>
          ))}
        </div>
        <div className={styles.differenceList}>
          {window.rows.map((row) => (
            <button
              type="button"
              className={styles[row.status]}
              key={row.entity_id}
              aria-pressed={row.entity_id === selected?.entity_id}
              onClick={() => choose(row.entity_id)}
            >
              <span>{t[row.status]}</span>
              <strong>{row.name}</strong>
              <i aria-hidden="true">
                {row.status === "unchanged"
                  ? "↔"
                  : row.status === "added"
                    ? "→"
                    : "←"}
              </i>
            </button>
          ))}
        </div>
        {!filtered.length && <p role="status">{t.noRows}</p>}
        <nav className={styles.windowNav} aria-label={t.browse}>
          <button
            disabled={window.start === 0}
            onClick={() => choose(filtered[window.start - 1].entity_id)}
          >
            {t.previous} ←
          </button>
          <span>
            {filtered.length ? window.start + 1 : 0}–
            {window.start + window.rows.length} / {filtered.length}
          </span>
          <button
            disabled={window.start + window.rows.length >= filtered.length}
            onClick={() =>
              choose(filtered[window.start + window.rows.length].entity_id)
            }
          >
            {t.next} →
          </button>
        </nav>
        {selected && (
          <div className={styles.selectionFooter} aria-live="polite">
            <p>
              <strong>{selected.name}</strong> · {t[selected.status]}
              {selected.status === "unchanged" ? ` · ${t.same}` : ""}
            </p>
            <a href={`/${locale}/${otherKind}/${selected.entity_id}`}>
              {t.profile} ↗
            </a>
            <a
              href={`/${locale}/time-machine?kind=${kind}&id=${data.focus.entity_id}&from=${data.from_year}&to=${data.to_year}&selected=${selected.entity_id}`}
            >
              {t.share} ↗
            </a>
          </div>
        )}
      </div>
      <noscript>
        <p>
          {locale === "uk"
            ? "Повне порівняння доступне у детальному списку нижче."
            : "The complete comparison is available in the detailed list below."}
        </p>
      </noscript>
    </section>
  );
}
function EraCounts({
  counts,
  locale,
  labels,
}: {
  counts: TimeMachineCount | null;
  locale: "en" | "uk";
  labels: Props["labels"];
}) {
  const t = machineCopy[locale];
  return counts ? (
    <dl className={styles.eraCounts}>
      <div>
        <dt>{labels.races}</dt>
        <dd>{counts.races}</dd>
      </div>
      <div>
        <dt>{labels.entries}</dt>
        <dd>{counts.result_entries}</dd>
      </div>
      <div>
        <dt>{labels.wins}</dt>
        <dd>{counts.winning_races}</dd>
      </div>
    </dl>
  ) : (
    <div className={styles.unknown}>
      <span aria-hidden="true">—</span>
      <strong>{t.unknown}</strong>
      <p>{t.unknownNote}</p>
    </div>
  );
}
