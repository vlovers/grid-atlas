'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

export type LineageEdge = {
 id: string; entity_type: 'constructor' | 'entrant'; subject_id: string;
 subject_name: string; object_id: string; object_name: string;
 relation_type: string; effective_year: number | null;
 source_url: string; source_title: string; source_publisher: string;
};
const labels: Record<string,string> = {
 renamed_to: 'Переименование', ownership_transferred_to: 'Смена владельца',
 operations_succeeded_by: 'Операционная преемственность', assets_acquired_by: 'Передача активов',
};

export default function LineageExplorer({ edges }: { edges: LineageEdge[] }) {
 const [kind, setKind] = useState<'all' | 'constructor' | 'entrant'>('all');
 const [query, setQuery] = useState('');
 const [relation, setRelation] = useState('all');
 const [sort, setSort] = useState<'oldest' | 'newest' | 'name'>('oldest');
 const relations = useMemo(() => [...new Set(edges.map(edge => edge.relation_type))].sort(), [edges]);
 const visible = useMemo(() => edges.filter(edge =>
   (kind === 'all' || edge.entity_type === kind) &&
   (relation === 'all' || edge.relation_type === relation) &&
   (!query.trim() || [edge.subject_name, edge.object_name].some(name => name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())))
 ).sort((a, b) => {
   if (sort === 'name') return a.subject_name.localeCompare(b.subject_name) || a.object_name.localeCompare(b.object_name);
   const aYear = a.effective_year ?? (sort === 'oldest' ? Infinity : -Infinity);
   const bYear = b.effective_year ?? (sort === 'oldest' ? Infinity : -Infinity);
   return (sort === 'oldest' ? aYear - bYear : bYear - aYear)
     || a.subject_name.localeCompare(b.subject_name)
     || a.object_name.localeCompare(b.object_name);
 }), [edges, kind, query, relation, sort]);
 return <section aria-label="Поиск исторических связей">
   <div className="lineage-controls">
     <label>Поиск команды <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Например, Jordan" /></label>
     <label>Тип сущности <select value={kind} onChange={event => setKind(event.target.value as typeof kind)}>
       <option value="all">Все</option><option value="constructor">Конструкторы</option><option value="entrant">Участники чемпионата</option>
     </select></label>
     <label>Тип связи <select value={relation} onChange={event => setRelation(event.target.value)}>
       <option value="all">Все связи</option>{relations.map(value => <option key={value} value={value}>{labels[value] ?? value}</option>)}
     </select></label>
     <label>Порядок <select value={sort} onChange={event => setSort(event.target.value as typeof sort)}>
       <option value="oldest">Сначала ранние</option><option value="newest">Сначала новые</option><option value="name">По названию команды</option>
     </select></label>
   </div>
   <p role="status">Показано связей: {visible.length} из {edges.length}</p>
   {visible.length ? <div className="lineage-graph" role="list">{visible.map(edge => {
     const prefix = edge.entity_type === 'constructor' ? 'constructors' : 'entrants';
     return <div className="lineage-edge" role="listitem" key={edge.entity_type + '-' + edge.id}>
       <Link className="lineage-node" href={`/${prefix}/${edge.subject_id}`}><small>{edge.entity_type === 'constructor' ? 'Конструктор' : 'Участник'}</small><strong>{edge.subject_name}</strong></Link>
       <div className="lineage-arrow"><span>{edge.effective_year ?? 'Год неизвестен'}</span><span aria-hidden="true">→</span><small>{labels[edge.relation_type] ?? edge.relation_type}</small><a href={edge.source_url} target="_blank" rel="noopener noreferrer" aria-label={`Источник: ${edge.source_title}`}>Источник ↗</a></div>
       <Link className="lineage-node" href={`/${prefix}/${edge.object_id}`}><small>{edge.entity_type === 'constructor' ? 'Конструктор' : 'Участник'}</small><strong>{edge.object_name}</strong></Link>
     </div>;
   })}</div> : <p>{edges.length ? 'По выбранным фильтрам связей нет.' : 'Проверенные связи пока не опубликованы. Данные появятся после проверки источников.'}</p>}
 </section>;
}
