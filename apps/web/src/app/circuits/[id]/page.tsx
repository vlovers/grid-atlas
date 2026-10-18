import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData } from '@/lib/api';
import { catalogueParams, pageHref, PAGE_SIZE, MAX_OFFSET, validId, type CatalogueParams } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';
type Circuit = { id: string; name: string; external_id: string; races: number; first_season: number | null; last_season: number | null };
type Race = { id: string; season_year: number; round: number; race_date: string | null; official_name: string };
type Props = { params: Promise<{ id: string }>; searchParams: Promise<CatalogueParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!validId(id)) return { title: 'Трасса не найдена' };
  const [circuit] = await getData<Circuit>(`/api/circuits/${id}`);
  return { title: circuit?.name ?? 'Трасса не найдена' };
}

export default async function CircuitPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!validId(id)) notFound();
  const { page, offset } = catalogueParams(await searchParams);
  const [[circuit], races] = await Promise.all([
    getData<Circuit>(`/api/circuits/${id}`),
    getData<Race>(`/api/circuits/${id}/races?limit=${PAGE_SIZE}&offset=${offset}`),
  ]);
  if (!circuit) notFound();
  const path = `/circuits/${id}`;
  return <section className="page">
    <p className="eyebrow">ARCHIVE / CIRCUIT · {circuit.external_id}</p><h1>{circuit.name}</h1>
    <p className="lead">Гран-при в загруженном архиве: {circuit.races}.{circuit.first_season !== null && ` Сезоны ${circuit.first_season} — ${circuit.last_season}.`} Разные конфигурации трассы здесь объединены под идентификатором F1DB.</p>
    <h2>История Гран-при</h2>
    {races.length ? <div className="records">{races.map(race => <Link className="record" key={race.id} href={`/races/${race.id}`}>
      <span className="position">{race.season_year}</span><span><strong>{race.official_name}</strong><small>Этап {race.round}{race.race_date ? ` · ${race.race_date}` : ''}</small></span><span aria-hidden="true">↗</span>
    </Link>)}</div> : <p>Гонки на этой странице пока не найдены.</p>}
    <nav className="actions" aria-label="Страницы истории трассы">
      {page > 1 && <Link className="secondary" href={pageHref(path, page - 1)}>← Предыдущая</Link>}
      {offset + PAGE_SIZE < circuit.races && offset + PAGE_SIZE <= MAX_OFFSET && <Link className="secondary" href={pageHref(path, page + 1)}>Следующая →</Link>}
    </nav>
    <Link className="back" href="/circuits">← Все трассы</Link>
  </section>;
}
