import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData } from '@/lib/api';

export const dynamic = 'force-dynamic';
type Profile = { id: string; name: string; external_id: string; starts: number; seasons: number; first_season: number | null; last_season: number | null; wins: number; podiums: number; points: string };
type SeasonSummary = { year: number; starts: number; wins: number; podiums: number; points: string };
type TeamSeason = { year: number; constructor_id: string; constructor_name: string; races: number; wins: number };
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
  const [profiles, seasons, teams] = await Promise.all([
    getData<Profile>(`/api/drivers/${id}`),
    getData<SeasonSummary>(`/api/drivers/${id}/seasons`),
    getData<TeamSeason>(`/api/drivers/${id}/teams`),
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
    <h2>Временная шкала карьеры</h2>
    <p>Годы и команды, за которые пилот имеет зафиксированные результаты. Несколько команд в одном году отображаются отдельно.</p>
    {driver.first_season !== null && driver.last_season !== null && teams.length > 0 &&
      <div className="timeline-scroll" role="region" aria-label="История карьеры по сезонам" tabIndex={0}>
        <div className="career-timeline" style={{ gridTemplateColumns: `repeat(${driver.last_season - driver.first_season + 1}, minmax(140px,1fr))` }}>
          {Array.from({ length: driver.last_season - driver.first_season + 1 }, (_, i) => {
            const year = driver.first_season! + i;
            const entries = teams.filter(t => t.year === year);
            return <section className={entries.length ? 'career-year active' : 'career-year inactive'} key={year}>
              <Link href={`/seasons/${year}`} className="career-year-label">{year} ↗</Link>
              {entries.length ? entries.map(t => <Link key={t.constructor_id} className="career-team" href={`/constructors/${t.constructor_id}`} title={`${t.races} гонок, ${t.wins} побед`}>
                <strong>{t.constructor_name}</strong><small>{t.races} гонок · {t.wins} побед</small>
              </Link>) : <small>Нет результатов</small>}
            </section>;
          })}
        </div>
      </div>}
    <h2>Результаты по сезонам</h2>
    {seasons.length ? <div className="table-scroll"><table><thead><tr><th>Сезон</th><th>Выступления</th><th>Победы</th><th>Подиумы</th><th>Очки</th></tr></thead><tbody>{seasons.map(s =>
      <tr key={s.year}><td><Link href={`/seasons/${s.year}`}>{s.year}</Link></td><td>{s.starts}</td><td>{s.wins}</td><td>{s.podiums}</td><td>{s.points}</td></tr>
    )}</tbody></table></div> : <p>Результаты пока не загружены.</p>}
    <h2>Команды по сезонам</h2>
    <p>Выступления восстановлены по результатам гонок. В одном сезоне у пилота могло быть несколько конструкторов.</p>
    {teams.length ? <div className="table-scroll"><table><thead><tr><th>Сезон</th><th>Конструктор</th><th>Гонки</th><th>Победы</th></tr></thead><tbody>{teams.map(t=>
      <tr key={`${t.year}-${t.constructor_id}`}><td><Link href={`/seasons/${t.year}`}>{t.year}</Link></td><td><Link href={`/constructors/${t.constructor_id}`}>{t.constructor_name} ↗</Link></td><td>{t.races}</td><td>{t.wins}</td></tr>
    )}</tbody></table></div> : <p>История команд пока не загружена.</p>}
    <Link className="back" href="/drivers">← Все пилоты</Link>
  </section>;
}
