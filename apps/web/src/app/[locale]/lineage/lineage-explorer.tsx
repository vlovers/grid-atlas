'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import LineageNetwork from './lineage-network';

export type LineageEdge = {
 id: string; entity_type: 'constructor' | 'entrant'; subject_id: string;
 subject_name: string; object_id: string; object_name: string;
 relation_type: string; effective_year: number | null;
 source_url: string; source_title: string; source_publisher: string;
};
export default function LineageExplorer({ edges }: { edges: LineageEdge[] }) {
 const t = useTranslations('UI');
 const locale = useLocale();
const labels: Record<string,string> = {
 renamed_to: t('renamed_to'), ownership_transferred_to: t('ownership_transferred_to'),
 operations_succeeded_by: t('operations_succeeded_by'), assets_acquired_by: t('assets_acquired_by'),
};

 const [kind, setKind] = useState<'all' | 'constructor' | 'entrant'>('all');
 const [query, setQuery] = useState('');
 const [relation, setRelation] = useState('all');
 const [view, setView] = useState<'list' | 'map'>('list');
 const [sort, setSort] = useState<'oldest' | 'newest' | 'name'>('oldest');
 const relations = useMemo(() => [...new Set(edges.map(edge => edge.relation_type))].sort(), [edges]);
 const visible = useMemo(() => edges.filter(edge =>
   (kind === 'all' || edge.entity_type === kind) &&
   (relation === 'all' || edge.relation_type === relation) &&
   (!query.trim() || [edge.subject_name, edge.object_name].some(name => name.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale))))
 ).sort((a, b) => {
   if (sort === 'name') return a.subject_name.localeCompare(b.subject_name, locale) || a.object_name.localeCompare(b.object_name, locale);
   const aYear = a.effective_year ?? (sort === 'oldest' ? Infinity : -Infinity);
   const bYear = b.effective_year ?? (sort === 'oldest' ? Infinity : -Infinity);
   return (sort === 'oldest' ? aYear - bYear : bYear - aYear)
     || a.subject_name.localeCompare(b.subject_name, locale)
     || a.object_name.localeCompare(b.object_name, locale);
 }), [edges, kind, query, relation, sort, locale]);
 return <section aria-label={t('relationshipSearch')}>
   <div className="lineage-controls">
     <label>{t('teamSearch')} <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('teamPlaceholder')} /></label>
     <label>{t('entityType')} <select value={kind} onChange={event => setKind(event.target.value as typeof kind)}>
       <option value="all">{t('all')}</option><option value="constructor">{t('constructorsTitle')}</option><option value="entrant">{t('entrants')}</option>
     </select></label>
     <label>{t('relationType')} <select value={relation} onChange={event => setRelation(event.target.value)}>
       <option value="all">{t('allRelations')}</option>{relations.map(value => <option key={value} value={value}>{labels[value] ?? value}</option>)}
     </select></label>
     <label>{t('sort')} <select value={sort} onChange={event => setSort(event.target.value as typeof sort)}>
       <option value="oldest">{t('oldest')}</option><option value="newest">{t('newest')}</option><option value="name">{t('teamName')}</option>
     </select></label>
   </div>
   <div className="lineage-controls"><button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>{t('list')}</button><button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>{t('map')}</button></div>
   <p role="status">{t('edgeCount', { count: visible.length, total: edges.length })}</p>
   {view === 'map' && visible.length > 0 ? <LineageNetwork edges={visible} /> : visible.length ? <div className="lineage-graph" role="list">{visible.map(edge => {
     const prefix = edge.entity_type === 'constructor' ? 'constructors' : 'entrants';
     return <div className="lineage-edge" role="listitem" key={edge.entity_type + '-' + edge.id}>
       <Link className="lineage-node" href={`/${prefix}/${edge.subject_id}`}><small>{edge.entity_type === 'constructor' ? t('constructor') : t('entrant')}</small><strong>{edge.subject_name}</strong></Link>
       <div className="lineage-arrow"><span>{edge.effective_year ?? t('unknownYear')}</span><span aria-hidden="true">→</span><small>{labels[edge.relation_type] ?? edge.relation_type}</small><a href={edge.source_url} target="_blank" rel="noopener noreferrer" aria-label={t('sourceLabel', { title: edge.source_title })}>{t('source')} ↗</a></div>
       <Link className="lineage-node" href={`/${prefix}/${edge.object_id}`}><small>{edge.entity_type === 'constructor' ? t('constructor') : t('entrant')}</small><strong>{edge.object_name}</strong></Link>
     </div>;
   })}</div> : <p>{edges.length ? t('noFilteredRelations') : t('noPublishedRelations')}</p>}
 </section>;
}
