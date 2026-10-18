'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { LineageEdge } from './lineage-explorer';

type Node = { key: string; id: string; name: string; kind: 'constructor' | 'entrant'; x: number; y: number };
const relationLabels: Record<string, string> = {
 renamed_to: 'Переименование', ownership_transferred_to: 'Смена владельца',
 operations_succeeded_by: 'Операционная преемственность', assets_acquired_by: 'Передача активов',
};
const W = 960;
const NODE_W = 190;
const NODE_H = 54;

export default function LineageNetwork({ edges }: { edges: LineageEdge[] }) {
 const [selected, setSelected] = useState<string | null>(null);
 const [zoom, setZoom] = useState(1);
 const viewport = useRef<HTMLDivElement>(null);
 const graph = useMemo(() => {
   const keys = new Map<string, { id: string; name: string; kind: Node['kind'] }>();
   for (const edge of edges) {
     keys.set(edge.entity_type + ':' + edge.subject_id, { id: edge.subject_id, name: edge.subject_name, kind: edge.entity_type });
     keys.set(edge.entity_type + ':' + edge.object_id, { id: edge.object_id, name: edge.object_name, kind: edge.entity_type });
   }
   // Layer nodes by directed reachability. Cycles are kept in a stable fallback
   // layer rather than triggering unbounded traversal.
   const indegree = new Map([...keys.keys()].map(key => [key, 0]));
   const adjacency = new Map([...keys.keys()].map(key => [key, new Set<string>()]));
   for (const edge of edges) {
     const from = edge.entity_type + ':' + edge.subject_id;
     const to = edge.entity_type + ':' + edge.object_id;
     if (!adjacency.get(from)?.has(to)) {
       adjacency.get(from)?.add(to);
       indegree.set(to, (indegree.get(to) ?? 0) + 1);
     }
   }
   const layers = new Map([...keys.keys()].map(key => [key, 0]));
   const queue = [...keys.keys()].filter(key => indegree.get(key) === 0).sort();
   for (let i = 0; i < queue.length; i++) {
     const from = queue[i];
     for (const to of adjacency.get(from) ?? []) {
       layers.set(to, Math.max(layers.get(to) ?? 0, (layers.get(from) ?? 0) + 1));
       indegree.set(to, (indegree.get(to) ?? 1) - 1);
       if (indegree.get(to) === 0) queue.push(to);
     }
   }
   const byLayer = new Map<number, string[]>();
   for (const key of keys.keys()) {
     const layer = layers.get(key) ?? 0;
     byLayer.set(layer, [...(byLayer.get(layer) ?? []), key]);
   }
   const nodes = [...keys.entries()].map(([key, value]) => {
     const layer = layers.get(key) ?? 0;
     const peers = (byLayer.get(layer) ?? []).sort((a,b) => (keys.get(a)?.name ?? '').localeCompare(keys.get(b)?.name ?? ''));
     return { key, ...value, x: 25 + layer * 240, y: 35 + peers.indexOf(key) * 130 };
   });
   const positions = new Map(nodes.map(node => [node.key, node]));
   const maxLayer = Math.max(0, ...layers.values());
   const maxRows = Math.max(1, ...[...byLayer.values()].map(group => group.length));
   return { nodes, positions, width: Math.max(W, 60 + (maxLayer + 1) * 240), height: Math.max(170, 60 + maxRows * 130) };
 }, [edges]);
 if (!edges.length) return null;
 const active = edges.find(edge => edge.entity_type + ':' + edge.id === selected);
 return <section aria-label="Схема подтверждённых связей">
   <h2>Карта связей</h2>
   <p>Выберите стрелку, чтобы посмотреть тип перехода, год и первоисточник. Схема показывает подтверждённые отношения, а не юридическую преемственность.</p>
   <div className="lineage-controls" aria-label="Управление масштабом карты">
     <button type="button" onClick={() => setZoom(value => Math.max(0.5, Math.round((value - 0.25) * 100) / 100))} disabled={zoom <= 0.5} aria-label="Уменьшить масштаб">−</button>
     <span aria-live="polite">Масштаб {Math.round(zoom * 100)}%</span>
     <button type="button" onClick={() => setZoom(value => Math.min(2, Math.round((value + 0.25) * 100) / 100))} disabled={zoom >= 2} aria-label="Увеличить масштаб">+</button>
     <button type="button" onClick={() => { setZoom(1); viewport.current?.scrollTo({ left: 0, top: 0, behavior: 'smooth' }); }}>Сбросить</button>
   </div>
   <p>На телефоне прокручивайте карту по горизонтали. Кнопки меняют масштаб, не затрагивая данные.</p>
   <div ref={viewport} tabIndex={0} role="region" aria-label="Прокручиваемая карта исторических связей" style={{ overflow: 'auto', maxHeight: 'min(70vh, 720px)', WebkitOverflowScrolling: 'touch' }}>
     <svg viewBox={`0 0 ${graph.width} ${graph.height}`} width={Math.round(graph.width * zoom)} height={Math.round(graph.height * zoom)} role="img" aria-label="Схема команд и направленных исторических переходов">
       <defs><marker id="lineage-arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
       {edges.map(edge => {
         const from = graph.positions.get(edge.entity_type + ':' + edge.subject_id);
         const to = graph.positions.get(edge.entity_type + ':' + edge.object_id);
         if (!from || !to) return null;
         const x1 = from.x + NODE_W / 2, y1 = from.y + NODE_H / 2;
         const x2 = to.x + NODE_W / 2, y2 = to.y + NODE_H / 2;
         const dx = x2-x1, dy = y2-y1, distance = Math.hypot(dx,dy) || 1;
         const startX = x1 + dx/distance * 35, startY = y1 + dy/distance * 35;
         const endX = x2 - dx/distance * 35, endY = y2 - dy/distance * 35;
         const key = edge.entity_type + ':' + edge.id;
         return <g key={key} onClick={() => setSelected(key)} role="button" tabIndex={0} onKeyDown={event => { if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(key); } }} aria-label={`${edge.subject_name} → ${edge.object_name}, ${relationLabels[edge.relation_type] ?? edge.relation_type}`} style={{ cursor: 'pointer' }}>
           <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="currentColor" strokeWidth={selected === key ? 3 : 1.5} opacity={selected && selected !== key ? 0.25 : 0.65} markerEnd="url(#lineage-arrowhead)" />
           <circle cx={(startX+endX)/2} cy={(startY+endY)/2} r="12" fill="var(--background, #fff)" stroke="currentColor" />
           <text x={(startX+endX)/2} y={(startY+endY)/2+4} fontSize="11" textAnchor="middle" fill="currentColor">{edge.effective_year ?? '?'}</text>
         </g>;
       })}
       {graph.nodes.map(node => <g key={node.key}>
         <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx="10" fill="var(--background, #fff)" stroke="currentColor" opacity=".95" />
         <text x={node.x+10} y={node.y+19} fontSize="11" fill="currentColor" opacity=".7">{node.kind === 'constructor' ? 'Конструктор' : 'Участник'}</text>
         <text x={node.x+10} y={node.y+39} fontSize="14" fontWeight="600" fill="currentColor">{node.name.length > 23 ? node.name.slice(0,22) + '…' : node.name}</text>
       </g>)}
     </svg>
   </div>
   {active && <div role="status" className="lineage-edge">
     <strong>{active.subject_name} → {active.object_name}</strong>
     <span>{relationLabels[active.relation_type] ?? active.relation_type} · {active.effective_year ?? 'Год неизвестен'}</span>
     <Link href={`/${active.entity_type === 'constructor' ? 'constructors' : 'entrants'}/${active.subject_id}`}>Открыть исходную команду</Link>
     <a href={active.source_url} target="_blank" rel="noopener noreferrer">Источник: {active.source_title} ↗</a>
   </div>}
 </section>;
}
