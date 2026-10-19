import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData } from '@/lib/api';
import { catalogueParams, pageHref, PAGE_SIZE, MAX_OFFSET, validId, type CatalogueParams } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';
type Circuit = { id: string; name: string; external_id: string; races: number; first_season: number | null; last_season: number | null };
type Race = { id: string; season_year: number; round: number; race_date: string | null; official_name: string };
type Props = { params: Promise<{ id: string }>; searchParams: Promise<CatalogueParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!validId(id)) return { title: t('circuitMissing') };
  const [circuit] = await getData<Circuit>(`/api/circuits/${id}`);
  return { title: circuit?.name ?? t('circuitMissing') };
}

export default async function CircuitPage({ params, searchParams }: Props) {
  const t = await getTranslations('UI');
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
    <p className="eyebrow">{t('archive')} / {t('circuit')} · {circuit.external_id}</p><h1>{circuit.name}</h1>
    <p className="lead">{t('circuitCount', { count: circuit.races })} {circuit.first_season !== null && t('seasonRange', { first: circuit.first_season, last: circuit.last_season ?? circuit.first_season })} {t('circuitLayouts')}</p>
    <h2>{t('grandPrixHistory')}</h2>
    {races.length ? <div className="records">{races.map(race => <Link className="record" key={race.id} href={`/races/${race.id}`}>
      <span className="position">{race.season_year}</span><span><strong>{race.official_name}</strong><small>{t('round', { round: race.round })}{race.race_date ? ` · ${race.race_date}` : ''}</small></span><span aria-hidden="true">↗</span>
    </Link>)}</div> : <p>{t('noCircuitRaces')}</p>}
    <nav className="actions" aria-label={t('circuitPages')}>
      {page > 1 && <Link className="secondary" href={pageHref(path, page - 1)}>← {t('previous')}</Link>}
      {offset + PAGE_SIZE < circuit.races && offset + PAGE_SIZE <= MAX_OFFSET && <Link className="secondary" href={pageHref(path, page + 1)}>{t('next')} →</Link>}
    </nav>
    <Link className="back" href="/circuits">← {t('allCircuits')}</Link>
  </section>;
}
