import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getData, type Race } from '@/lib/api';

type Lineup = { constructor_id: string; constructor_name: string; driver_id: string; driver_name: string; races: number; wins: number };
export const dynamic = 'force-dynamic';

export default async function SeasonPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  if (!/^(19[5-9][0-9]|20[0-9]{2}|21[0-9]{2})$/.test(year)) notFound();
  const [races, lineups] = await Promise.all([
    getData<Race>(`/api/seasons/${year}/races?limit=100`),
    getData<Lineup>(`/api/seasons/${year}/lineups`),
  ]);
  const teams = new Map<string, { id: string; name: string; drivers: Lineup[] }>();
  for (const row of lineups) {
    if (!teams.has(row.constructor_id)) teams.set(row.constructor_id, { id: row.constructor_id, name: row.constructor_name, drivers: [] });
    teams.get(row.constructor_id)!.drivers.push(row);
  }
  return <section className="page">
    <p className="eyebrow">ARCHIVE / SEASON</p><h1>Сезон {year}</h1>
    <p className="lead">Календарь Гран-при, результаты и связи пилотов с конструкторами.</p>
    <h2>Гран-при</h2>
    {races.length === 0 ? <p>Гонки для сезона пока не найдены.</p> : <div className="records">{races.map(r=>
      <Link key={r.id} className="record" href={`/races/${r.id}`}><span className="position">{String(r.round).padStart(2,'0')}</span><span><strong>{r.official_name}</strong><small>{r.circuit_name || 'Трасса не указана'}{r.race_date ? ' · '+r.race_date : ''}</small></span><span aria-hidden="true">↗</span></Link>
    )}</div>}
    <h2>Пилоты и конструкторы</h2>
    <p>Связи восстановлены по результатам гонок, а не по контрактам. Один пилот может выступать за несколько команд в сезоне.</p>
    {teams.size ? <div className="lineup-grid">{Array.from(teams.values()).map(team=>
      <article className="lineup-team" key={team.id}>
        <h3><Link href={`/constructors/${team.id}`}>{team.name} ↗</Link></h3>
        <ul>{team.drivers.map(driver=><li key={driver.driver_id}>
          <Link href={`/drivers/${driver.driver_id}`}>{driver.driver_name}</Link>
          <span>{driver.races} гонок · {driver.wins} побед</span>
        </li>)}</ul>
      </article>
    )}</div> : <p>Составы команд пока не загружены.</p>}
    <Link className="back" href="/seasons">← Все сезоны</Link>
  </section>;
}
