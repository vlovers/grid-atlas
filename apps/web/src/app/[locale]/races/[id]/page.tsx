import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getData, type RaceProfile, type Result } from '@/lib/api';
import { validId } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!validId(id)) return { title: t('raceMissing') };
  const [race] = await getData<RaceProfile>(`/api/races/${id}`);
  return { title: race ? `${race.season_year} · ${race.official_name}` : t('raceMissing') };
}

export default async function RacePage({ params }: Props) {
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!validId(id)) notFound();
  const [[race], results] = await Promise.all([
    getData<RaceProfile>(`/api/races/${id}`),
    getData<Result>(`/api/races/${id}/results?limit=100`),
  ]);
  if (!race) notFound();
  return <section className="page">
    <p className="eyebrow">{t('archive')} / {t('grandsPrix')} · {race.season_year} · {t('round', { round: race.round })}</p><h1>{race.official_name}</h1>
    <p className="lead">{race.race_date ?? t('unknownDate')} · {race.circuit_id ? <Link href={`/circuits/${race.circuit_id}`}>{race.circuit_name} ↗</Link> : t('unknownCircuit')}</p>
    <h2>{t('raceResults')}</h2>
    <p>{t('raceResultsLead')}</p>
    <p className="mobile-hint">{t('scrollTable')}</p>
    {results.length ? <div className="table-scroll" role="region" aria-label={t('raceResults')} tabIndex={0}><table><thead><tr><th scope="col">{t('position')}</th><th scope="col">{t('driver')}</th><th scope="col">{t('constructor')}</th><th scope="col">{t('laps')}</th><th scope="col">{t('points')}</th></tr></thead><tbody>{results.map(result => <tr key={result.position_display_order}>
      <td>{result.position_text}</td><td><Link href={`/drivers/${result.driver_id}`}>{result.driver} ↗</Link>{result.shared_car && <small className="result-note">{t('sharedCar')}</small>}{result.reason_retired && <small className="result-note">{result.reason_retired}</small>}</td>
      <td><Link href={`/constructors/${result.constructor_id}`}>{result.constructor} ↗</Link></td><td>{result.laps ?? '—'}</td><td>{result.points ?? '—'}</td>
    </tr>)}</tbody></table></div> : <p>{t('noResults')}</p>}
    <Link className="back" href={`/seasons/${race.season_year}`}>← {t('seasonTitle', { year: race.season_year })}</Link>
  </section>;
}
