'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import type { ExplorerGraph } from '@/lib/explorer-contract';
import styles from './explorer-graph.module.css';

type Props = { graph: ExplorerGraph; locale: 'en' | 'uk' };
const DISPLAY_LIMIT = 10;
const WIDTH = 840;
const HEIGHT = 540;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS_X = 287;
const RADIUS_Y = 191;

/** Bounded observed-result graph and synchronized accessible edge inspector. */
export default function ExplorerGraph({ graph, locale }: Props) {
  const uk = locale === 'uk';
  const focus = graph.nodes.find(node => node.key === graph.focus);
  const visible = graph.edges.slice(0, DISPLAY_LIMIT);
  const [selectedKey, setSelectedKey] = useState<string | null>(graph.edges[0]?.key ?? null);
  const selected = graph.edges.find(edge => edge.key === selectedKey) ?? graph.edges[0];
  const selectedNode = selected && graph.nodes.find(node => node.key === selected.to);

  return <section className={styles.panel} aria-label={uk ? 'Карта зв’язків' : 'Connection map'}>
    <div className={styles.header}>
      <strong>{uk ? 'Карта сезону' : 'Season map'} · {graph.year}</strong>
      <span>{uk ? 'Пілот у центрі' : 'Driver at center'}</span>
    </div>
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.map} role="img"
      aria-label={uk
        ? `Граф зв’язків пілота з ${visible.length} конструкторами у сезоні ${graph.year}`
        : `Driver connections to ${visible.length} constructors in season ${graph.year}`}>
      <defs>
        <radialGradient id="hx02-glow"><stop offset="0" stopColor="#e53935" stopOpacity=".25" />
          <stop offset="1" stopColor="#e53935" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx={CENTER_X} cy={CENTER_Y} r="225" fill="url(#hx02-glow)" />
      {visible.map((edge, i) => {
        const angle = -Math.PI / 2 + i * 2 * Math.PI / visible.length;
        const x = CENTER_X + RADIUS_X * Math.cos(angle);
        const y = CENTER_Y + RADIUS_Y * Math.sin(angle);
        return <line key={edge.key} x1={CENTER_X} y1={CENTER_Y} x2={x} y2={y}
          stroke={edge.key === selected?.key ? '#ff7a6f' : '#f04438'}
          strokeOpacity={edge.key === selected?.key ? '1' : '.45'}
          strokeWidth={edge.key === selected?.key ? '4' : '2'} strokeDasharray="5 5" />;
      })}
      <circle cx={CENTER_X} cy={CENTER_Y} r="87" fill="#c91e23" stroke="#ff6b67" strokeWidth="3" />
      <text x={CENTER_X} y={CENTER_Y - 18} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
        {uk ? 'ПІЛОТ' : 'DRIVER'}
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
          onClick={() => setSelectedKey(edge.key)}
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
    <p className={styles.caption}>{uk
      ? 'Лінії показують записи результатів, а не контракти чи правонаступництво.'
      : 'Lines represent recorded results, not contracts or team succession.'}
      {graph.edges.length > DISPLAY_LIMIT && ' ' + (uk
        ? `На карті показано ${DISPLAY_LIMIT} із ${graph.edges.length} зв’язків. Повний список нижче.`
        : `Map shows ${DISPLAY_LIMIT} of ${graph.edges.length} links. Full list below.`)}
    </p>
    {selected && selectedNode && <aside id="explorer-inspector" className={styles.inspector}
      aria-label={uk ? 'Деталі зв’язку' : 'Connection details'} tabIndex={-1}>
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
      <p className={styles.caption}>{uk ? 'Джерело ідентичності пілота' : 'Driver identity source'}:{' '}
        <a href={graph.source.homepage_url} target="_blank" rel="noopener noreferrer">
          {graph.source.attribution}</a>.{' '}
        {uk ? 'Не є джерелом кожного окремого запису.' : 'Not per-result provenance.'}
      </p>
      <Link href={`/constructors/${selectedNode.entity_id}`}>
        {uk ? 'Відкрити профіль конструктора →' : 'Open constructor profile →'}
      </Link>
    </aside>}
    <h2>{uk ? 'Зафіксовані зв’язки' : 'Recorded connections'}</h2>
    <ul className={styles.list}>{graph.edges.map(edge => {
      const node = graph.nodes.find(item => item.key === edge.to);
      if (!node) return null;
      return <li key={edge.key}>
        <button type="button" aria-pressed={edge.key === selected?.key}
          onClick={() => setSelectedKey(edge.key)}>{node.name}</button>
        {' — '}{edge.races} {uk ? 'гонок із результатами' : 'races with results'}
        {' · '}{edge.result_entries} {uk ? 'записів результатів' : 'result entries'}
        {' · '}<Link href={`/constructors/${node.entity_id}`}>{uk ? 'Профіль' : 'Profile'}</Link>
      </li>;
    })}</ul>
  </section>;
}
