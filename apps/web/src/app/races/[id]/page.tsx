import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getData, type Result } from '@/lib/api';
export default async function RacePage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = await params;
 if (!/^[1-9][0-9]*$/.test(id) || Number(id) > 2147483647) notFound();
 const results = await getData<Result>(`/api/races/${id}/results?limit=100`);
 return <section className="page"><p className="eyebrow">ARCHIVE / GRAND PRIX</p><h1>Результаты гонки</h1><p className="lead">Позиции участников по официальному порядку отображения. Гонка №{id} во внутренней базе.</p>{results.length ? <div className="table-scroll"><table><thead><tr><th scope="col">Поз.</th><th scope="col">Пилот</th><th scope="col">Конструктор</th><th scope="col">Круги</th><th scope="col">Очки</th></tr></thead><tbody>{results.map(r=><tr key={r.position_display_order}><td>{r.position_text}</td><td>{r.driver}</td><td>{r.constructor}</td><td>{r.laps ?? '—'}</td><td>{r.points ?? '—'}</td></tr>)}</tbody></table></div> : <p>Результаты пока не доступны.</p>}<Link className="back" href="/seasons">← К сезонам</Link></section>;
}
