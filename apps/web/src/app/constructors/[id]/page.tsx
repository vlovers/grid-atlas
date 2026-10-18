import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData } from '@/lib/api';
export const dynamic = 'force-dynamic';
type Profile = { id: string; name: string; external_id: string; result_entries: number; races: number; seasons: number; first_season: number | null; last_season: number | null; wins: number; podium_finishes: number; driver_points: string };
type Season = { year: number; races: number; wins: number; podium_finishes: number; driver_points: string };
type Props = { params: Promise<{ id: string }> };
const valid = (id: string) => /^[1-9][0-9]*$/.test(id) && Number(id) <= 2147483647;
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!valid(id)) return { title: 'Конструктор не найден' };
  const data = await getData<Profile>(`/api/constructors/${id}`);
  return { title: data[0]?.name ?? 'Конструктор не найден' };
}
export default async function ConstructorProfile({ params }: Props) {
  const { id } = await params;
  if (!valid(id)) notFound();
  const [profiles, seasons] = await Promise.all([
    getData<Profile>(`/api/constructors/${id}`),
    getData<Season>(`/api/constructors/${id}/seasons`),
  ]);
  const team = profiles[0];
  if (!team) notFound();
  return <section className="page">
    <p className="eyebrow">ARCHIVE / CONSTRUCTOR · {team.external_id}</p><h1>{team.name}</h1>
    <p className="lead">История результатов конструктора в загруженном архиве F1DB. Очки — сумма очков пилотов, не официальный зачёт Кубка конструкторов.</p>
    <div className="driver-grid" aria-label="Статистика конструктора">
      {([['Сезоны',team.seasons],['Гонки',team.races],['Победы',team.wins],['Подиумы пилотов',team.podium_finishes],['Очки пилотов',team.driver_points]] as const).map(([label,value])=><article className="driver" key={label}><span className="index">{label}</span><h2>{value}</h2></article>)}
    </div>
    <h2>Временная шкала выступлений</h2>
    <p>Каждая отметка — сезон с зафиксированными результатами. Пропуски означают отсутствие результатов в загруженном архиве.</p>
    {seasons.length > 0 && team.first_season !== null && team.last_season !== null && <div className="timeline-scroll" role="region" aria-label="Временная шкала конструктора" tabIndex={0}>
      <div className="timeline-track" style={{ gridTemplateColumns: `repeat(${team.last_season - team.first_season + 1}, minmax(46px,1fr))` }}>
        {Array.from({ length: team.last_season - team.first_season + 1 }, (_, i) => {
          const year = team.first_season! + i;
          const season = seasons.find(s => s.year === year);
          return season
            ? <Link className="timeline-year active" key={year} href={`/seasons/${year}`} title={`${year}: ${season.races} гонок, ${season.wins} побед`}><span>{year}</span><strong>{season.wins} W</strong></Link>
            : <div className="timeline-year inactive" key={year} title={`${year}: нет результатов`}><span>{year}</span><small>—</small></div>;
        })}
      </div>
    </div>}
    <h2>История по сезонам</h2>
    {seasons.length ? <div className="table-scroll"><table><thead><tr><th>Сезон</th><th>Гонки</th><th>Победы</th><th>Подиумы пилотов</th><th>Очки пилотов</th></tr></thead><tbody>
      {seasons.map(s=><tr key={s.year}><td><Link href={`/seasons/${s.year}`}>{s.year}</Link></td><td>{s.races}</td><td>{s.wins}</td><td>{s.podium_finishes}</td><td>{s.driver_points}</td></tr>)}
    </tbody></table></div> : <p>Результаты пока не загружены.</p>}
    <Link className="back" href="/constructors">← Все конструкторы</Link>
  </section>;
}
