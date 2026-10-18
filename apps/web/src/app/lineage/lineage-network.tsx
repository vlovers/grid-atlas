'use client';

import { useMemo, useState } from 'react';
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
 const graph = useMemo(() => {
   const keys = new Map<string, { id: string; name: string; kind: Node['kind'] }>();
   for (const edge of edges) {
     keys.set(edge.entity_type + ':' + edge.subject_id, { id: edge.subject_id, name: edge.subject_name, kind: edge.entity_type });
     keys.set(edge.entity_type + ':' + edge.object_id, { id: edge.object_id, name: edge.object_name, kind: edge.entity_type });
   }
   const nodes = [...keys.entries()].sort((a,b) => a[1].name.localeCompare(b[1].name)).map(([key, value], i) => ({
     key, ...value, x: 25 + (i % 4) * 240, y: 35 + Math.floor(i / 4) * 130,
   }));
   const positions = new Map(nodes.map(node => [node.key, node]));
   return { nodes, positions, height: Math.max(170, 60 + Math.ceil(nodes.length / 4) * 130) };
 }, [edges]);
 if (!edges.length) return null;
 const active = edges.find(edge => edge.entity_type + ':' + edge.id === selected);
 return <section aria-label="Схема подтверждённых связей">
   <h2>Карта связей</h2>
   <p>Выберите стрелку, чтобы посмотреть тип перехода, год и первоисточник. Схема показывает подтверждённые отношения, а не юридическую преемственность.</p>
   <div style={{ overflowX: 'auto' }}>
     <svg viewBox={`0 0 ${W} ${graph.height}`} width={W} role="img" aria-label="Схема команд и направленных исторических переходов">
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
