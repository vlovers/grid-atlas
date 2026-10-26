"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type { ExplorerGraph } from "@/lib/explorer-contract";
import { EvidencePreviewPanel } from "@/components/explorer/evidence-preview";
import { explorerCopy, recordCountLabel } from "@/components/explorer/copy";
import { historyAtlasCopy } from "./copy";
import {
  atlasHref,
  pivotHref,
  profileHref,
  type AtlasSelection,
} from "./model";
import { glossary } from "@/content/glossary";
import styles from "./history-atlas.module.css";
function LoadingMap() {
  const t = historyAtlasCopy[useLocale() === "en" ? "en" : "uk"];
  return (
    <div
      className={`${styles.canvas} ${styles.empty}`}
      role="status"
      aria-busy="true"
    >
      <p>{t.loading}</p>
    </div>
  );
}
const FlowNetwork = dynamic(() => import("./flow-network"), {
  ssr: false,
  loading: LoadingMap,
});

export function AtlasWorkbench({
  graph,
  locale,
  initialSelected,
  trail,
  totalConnections,
}: {
  graph: ExplorerGraph;
  locale: "en" | "uk";
  initialSelected?: string;
  trail: AtlasSelection[];
  totalConnections?: number;
}) {
  const t = historyAtlasCopy[locale];
  const e = explorerCopy[locale];
  const focus = graph.nodes.find((n) => n.key === graph.focus)!;
  const first = graph.nodes.find(
    (n) => n.key === graph.edges[0]?.to,
  )?.entity_id;
  const known = (id: string | null | undefined) =>
    graph.nodes.some((n) => n.key !== graph.focus && n.entity_id === id);
  const [selected, setSelected] = useState(
    known(initialSelected) ? initialSelected : first,
  );
  const [copyMessage, setCopyMessage] = useState("");
  const edge = graph.edges.find(
    (e) => graph.nodes.find((n) => n.key === e.to)?.entity_id === selected,
  );
  const neighbor = graph.nodes.find((n) => n.key === edge?.to);
  const selection: AtlasSelection = {
    kind: focus.type,
    id: focus.entity_id,
    year: graph.year,
    ...(selected ? { selected } : {}),
  };
  const permalink = atlasHref(locale, selection, trail);
  const profile = profileHref(locale, focus.type, focus.entity_id);
  useEffect(() => {
    const sync = () => {
      const id = new URL(location.href).searchParams.get("selected");
      setSelected(
        graph.nodes.some((n) => n.key !== graph.focus && n.entity_id === id)
          ? id!
          : first,
      );
      setCopyMessage("");
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [graph, first]);
  function choose(id: string, inspect: boolean) {
    if (id !== selected) {
      setSelected(id);
      setCopyMessage("");
      const next = new URL(atlasHref(locale, { ...selection, selected: id }, trail), location.origin);
      const current = new URL(location.href);
      for (const key of ['careerQ','careerPage']) {
        const value=current.searchParams.get(key);
        if(value!==null) next.searchParams.set(key,value);
      }
      history.pushState(null, '', next.pathname+next.search);
      window.dispatchEvent(new Event('atlas-selection'));
    }
    if (inspect)
      document
        .getElementById("atlas-inspector")
        ?.focus({ preventScroll: true });
  }
  const classic = `/${locale}/explorer/${focus.type === "driver" ? "drivers" : "constructors"}/${focus.entity_id}?year=${graph.year}${selected ? `&selected=${selected}` : ""}`;
  return (
    <section className={styles.workbench} data-testid="history-atlas">
      <header className={styles.mapHeading}>
        <div>
          <p className={styles.kicker}>{t.map}</p>
          <h2>{focus.name} <span>· {graph.year}</span></h2>
          <p data-testid="atlas-record-count">{totalConnections !== undefined ? `${totalConnections} ${glossary[locale].seasonConnections.toLocaleLowerCase(locale)} · ` : ''}{graph.edges.length} {locale === 'uk' ? 'у завантаженому списку' : 'in the loaded list'}</p>
        </div>
        <a href="#atlas-connections">{t.list} ↓</a>
      </header>
      {initialSelected && !known(initialSelected) && (
        <p role="status">{t.invalidSelected}</p>
      )}
      <div className={styles.workspace}>
        <div className={styles.mapPanel}>
          {graph.edges.length ? (
            <FlowNetwork
              graph={graph}
              locale={locale}
              selected={selected}
              onSelect={choose}
            />
          ) : (
            <div className={styles.empty} role="status">
              <span>{graph.year}</span>
              <h3>{t.empty}</h3>
              <p>{t.emptyNote}</p>
            </div>
          )}
          <p className={styles.help}>{glossary[locale].bounds}</p>
          {graph.truncated && (
            <p className={styles.notice} role="status">
              {t.truncated}
            </p>
          )}
        </div>
        <aside
          id="atlas-inspector"
          tabIndex={-1}
          className={styles.inspector}
          aria-label={t.selected}
        >
          {neighbor && edge ? (
            <>
              <p className={styles.kicker}>
                {t.selected} / {graph.year}
              </p>
              <h3 aria-live="polite">{neighbor.name}</h3>
              <p className={styles.pair}>
                {focus.name} <span aria-hidden="true">↔</span> {neighbor.name}
              </p>
              <dl className={styles.counts}>
                {(
                  [
                    [t.races, edge.races],
                    [t.entries, edge.result_entries],
                    [t.wins, edge.winning_races],
                  ] as const
                ).map(([label, count]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{new Intl.NumberFormat(locale).format(count)}</dd>
                  </div>
                ))}
              </dl>
              <a
                className={styles.pivot}
                href={pivotHref(locale, selection, neighbor, trail)}
              >
                {t.pivot} <span aria-hidden="true">↗</span>
              </a>
              {profileHref(locale, neighbor.type, neighbor.entity_id) && (
                <a
                  href={profileHref(locale, neighbor.type, neighbor.entity_id)!}
                >
                  {t.profile} / {neighbor.name} ↗
                </a>
              )}
              <EvidencePreviewPanel
                driver={
                  focus.type === "driver" ? focus.entity_id : neighbor.entity_id
                }
                constructor={
                  focus.type === "constructor"
                    ? focus.entity_id
                    : neighbor.entity_id
                }
                year={graph.year}
                locale={locale}
              />
              <a
                href={`/${locale}/explorer/evidence/${focus.type === "driver" ? focus.entity_id : neighbor.entity_id}/${focus.type === "constructor" ? focus.entity_id : neighbor.entity_id}?year=${graph.year}&from=${focus.type}&selected=${neighbor.entity_id}`}
              >
                {t.evidence} ↗
              </a>
            </>
          ) : (
            <>
              <h3>{t.empty}</h3>
              <p>{t.emptyNote}</p>
            </>
          )}
          <div className={styles.share}>
            <a href={permalink}>{t.share} ↗</a>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    new URL(permalink, location.origin).href,
                  );
                  setCopyMessage(t.copied);
                } catch {
                  setCopyMessage(t.copyFailed);
                }
              }}
            >
              {t.copy}
            </button>
            <span role="status">{copyMessage}</span>
          </div>
        </aside>
      </div>
      {graph.edges.length > 0 && (
        <section
          id="atlas-connections"
          aria-labelledby="atlas-list-heading"
          className={styles.connectionSection}
        >
          <div>
            <h3 id="atlas-list-heading">{t.list}</h3>
            <p>{t.listNote}</p>
          </div>
          <ol className={styles.connectionList}>
            {graph.edges.map((edge) => {
              const node = graph.nodes.find((n) => n.key === edge.to)!;
              return (
                <li key={edge.key}>
                  <button
                    aria-pressed={selected === node.entity_id}
                    onClick={() => choose(node.entity_id, false)}
                  >
                    <span>{t[node.type]}</span>
                    <strong>{node.name}</strong>
                    <small>
                      {recordCountLabel(edge.result_entries, locale, "entries")}
                    </small>
                  </button>
                  <a
                    href={pivotHref(
                      locale,
                      { ...selection, selected: node.entity_id },
                      node,
                      trail,
                    )}
                    aria-label={`${t.pivot}: ${node.name}`}
                  >
                    ↗
                  </a>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      <nav
        className={styles.continue}
        aria-label={
          locale === "uk" ? "Продовжити дослідження" : "Continue exploring"
        }
      >
        <a href={classic}>{t.classic} ↗</a>
        <a
          href={`/${locale}/explorer/connections/${focus.type === "driver" ? "drivers" : "constructors"}/${focus.entity_id}?year=${graph.year}&offset=0`}
        >
          {t.all} ↗
        </a>
        {profile && (
          <a href={profile}>
            {t.profile} / {focus.name} ↗
          </a>
        )}
      </nav>
      <details className={styles.sources} open={graph.edges.length === 0}>
        <summary>{t.limits}</summary>
        <p>{t.limitations}</p>
        <p>{t.emptyNote}</p>
        <p>
          {t.source}:{" "}
          <a href={graph.source.homepage_url} rel="noopener noreferrer">
            {graph.source.attribution}
          </a>
          . {t.sourceNote}
        </p>
        <p>
          {t.credit}{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> ·{" "}
          <a href={`/${locale}/sources`}>{t.limits} ↗</a>
        </p>
        <p>{e.slice}</p>
      </details>
    </section>
  );
}
