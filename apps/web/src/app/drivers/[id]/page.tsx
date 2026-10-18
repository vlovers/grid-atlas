import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData } from '@/lib/api';

export const dynamic = 'force-dynamic';
type Profile = { id: string; name: string; external_id: string; starts: number; seasons: number; first_season: number | null; last_season: number | null; wins: number; podiums: number; points: string };
type SeasonSummary = { year: number; starts: number; wins: number; podiums: number; points: string };
type Props = { params: Promise<{ id: string }> };
function validId(id: string) { return /^[1-9][0-9]*$/.test(id) && Number(id) <= 2147483647; }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!validId(id)) return { title: 'Пилот не найден' };
  const profiles = await getData<Profile>(`/api/drivers/${id}`);
  return { title: profiles[0]?.name ?? 'Пилот не найден' };
}

export default async function DriverProfile({ params }: Props) {
  const { id } = await params;
  if (!validId(id)) notFound();
  const [profiles, seasons] = await Promise.all([
    getData<Profile>(`/api/drivers/${id}`),
    getData<SeasonSummary>(`/api/drivers/${id}/seasons`),
  ]);
  const driver = profiles[0];
  if (!driver) notFound();
  return <section className="page">
    <p className="eyebrow">ARCHIVE / DRIVER · {driver.external_id}</p>
    <h1>{driver.name}</h1>
    <p className="lead">История выступлений по данным F1DB. Статистика основана на загруженных результатах гонок.</p>
    <div className="driver-grid" aria-label="Статистика карьеры">
      {([['Сезоны', driver.seasons], ['Выступления', driver.starts], ['Победы', driver.wins], ['Подиумы', driver.podiums], ['Очки', driver.points]] as const).map(([label, value]) =>
        <article className="driver" key={label}><span className="index">{label}</span><h2>{value}</h2></article>)}
    </div>
    <h2>Результаты по сезонам</h2>
    {seasons.length ? <div className="table-scroll"><table><thead><tr><th>Сезон</th><th>Выступления</th><th>Победы</th><th>Подиумы</th><th>Очки</th></tr></thead><tbody>{seasons.map(s =>
      <tr key={s.year}><td><Link href={`/seasons/${s.year}`}>{s.year}</Link></td><td>{s.starts}</td><td>{s.wins}</td><td>{s.podiums}</td><td>{s.points}</td></tr>
    )}</tbody></table></div> : <p>Результаты пока не загружены.</p>}
    <Link className="back" href="/drivers">← Все пилоты</Link>
  </section>;
}
