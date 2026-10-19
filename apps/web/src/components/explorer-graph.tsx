'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { ExplorerGraph } from '@/lib/explorer-contract';
import styles from './explorer-graph.module.css';

type Props = { graph: ExplorerGraph; locale: 'en' | 'uk'; selectedId?: string };
const DISPLAY_LIMIT = 10;
const WIDTH = 840;
const HEIGHT = 540;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS_X = 287;
const RADIUS_Y = 191;

/** Bounded observed-result graph and synchronized accessible edge inspector. */
export default function ExplorerGraph({ graph, locale, selectedId }: Props) {
  const uk = locale === 'uk';
  const constructorFocus = graph.focus.startsWith('constructor:');
  const neighborRoute = constructorFocus ? 'drivers' : 'constructors';
  const focus = graph.nodes.find(node => node.key === graph.focus);
  const visible = graph.edges.slice(0, DISPLAY_LIMIT);
  const initialSelection = graph.edges.find(edge =>
    graph.nodes.find(node => node.key === edge.to)?.entity_id === selectedId);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    initialSelection?.key ?? graph.edges[0]?.key ?? null);
  const selectEdge = (key: string, nodeId: string, anchor = false) => {
    setSelectedKey(key);
    const url = new URL(window.location.href);
    url.searchParams.set('selected', nodeId);
    // A full navigation makes the query the canonical selection; Next's router
    // can otherwise restore its previous search params after replaceState.
    window.location.assign(url.pathname + url.search + (anchor ? '#explorer-inspector' : url.hash));
  };
  const selected = graph.edges.find(edge => edge.key === selectedKey) ?? graph.edges[0];
  const selectedNode = selected && graph.nodes.find(node => node.key === selected.to);
  const selectedIndex = graph.edges.findIndex(edge => edge.key === selected?.key);
  const adjacentNode = (step: number) => {
    const edge = graph.edges[selectedIndex + step];
    return edge && graph.nodes.find(node => node.key === edge.to);
  };
  const previous = adjacentNode(-1);
  const next = adjacentNode(1);
  const graphHref = `/${locale}/explorer/${constructorFocus ? 'constructors' : 'drivers'}/${focus?.entity_id}?year=${graph.year}`;


  return <section className={styles.panel} aria-label={uk ? 'Карта зв’язків' : 'Connection map'}>
    <div className={styles.header}>
      <strong>{uk ? 'Карта сезону' : 'Season map'} · {graph.year}</strong>
      <span>{constructorFocus ? (uk ? 'Конструктор у центрі' : 'Constructor at center') : (uk ? 'Пілот у центрі' : 'Driver at center')}</span>
    </div>
    <div className={styles.mapViewport} role="region"
      aria-label={uk ? 'Прокручувана карта зв’язків' : 'Scrollable connection map'}
      tabIndex={0}>
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.map} role="img"
      aria-label={uk
        ? `Граф зв’язків ${constructorFocus ? 'конструктора з пілотами' : 'пілота з конструкторами'}: ${visible.length} у сезоні ${graph.year}`
        : `${constructorFocus ? 'Constructor connections to drivers' : 'Driver connections to constructors'}: ${visible.length} in season ${graph.year}`}>
      <defs>
        <radialGradient id="hx02-glow"><stop offset="0" stopColor="#e53935" stopOpacity=".25" />
          <stop offset="1" stopColor="#e53935" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx={CENTER_X} cy={CENTER_Y} r="225" fill="url(#hx02-glow)" />
      <circle className={styles.orbitOuter} cx={CENTER_X} cy={CENTER_Y} r="114"
        fill="none" stroke="#ff7468" strokeWidth="1.5" strokeDasharray="4 12" />
      <circle className={styles.orbitInner} cx={CENTER_X} cy={CENTER_Y} r="99"
        fill="none" stroke="#e7726d" strokeWidth="1" strokeDasharray="2 9" />
      {visible.map((edge, i) => {
        const angle = -Math.PI / 2 + i * 2 * Math.PI / visible.length;
        const x = CENTER_X + RADIUS_X * Math.cos(angle);
        const y = CENTER_Y + RADIUS_Y * Math.sin(angle);
        return <line key={edge.key} className={styles.connectionLine} x1={CENTER_X} y1={CENTER_Y} x2={x} y2={y}
          stroke={edge.key === selected?.key ? '#ff7a6f' : '#f04438'}
          strokeOpacity={edge.key === selected?.key ? '1' : '.45'}
          strokeWidth={edge.key === selected?.key ? '4' : '2'} strokeDasharray="5 5" />;
      })}
      <circle className={styles.core} cx={CENTER_X} cy={CENTER_Y} r="87"
        fill="#c91e23" stroke="#ff6b67" strokeWidth="3" />
      <text x={CENTER_X} y={CENTER_Y - 18} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
        {constructorFocus ? (uk ? 'КОНСТРУКТОР' : 'CONSTRUCTOR') : (uk ? 'ПІЛОТ' : 'DRIVER')}
      </text>
      <text x={CENTER_X} y={CENTER_Y + 8} textAnchor="middle" fill="#fff" fontSize="17" fontWeight="700">
        {(focus?.name ?? graph.focus).slice(0, 22)}
      </text>
      <text x={CENTER_X} y={CENTER_Y + 31} textAnchor="middle" fill="#fff" fontSize="12">{graph.year}</text>
      {visible.map((edge, i) => {
        const node = graph.nodes.find(item => item.key === edge.to);
        if (!node) return null;
        const angle = -Math.PI / 2 + i * 2 * Math.PI / visible.length;
        const x = CENTER_X + RADIUS_X * Math.cos(angle);
        const y = CENTER_Y + RADIUS_Y * Math.sin(angle);
        return <a key={edge.key} href="#explorer-inspector"
          onClick={event => { event.preventDefault(); selectEdge(edge.key, node.entity_id, true); }}
          className={styles.nodeLink}
          aria-label={uk ? `${node.name}, переглянути зв’язок` : `${node.name}, inspect connection`}
          aria-current={edge.key === selected?.key ? 'true' : undefined}>
          <circle cx={x} cy={y} r="48" fill={edge.key === selected?.key ? '#603039' : '#202b36'}
            stroke={edge.key === selected?.key ? '#ff7a6f' : '#8c9ba7'} strokeWidth="2" />
          <text x={x} y={y - 5} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">
            {node.name.length > 15 ? node.name.slice(0, 13) + '…' : node.name}
          </text>
          <text x={x} y={y + 15} textAnchor="middle" fill="#b9c7d2" fontSize="10">
            {edge.races} {uk ? 'гонок' : 'races'}
          </text>
        </a>;
      })}
    </svg>
    </div>
    <p className={styles.mobileHint}>{uk
      ? 'На вузькому екрані прокручуйте карту горизонтально або обирайте зв’язок у списку нижче.'
      : 'On smaller screens, scroll the map sideways or select a connection in the list below.'}</p>
    <p className={styles.caption}>{uk
      ? 'Лінії показують записи результатів, а не контракти чи правонаступництво.'
      : 'Lines represent recorded results, not contracts or team succession.'}
      {graph.edges.length > DISPLAY_LIMIT && ' ' + (uk
        ? `На карті показано ${DISPLAY_LIMIT} із ${graph.edges.length} зв’язків. Повний список нижче.`
        : `Map shows ${DISPLAY_LIMIT} of ${graph.edges.length} links. Full list below.`)}
    </p>
    {selected && selectedNode && <aside id="explorer-inspector" className={styles.inspector}
      aria-label={uk ? 'Деталі зв’язку' : 'Connection details'} tabIndex={-1}>
      <nav className={styles.edgeNavigation} aria-label={uk ? 'Перемикання зв’язків' : 'Browse connections'}>
        <span>{uk ? 'Зв’язок' : 'Connection'} {selectedIndex + 1} / {graph.edges.length}</span>
        {previous
          ? <a href={`${graphHref}&selected=${previous.entity_id}#explorer-inspector`}>
              ← {uk ? 'Попередній' : 'Previous'}
            </a>
          : <span aria-disabled="true">← {uk ? 'Попередній' : 'Previous'}</span>}
        {next
          ? <a href={`${graphHref}&selected=${next.entity_id}#explorer-inspector`}>
              {uk ? 'Наступний' : 'Next'} →
            </a>
          : <span aria-disabled="true">{uk ? 'Наступний' : 'Next'} →</span>}
      </nav>
      <h2>{uk ? 'Деталі зв’язку' : 'Connection details'}: {selectedNode.name}</h2>
      <p>{focus?.name} → {selectedNode.name} · {selected.year}</p>
      <dl className={styles.facts}>
        <div><dt>{uk ? 'Гонки з результатами' : 'Races with results'}</dt><dd>{selected.races}</dd></div>
        <div><dt>{uk ? 'Записи результатів' : 'Result entries'}</dt><dd>{selected.result_entries}</dd></div>
        <div><dt>{uk ? 'Гонки з переможними результатами' : 'Races with winning results'}</dt><dd>{selected.winning_races}</dd></div>
      </dl>
      <p className={styles.caption}>{uk
        ? 'Зафіксована асоціація результатів, не доказ офіційних стартів або контрактів.'
        : 'Recorded result association, not evidence of official starts or contracts.'}</p>
      <p className={styles.caption}>{constructorFocus ? (uk ? 'Джерело ідентичності конструктора' : 'Constructor identity source') : (uk ? 'Джерело ідентичності пілота' : 'Driver identity source')}:{' '}
        <a href={graph.source.homepage_url} target="_blank" rel="noopener noreferrer">
          {graph.source.attribution}</a>.{' '}
        {uk ? 'Не є джерелом кожного окремого запису.' : 'Not per-result provenance.'}
      </p>
      <p className={styles.reverseExplore}>
        <a href={`/${locale}/explorer/${constructorFocus ? 'drivers' : 'constructors'}/${selectedNode.entity_id}?year=${graph.year}&selected=${focus?.entity_id}#explorer-inspector`}>
          {constructorFocus
            ? (uk ? 'Дослідити зв’язки цього пілота →' : 'Explore this driver’s connections →')
            : (uk ? 'Дослідити зв’язки цього конструктора →' : 'Explore this constructor’s connections →')}
        </a>
      </p>
      <p><a href={`/${locale}/explorer/evidence/${constructorFocus ? selectedNode.entity_id : focus?.entity_id}/${constructorFocus ? focus?.entity_id : selectedNode.entity_id}?year=${graph.year}&from=${constructorFocus ? 'constructor' : 'driver'}&selected=${selectedNode.entity_id}`}>
        {uk ? 'Переглянути гонки, що підтверджують зв’язок →' : 'See races behind this connection →'}
      </a></p>
      <Link href={`/${neighborRoute}/${selectedNode.entity_id}`}>
        {constructorFocus ? (uk ? 'Відкрити профіль пілота →' : 'Open driver profile →') : (uk ? 'Відкрити профіль конструктора →' : 'Open constructor profile →')}
      </Link>
    </aside>}
    <h2>{uk ? 'Зафіксовані зв’язки' : 'Recorded connections'}</h2>
    <ul className={styles.list}>{graph.edges.map(edge => {
      const node = graph.nodes.find(item => item.key === edge.to);
      if (!node) return null;
      return <li key={edge.key}>
        <button type="button" aria-pressed={edge.key === selected?.key}
          onClick={() => selectEdge(edge.key, node.entity_id)}>{node.name}</button>
        {' — '}{edge.races} {uk ? 'гонок із результатами' : 'races with results'}
        {' · '}{edge.result_entries} {uk ? 'записів результатів' : 'result entries'}
        {' · '}<Link href={`/${neighborRoute}/${node.entity_id}`}>{uk ? 'Профіль' : 'Profile'}</Link>
      </li>;
    })}</ul>
  </section>;
}
