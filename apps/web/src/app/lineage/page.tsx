import Link from 'next/link';
import type { Metadata } from 'next';
import { getData } from '@/lib/api';
export const metadata: Metadata = { title: 'История команд — граф связей' };
export const dynamic = 'force-dynamic';
type Edge = { id: string; entity_type: 'constructor' | 'entrant'; subject_id: string; subject_name: string; object_id: string; object_name: string; relation_type: string; effective_year: number | null; source_url: string; source_title: string; source_publisher: string };
const labels: Record<string,string> = { renamed_to: 'Переименование', ownership_transferred_to: 'Смена владельца', operations_succeeded_by: 'Операционная преемственность', assets_acquired_by: 'Передача активов' };
export default async function LineagePage() {
  const edges = await getData<Edge>('/api/lineage/network');
  const groups = [
    { kind: 'constructor' as const, title: 'Конструкторы', detail: 'Исторические связи конструкторов. Не являются доказательством юридической преемственности.' },
    { kind: 'entrant' as const, title: 'Участники чемпионата', detail: 'Связи заявок и участников. Передача активов не равнозначна продолжению той же заявки.' },
  ];
  return <section className="page">
    <p className="eyebrow">GRID ATLAS / HISTORICAL NETWORK</p>
    <h1>История команд</h1>
    <p className="lead">Граф документированных исторических связей. Каждый переход подтверждён отдельным источником и прошёл редакторскую проверку. Типы сущностей не смешиваются.</p>
    {groups.map(group => {
      const subset = edges.filter(edge => edge.entity_type === group.kind);
      return <section key={group.kind} aria-label={group.title}>
        <h2>{group.title}</h2><p>{group.detail}</p>
        {subset.length ? <div className="lineage-graph" role="list">{subset.map(edge => {
          const prefix = group.kind === 'constructor' ? 'constructors' : 'entrants';
          return <div className="lineage-edge" role="listitem" key={edge.id}>
            <Link className="lineage-node" href={`/${prefix}/${edge.subject_id}`}><small>{group.title}</small><strong>{edge.subject_name}</strong></Link>
            <div className="lineage-arrow"><span>{edge.effective_year ?? 'Год неизвестен'}</span><span aria-hidden="true">→</span><small>{labels[edge.relation_type] ?? edge.relation_type}</small><a href={edge.source_url} target="_blank" rel="noopener noreferrer">Источник ↗</a></div>
            <Link className="lineage-node" href={`/${prefix}/${edge.object_id}`}><small>{group.title}</small><strong>{edge.object_name}</strong></Link>
          </div>;
        })}</div> : <p>Проверенные связи этого типа пока не опубликованы.</p>}
      </section>;
    })}
    <p>Граф отображает до 500 подтверждённых связей; отсутствие перехода не доказывает отсутствие исторической связи.</p>
  </section>;
}
