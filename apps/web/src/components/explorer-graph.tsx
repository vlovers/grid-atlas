"use client";
import { useEffect, useRef, useState, useId } from "react";
import { Link } from "@/i18n/navigation";
import type { ExplorerGraph as Graph } from "@/lib/explorer-contract";
import {
  NETWORK_PAGE_SIZE,
  NETWORK_WIDTH,
  NETWORK_HEIGHT,
  networkPage,
  networkPositions,
  fitZoom,
  nodeLines,
} from "./explorer/network-model";
import { explorerCopy, recordCountLabel } from "./explorer/copy";
import { EvidencePreviewPanel } from "./explorer/evidence-preview";
import styles from "./explorer-graph.module.css";
type Props = { graph: Graph; locale: "en" | "uk"; selectedId?: string };

export default function ExplorerGraph({ graph, locale, selectedId }: Props) {
  const uk = locale === "uk";
  const t = explorerCopy[locale];
  const constructorFocus = graph.focus.startsWith("constructor:");
  const neighborRoute = constructorFocus ? "drivers" : "constructors";
  const focus = graph.nodes.find((node) => node.key === graph.focus)!;
  const nodeFor = (key: string) =>
    graph.nodes.find((node) => node.key === key)!;
  const initial = graph.edges.findIndex(
    (edge) => nodeFor(edge.to).entity_id === selectedId,
  );
  const [compact, setCompact] = useState(false);
  const pageSize = compact ? 4 : NETWORK_PAGE_SIZE;
  const [selectedKey, setSelectedKey] = useState(
    graph.edges[Math.max(0, initial)]?.key,
  );
  const [windowIndex, setWindowIndex] = useState(networkPage(initial));
  const [view, setView] = useState({ zoom: 1, x: 0, y: 0 });
  const drag = useRef<{
    x: number;
    y: number;
    baseX: number;
    baseY: number;
  } | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const gradient = useId().replace(/:/g, "") + "-network";
  const selected =
    graph.edges.find((edge) => edge.key === selectedKey) ?? graph.edges[0];
  const selectedNode = selected && nodeFor(selected.to);
  const selectedIndex = graph.edges.findIndex(
    (edge) => edge.key === selected?.key,
  );
  const visible = graph.edges.slice(
    windowIndex * pageSize,
    (windowIndex + 1) * pageSize,
  );
  const positions = compact
    ? visible.map((_, i) => ({ x: 560, y: 590 + i * 136 }))
    : networkPositions(visible.length);
  const previous =
    graph.edges[selectedIndex - 1] &&
    nodeFor(graph.edges[selectedIndex - 1].to);
  const next =
    graph.edges[selectedIndex + 1] &&
    nodeFor(graph.edges[selectedIndex + 1].to);
  const graphHref = `/${locale}/explorer/${constructorFocus ? "constructors" : "drivers"}/${focus.entity_id}?year=${graph.year}`;
  const reset = () => {
    setView({ zoom: 1, x: 0, y: 0 });
    if (viewport.current)
      viewport.current.scrollLeft =
        (viewport.current.scrollWidth - viewport.current.clientWidth) / 2;
  };
  const pan = (x: number, y: number) =>
    setView((v) => ({
      ...v,
      x: Math.max(-650, Math.min(650, v.x + x)),
      y: Math.max(-400, Math.min(400, v.y + y)),
    }));
  const choose = (id: string, anchor = false) => {
    const index = graph.edges.findIndex(
      (edge) => nodeFor(edge.to).entity_id === id,
    );
    if (index < 0) return;
    if (Math.floor(index / pageSize) !== windowIndex) reset();
    setSelectedKey(graph.edges[index].key);
    setWindowIndex(Math.floor(index / pageSize));
    const url = new URL(window.location.href);
    url.searchParams.set("selected", id);
    if (anchor) url.hash = "explorer-inspector";
    window.history.pushState(null, "", url.pathname + url.search + url.hash);
    if (anchor)
      requestAnimationFrame(() => {
        const panel = document.getElementById("explorer-inspector");
        panel?.focus({ preventScroll: true });
        panel?.scrollIntoView({ block: "nearest" });
      });
  };
  // Next.js can update search-param props after a history traversal without
  // remounting this graph. Keep selection synchronized with both navigation
  // events and the eventual server-provided selectedId.
  useEffect(() => {
    const syncSelection = (id: string | null) => {
      const index = graph.edges.findIndex(
        (edge) =>
          graph.nodes.find((node) => node.key === edge.to)?.entity_id === id,
      );
      setSelectedKey(graph.edges[Math.max(0, index)]?.key);
      setWindowIndex(Math.floor(Math.max(0, index) / pageSize));
    };
    const onPopState = () =>
      syncSelection(new URL(window.location.href).searchParams.get("selected"));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [graph, pageSize]);
  useEffect(() => {
    // During Back/Forward, server props may lag behind the browser URL.
    // The visible URL is authoritative: stale selectedId props must never
    // overwrite the selection restored by popstate.
    const currentId = new URL(window.location.href).searchParams.get("selected");
    const index = graph.edges.findIndex(
      (edge) =>
        graph.nodes.find((node) => node.key === edge.to)?.entity_id === currentId,
    );
    setSelectedKey(graph.edges[Math.max(0, index)]?.key);
    setWindowIndex(Math.floor(Math.max(0, index) / pageSize));
  }, [selectedId, graph, pageSize]);
  useEffect(() => {
    const el = viewport.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);
  useEffect(() => {
    const mq = matchMedia("(max-width:600px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    setWindowIndex(Math.floor(Math.max(0, selectedIndex) / pageSize));
  }, [selectedIndex, pageSize]);
  return (
    <section
      className={styles.panel}
      aria-label={uk ? "Карта зв’язків" : "Connection map"}
      data-testid="network-experience"
    >
      <header className={styles.header}>
        <div>
          <p>{t.kicker}</p>
          <strong>
            {uk ? "Карта сезону" : "Season map"} · {graph.year}
          </strong>
        </div>
        <span>
          {constructorFocus
            ? uk
              ? "Конструктор у центрі"
              : "Constructor at center"
            : uk
              ? "Пілот у центрі"
              : "Driver at center"}
        </span>
      </header>
      {selectedId && initial < 0 && (
        <p role="status" className={styles.caption}>
          {t.invalidSelection}
        </p>
      )}
      <div className={styles.workspace}>
        <div className={styles.canvasPanel}>
          <div className={styles.toolbar} role="group" aria-label={t.controls}>
            <button
              type="button"
              aria-label={t.zoomOut}
              disabled={view.zoom <= 1}
              onClick={() =>
                setView((v) => ({ ...v, zoom: fitZoom(v.zoom - 0.25) }))
              }
            >
              −
            </button>
            <output aria-live="polite">{Math.round(view.zoom * 100)}%</output>
            <button
              type="button"
              aria-label={t.zoomIn}
              disabled={view.zoom >= 2.5}
              onClick={() =>
                setView((v) => ({ ...v, zoom: fitZoom(v.zoom + 0.25) }))
              }
            >
              +
            </button>
            <button type="button" onClick={reset}>
              {t.reset} ⊙
            </button>
            <a href="#network-list">{t.list} ↓</a>
          </div>
          <div
            ref={viewport}
            className={styles.mapViewport}
            role="region"
            aria-label={
              uk ? "Прокручувана карта зв’язків" : "Scrollable connection map"
            }
            aria-describedby="network-help"
            tabIndex={0}
            onKeyDown={(event) => {
              if (
                event.target !== event.currentTarget ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey
              )
                return;
              const keys: Record<string, [number, number]> = {
                ArrowLeft: [70, 0],
                ArrowRight: [-70, 0],
                ArrowUp: [0, 70],
                ArrowDown: [0, -70],
              };
              if (keys[event.key]) {
                event.preventDefault();
                pan(...keys[event.key]);
              } else if (["+", "=", "-"].includes(event.key)) {
                event.preventDefault();
                setView((v) => ({
                  ...v,
                  zoom: fitZoom(v.zoom + (event.key === "-" ? -0.25 : 0.25)),
                }));
              } else if (event.key === "Home") {
                event.preventDefault();
                reset();
              }
            }}
            onPointerDown={(event) => {
              if (
                event.pointerType !== "mouse" ||
                event.button !== 0 ||
                (event.target as Element).closest("a")
              )
                return;
              drag.current = {
                x: event.clientX,
                y: event.clientY,
                baseX: view.x,
                baseY: view.y,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const d = drag.current;
              if (d)
                setView((v) => ({
                  ...v,
                  x: Math.max(
                    -650,
                    Math.min(650, d.baseX + event.clientX - d.x),
                  ),
                  y: Math.max(
                    -400,
                    Math.min(400, d.baseY + event.clientY - d.y),
                  ),
                }));
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <svg
              viewBox={
                compact
                  ? `260 210 600 ${480 + visible.length * 136}`
                  : `0 0 ${NETWORK_WIDTH} ${NETWORK_HEIGHT}`
              }
              className={styles.map}
              role="img"
              aria-label={
                uk
                  ? `Граф зв’язків ${constructorFocus ? "конструктора з пілотами" : "пілота з конструкторами"}: ${visible.length} у сезоні ${graph.year}`
                  : `${constructorFocus ? "Constructor connections to drivers" : "Driver connections to constructors"}: ${visible.length} in season ${graph.year}`
              }
            >
              <defs>
                <radialGradient id={gradient}>
                  <stop stopColor="#EF604F" stopOpacity=".24" />
                  <stop offset="1" stopColor="#EF604F" stopOpacity="0" />
                </radialGradient>
                <marker
                  id={`${gradient}-arrow`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <path d="M0 0L8 4L0 8Z" fill="#99A6B2" />
                </marker>
              </defs>
              <g
                data-testid="network-transform"
                transform={`translate(${560 + view.x} ${360 + view.y}) scale(${view.zoom}) translate(-560 -360)`}
              >
                <circle cx="560" cy="360" r="260" fill={`url(#${gradient})`} />
                <circle
                  className={styles.orbitOuter}
                  cx="560"
                  cy="360"
                  r="114"
                  fill="none"
                  stroke="#EF604F"
                  strokeDasharray="4 12"
                />
                <circle
                  className={styles.orbitInner}
                  cx="560"
                  cy="360"
                  r="142"
                  fill="none"
                  stroke="#99A6B2"
                  strokeOpacity=".25"
                  strokeDasharray="2 20"
                />
                {visible.map((edge, index) => {
                  const { x, y } = positions[index];
                  return (
                    <path
                      key={edge.key}
                      data-network-edge
                      markerEnd={`url(#${gradient}-arrow)`}
                      className={
                        edge.key === selected?.key
                          ? styles.selectedLine
                          : styles.connectionLine
                      }
                      d={
                        compact
                          ? `M446 360 C280 360 280 ${y} 330 ${y}`
                          : `M${x < 560 ? 446 : 674} 360 C${x < 560 ? 370 : 750} 360 ${x < 560 ? 400 : 720} ${y} ${x < 560 ? x + 124 : x - 124} ${y}`
                      }
                    />
                  );
                })}
                <circle
                  className={styles.core}
                  cx="560"
                  cy="360"
                  r="100"
                  fill="#0B0F14"
                  stroke="#EF604F"
                  strokeWidth="2"
                />
                <text
                  x="560"
                  y="310"
                  textAnchor="middle"
                  className={styles.coreLabel}
                >
                  {constructorFocus
                    ? uk
                      ? "КОНСТРУКТОР"
                      : "CONSTRUCTOR"
                    : uk
                      ? "ПІЛОТ"
                      : "DRIVER"}
                </text>
                {nodeLines(focus.name, 19).map((line, i) => (
                  <text
                    key={i}
                    x="560"
                    y={345 + i * 24}
                    textAnchor="middle"
                    className={styles.coreName}
                  >
                    {line}
                  </text>
                ))}
                <text
                  x="560"
                  y="420"
                  textAnchor="middle"
                  className={styles.coreYear}
                >
                  {graph.year}
                </text>
                {visible.map((edge, i) => {
                  const node = nodeFor(edge.to);
                  const { x, y } = positions[i];
                  return (
                    <a
                      key={edge.key}
                      href="#explorer-inspector"
                      data-network-node
                      title={node.name}
                      className={styles.nodeLink}
                      onClick={(event) => {
                        event.preventDefault();
                        choose(node.entity_id, true);
                      }}
                      aria-label={
                        uk
                          ? `${node.name} ${recordCountLabel(edge.races, locale, "races")}, переглянути зв’язок`
                          : `${node.name} ${recordCountLabel(edge.races, locale, "races")}, inspect connection`
                      }
                      aria-current={
                        edge.key === selected?.key ? "true" : undefined
                      }
                    >
                      <rect
                        x={x - (compact ? 230 : 124)}
                        y={y - 54}
                        width={compact ? 460 : 248}
                        height="108"
                        rx="4"
                      />
                      <circle
                        cx={x - (compact ? 210 : 106)}
                        cy={y - 35}
                        r="3"
                      />
                      {nodeLines(node.name, compact ? 34 : 25).map(
                        (line, j) => (
                          <text
                            key={j}
                            x={x}
                            y={y - 24 + j * 20}
                            textAnchor="middle"
                            className={styles.nodeName}
                          >
                            {line + " "}
                          </text>
                        ),
                      )}
                      <text
                        x={x}
                        y={y + 40}
                        textAnchor="middle"
                        className={styles.nodeCount}
                      >
                        {recordCountLabel(edge.races, locale, "races") + " "}
                      </text>
                    </a>
                  );
                })}
              </g>
            </svg>
          </div>
          <div className={styles.canvasFooter}>
            <span>
              <i /> {t.observed}
            </span>
            <div role="group" aria-label={t.pan}>
              {[
                [t.left, "←", 70, 0],
                [t.up, "↑", 0, 70],
                [t.down, "↓", 0, -70],
                [t.right, "→", -70, 0],
              ].map(([label, symbol, x, y]) => (
                <button
                  key={label}
                  type="button"
                  aria-label={String(label)}
                  onClick={() => pan(Number(x), Number(y))}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>
          <nav className={styles.windowNav} aria-label={t.window}>
            <button
              disabled={windowIndex === 0}
              onClick={() => {
                setWindowIndex((v) => v - 1);
                reset();
              }}
            >
              {t.previous} ←
            </button>
            <span>
              {windowIndex * pageSize + 1}–
              {Math.min((windowIndex + 1) * pageSize, graph.edges.length)} /{" "}
              {graph.edges.length}
              {graph.truncated ? "+" : ""}
            </span>
            <button
              disabled={(windowIndex + 1) * pageSize >= graph.edges.length}
              onClick={() => {
                setWindowIndex((v) => v + 1);
                reset();
              }}
            >
              {t.next} →
            </button>
          </nav>
          <p id="network-help" className={styles.caption}>
            {t.help}
          </p>
          <p className={styles.caption}>{t.slice}</p>
          <p className={styles.caption}>
            {uk
              ? "Лінії показують записи результатів, а не контракти чи правонаступництво."
              : "Lines represent recorded results, not contracts or team succession."}
          </p>
        </div>
        {selected && selectedNode && (
          <aside
            id="explorer-inspector"
            className={styles.inspector}
            aria-label={uk ? "Деталі зв’язку" : "Connection details"}
            tabIndex={-1}
          >
            <nav
              className={styles.edgeNavigation}
              aria-label={uk ? "Перемикання зв’язків" : "Browse connections"}
            >
              <span>
                {uk ? "Зв’язок" : "Connection"} {selectedIndex + 1} /{" "}
                {graph.edges.length}
              </span>
              {previous ? (
                <a
                  href={`${graphHref}&selected=${previous.entity_id}#explorer-inspector`}
                  onClick={(event) => {
                    event.preventDefault();
                    choose(previous.entity_id, true);
                  }}
                >
                  ← {uk ? "Попередній" : "Previous"}
                </a>
              ) : (
                <span aria-disabled="true">
                  ← {uk ? "Попередній" : "Previous"}
                </span>
              )}
              {next ? (
                <a
                  href={`${graphHref}&selected=${next.entity_id}#explorer-inspector`}
                  onClick={(event) => {
                    event.preventDefault();
                    choose(next.entity_id, true);
                  }}
                >
                  {uk ? "Наступний" : "Next"} →
                </a>
              ) : (
                <span aria-disabled="true">{uk ? "Наступний" : "Next"} →</span>
              )}
            </nav>
            <h2 aria-live="polite">
              {uk ? "Деталі зв’язку" : "Connection details"}:{" "}
              {selectedNode.name}
            </h2>
            <p>
              {focus?.name} → {selectedNode.name} · {selected.year}
            </p>
            <p className={styles.permalink}>
              <a
                href={`${graphHref}&selected=${selectedNode.entity_id}#explorer-inspector`}
              >
                {uk
                  ? "Постійне посилання на цей зв’язок ↗"
                  : "Open a link to this connection ↗"}
              </a>
            </p>
            <dl className={styles.facts}>
              <div>
                <dt>{uk ? "Гонки з результатами" : "Races with results"}</dt>
                <dd>{selected.races}</dd>
              </div>
              <div>
                <dt>{uk ? "Записи результатів" : "Result entries"}</dt>
                <dd>{selected.result_entries}</dd>
              </div>
              <div>
                <dt>
                  {uk
                    ? "Гонки з переможними результатами"
                    : "Races with winning results"}
                </dt>
                <dd>{selected.winning_races}</dd>
              </div>
            </dl>
            <p className={styles.caption}>
              {uk
                ? "Зафіксована асоціація результатів, не доказ офіційних стартів або контрактів."
                : "Recorded result association, not evidence of official starts or contracts."}
            </p>
            <p className={styles.caption}>
              {constructorFocus
                ? uk
                  ? "Джерело ідентичності конструктора"
                  : "Constructor identity source"
                : uk
                  ? "Джерело ідентичності пілота"
                  : "Driver identity source"}
              :{" "}
              <a
                href={graph.source.homepage_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {graph.source.attribution}
              </a>
              .{" "}
              {uk
                ? "Не є джерелом кожного окремого запису."
                : "Not per-result provenance."}
            </p>
            <EvidencePreviewPanel
              driver={
                constructorFocus ? selectedNode.entity_id : focus!.entity_id
              }
              constructor={
                constructorFocus ? focus!.entity_id : selectedNode.entity_id
              }
              year={graph.year}
              locale={locale}
            />
            <p>
              <a
                href={`/${locale}/time-machine?kind=${constructorFocus ? "constructor" : "driver"}&id=${focus?.entity_id}&from=${graph.year === 2200 ? 2199 : graph.year}&to=${graph.year === 2200 ? 2200 : graph.year + 1}`}
              >
                {t.machine} ↗
              </a>
            </p>
            <details
              className={styles.contextDisclosure}
              data-testid="result-record-context"
            >
              <summary>
                {uk ? "Як читати ці записи" : "How to read these records"}
              </summary>
              <div
                className={styles.resultContext}
                aria-label={
                  uk
                    ? "Пояснення даних результатів"
                    : "Understanding result records"
                }
              >
                <p className={styles.resultContextTitle}>
                  <strong>
                    {uk
                      ? "Що означає цей зв’язок?"
                      : "What does this connection mean?"}
                  </strong>
                </p>
                <p>
                  {uk
                    ? `У сезоні ${selected.year} архів містить записи результатів для пари «${focus?.name} — ${selectedNode.name}» у ${selected.races} гонках.`
                    : `In the ${selected.year} season, the archive contains result records for the ${focus?.name} — ${selectedNode.name} pair across ${selected.races} races.`}
                </p>
                <p>
                  {selected.result_entries > selected.races
                    ? uk
                      ? `Записів результатів (${selected.result_entries}) більше, ніж гонок (${selected.races}): одна гонка може мати кілька записів для цієї пари.`
                      : `There are more result entries (${selected.result_entries}) than races (${selected.races}); one race can contribute multiple entries for this pair.`
                    : uk
                      ? "Лічильник гонок рахує окремі гонки з записами цієї пари, а не офіційні старти."
                      : "The race count covers distinct races with records for this pair, not official starts."}
                </p>
                <p>
                  {selected.winning_races === 0
                    ? uk
                      ? "У цих записах немає гонок із переможним результатом."
                      : "None of these records are associated with a winning race result."
                    : uk
                      ? `Серед них ${selected.winning_races} гонок із записаним переможним результатом; це не автоматично статистика перемог у кар’єрі.`
                      : `Of those races, ${selected.winning_races} have a recorded winning result; this is not automatically a career win total.`}
                </p>
              </div>
            </details>
            <p className={styles.reverseExplore}>
              <a
                href={`/${locale}/explorer/${constructorFocus ? "drivers" : "constructors"}/${selectedNode.entity_id}?year=${graph.year}&selected=${focus?.entity_id}#explorer-inspector`}
              >
                {constructorFocus
                  ? uk
                    ? "Дослідити зв’язки цього пілота →"
                    : "Explore this driver’s connections →"
                  : uk
                    ? "Дослідити зв’язки цього конструктора →"
                    : "Explore this constructor’s connections →"}
              </a>
            </p>
            <p>
              <a
                href={`/${locale}/explorer/evidence/${constructorFocus ? selectedNode.entity_id : focus?.entity_id}/${constructorFocus ? focus?.entity_id : selectedNode.entity_id}?year=${graph.year}&from=${constructorFocus ? "constructor" : "driver"}&selected=${selectedNode.entity_id}`}
              >
                {uk
                  ? "Переглянути гонки, що підтверджують зв’язок →"
                  : "See races behind this connection →"}
              </a>
            </p>
            <Link href={`/${neighborRoute}/${selectedNode.entity_id}`}>
              {constructorFocus
                ? uk
                  ? "Відкрити профіль пілота →"
                  : "Open driver profile →"
                : uk
                  ? "Відкрити профіль конструктора →"
                  : "Open constructor profile →"}
            </Link>
          </aside>
        )}
      </div>
      <section
        id="network-list"
        className={styles.connectionList}
        aria-label={t.list}
      >
        <header>
          <h2>{uk ? "Зафіксовані зв’язки" : "Recorded connections"}</h2>
          <a
            href={`/${locale}/explorer/connections/${constructorFocus ? "constructors" : "drivers"}/${focus.entity_id}?year=${graph.year}&offset=0`}
          >
            {t.all} ↗
          </a>
        </header>
        <ul className={styles.list}>
          {graph.edges.map((edge) => {
            const node = nodeFor(edge.to);
            return (
              <li key={edge.key}>
                <button
                  type="button"
                  aria-pressed={edge.key === selected?.key}
                  onClick={() => choose(node.entity_id)}
                >
                  {node.name}
                </button>
                <span>
                  {recordCountLabel(edge.races, locale, "races")} ·{" "}
                  {recordCountLabel(edge.result_entries, locale, "entries")}
                </span>
                <Link href={`/${neighborRoute}/${node.entity_id}`}>
                  {uk ? "Профіль" : "Profile"} ↗
                </Link>
                <noscript>
                  <a
                    href={`${graphHref}&selected=${node.entity_id}#explorer-inspector`}
                  >
                    {uk ? "Деталі зв’язку" : "Connection details"}
                  </a>
                </noscript>
              </li>
            );
          })}
        </ul>
      </section>
    </section>
  );
}
