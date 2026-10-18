export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { getData, type Driver } from '@/lib/api';
export const metadata: Metadata = { title: 'Пилоты' };
export default async function Drivers() { const drivers = await getData<Driver>('/api/drivers?limit=100'); return <section className="page"><p className="eyebrow">ARCHIVE / DRIVERS</p><h1>Пилоты</h1><p className="lead">Первые 100 пилотов в алфавитном порядке. Полный поиск и пагинация появятся позже.</p><div className="driver-grid">{drivers.map(d=><article className="driver" key={d.id}><span className="index">{d.external_id}</span><h2>{d.name}</h2></article>)}</div></section>; }
