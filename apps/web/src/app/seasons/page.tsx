import Link from 'next/link';
import type { Metadata } from 'next';
import { getData, type Season } from '@/lib/api';
export const metadata: Metadata = { title: 'Сезоны' };
export default async function Seasons() { const seasons = await getData<Season>('/api/seasons'); return <section className="page"><p className="eyebrow">ARCHIVE / SEASONS</p><h1>История сезонов</h1><p className="lead">От первого чемпионата мира до современных Гран-при.</p><div className="year-grid">{seasons.map(s => <Link className="year" key={s.year} href={`/seasons/${s.year}`}><strong>{s.year}</strong><span>Смотреть гонки ↗</span></Link>)}</div></section>; }
