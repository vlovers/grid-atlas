import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData, type RaceProfile, type Result } from '@/lib/api';
import { validId } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!validId(id)) return { title: 'Гонка не найдена' };
  const [race] = await getData<RaceProfile>(`/api/races/${id}`);
  return { title: race ? `${race.season_year} · ${race.official_name}` : 'Гонка не найдена' };
}

export default async function RacePage({ params }: Props) {
  const { id } = await params;
  if (!validId(id)) notFound();
  const [[race], results] = await Promise.all([
    getData<RaceProfile>(`/api/races/${id}`),
    getData<Result>(`/api/races/${id}/results?limit=100`),
  ]);
  if (!race) notFound();
  return <section className="page">
    <p className="eyebrow">ARCHIVE / GRAND PRIX · {race.season_year} · ЭТАП {race.round}</p><h1>{race.official_name}</h1>
    <p className="lead">{race.race_date ?? 'Дата не указана'} · {race.circuit_id ? <Link href={`/circuits/${race.circuit_id}`}>{race.circuit_name} ↗</Link> : 'Трасса не указана'}</p>
    <h2>Результаты гонки</h2>
    <p>Порядок и очки по данным F1DB. Статусы сходов и общие автомобили сохранены; эти результаты не являются итоговой таблицей чемпионата.</p>
    <p className="mobile-hint">Таблицу можно прокручивать по горизонтали.</p>
    {results.length ? <div className="table-scroll" role="region" aria-label="Результаты гонки" tabIndex={0}><table><thead><tr><th scope="col">Поз.</th><th scope="col">Пилот</th><th scope="col">Конструктор</th><th scope="col">Круги</th><th scope="col">Очки</th></tr></thead><tbody>{results.map(result => <tr key={result.position_display_order}>
      <td>{result.position_text}</td><td><Link href={`/drivers/${result.driver_id}`}>{result.driver} ↗</Link>{result.shared_car && <small className="result-note">Общий автомобиль</small>}{result.reason_retired && <small className="result-note">{result.reason_retired}</small>}</td>
      <td><Link href={`/constructors/${result.constructor_id}`}>{result.constructor} ↗</Link></td><td>{result.laps ?? '—'}</td><td>{result.points ?? '—'}</td>
    </tr>)}</tbody></table></div> : <p>Результаты пока не загружены.</p>}
    <Link className="back" href={`/seasons/${race.season_year}`}>← Сезон {race.season_year}</Link>
  </section>;
}
