import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getData, type Race } from '@/lib/api';
export default async function SeasonPage({ params }: { params: Promise<{ year: string }> }) {
 const { year } = await params;
 if (!/^(19[5-9][0-9]|20[0-9]{2}|21[0-9]{2})$/.test(year)) notFound();
 const races = await getData<Race>(`/api/seasons/${year}/races?limit=100`);
 return <section className="page"><p className="eyebrow">ARCHIVE / SEASON</p><h1>Сезон {year}</h1><p className="lead">Календарь Гран-при и результаты гонок.</p>{races.length === 0 ? <p>Гонки для сезона пока не найдены.</p> : <div className="records">{races.map(r=><Link key={r.id} className="record" href={`/races/${r.id}`}><span className="position">{String(r.round).padStart(2,'0')}</span><span><strong>{r.official_name}</strong><small>{r.circuit_name || 'Трасса не указана'}{r.race_date ? ' · '+r.race_date : ''}</small></span><span aria-hidden="true">↗</span></Link>)}</div>}<Link className="back" href="/seasons">← Все сезоны</Link></section>;
}
