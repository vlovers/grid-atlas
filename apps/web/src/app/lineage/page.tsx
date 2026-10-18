import type { Metadata } from 'next';
import { getData } from '@/lib/api';
import LineageExplorer, { type LineageEdge } from './lineage-explorer';

export const metadata: Metadata = { title: 'История команд — подтверждённые связи' };
export const dynamic = 'force-dynamic';

export default async function LineagePage() {
 const edges = await getData<LineageEdge>('/api/lineage/network');
 return <section className="page">
   <p className="eyebrow">GRID ATLAS / HISTORICAL NETWORK</p>
   <h1>История команд</h1>
   <p className="lead">Исследуйте подтверждённые исторические связи конструкторов и участников чемпионата. Каждый переход сопровождается источником; передача активов не равнозначна переименованию или юридической преемственности.</p>
   <LineageExplorer edges={edges} />
   <p>Показаны до 500 проверенных связей. Отсутствие перехода не доказывает отсутствие исторической связи.</p>
 </section>;
}
