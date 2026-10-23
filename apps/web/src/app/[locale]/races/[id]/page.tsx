import { RaceClassification } from '@/components/stories/race-classification';
import { RaceConstructorField } from '@/components/stories/race-constructor-field';
import { ArchiveJourney } from '@/components/stories/archive-journey';
import { StoryHeader } from '@/components/stories/story-header';
import { storyCopy } from '@/components/stories/copy';
import { getLocale, getTranslations } from 'next-intl/server';
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
  const locale = await getLocale() as 'uk' | 'en';
  const t = await getTranslations('UI');
  const { id } = await params;
  if (!validId(id)) notFound();
  const [[race], results] = await Promise.all([
    getData<RaceProfile>(`/api/races/${id}`),
    getData<Result>(`/api/races/${id}/results?limit=100`),
  ]);
  if (!race) notFound();
  const podium = results.filter(r => ['1', '2', '3'].includes(r.position_text));
  const sharedCount = results.filter(r => r.shared_car).length;
  const retirements = results.filter(r => Boolean(r.reason_retired)).length;
  return <section className="page">
    <StoryHeader title={race.official_name} eyebrow={`${storyCopy[locale].raceHeader} / ${race.season_year} · ${t('round', { round: race.round })}`} locale={locale} kind="grid" marker={race.season_year}
      lead={<p className="lead">{race.race_date ?? t('unknownDate')} · {race.circuit_id ? <Link href={`/circuits/${race.circuit_id}`}>{race.circuit_name} ↗</Link> : t('unknownCircuit')}</p>} />
    <ArchiveJourney testId="race-visual-journey" locale={locale} title={locale === 'uk' ? 'Шлях за межі гонки' : 'Beyond this Grand Prix'} description={locale === 'uk' ? 'Перейдіть від конкретного результату до сезону, траси та записів пілотів.' : 'Follow this race into its season, venue and recorded driver histories.'} items={[{ id: 'season', href: `/seasons/${race.season_year}`, year: race.season_year, overline: locale === 'uk' ? 'Чемпіонат' : 'Championship', title: `${race.season_year}` }, ...(race.circuit_id ? [{ id: 'circuit', href: `/circuits/${race.circuit_id}`, year: race.season_year, overline: locale === 'uk' ? 'Траса' : 'Circuit', title: race.circuit_name ?? race.circuit_id }] : []), ...results.filter(result => result.position_text === '1').slice(0, 1).map(result => ({ id: `driver-${result.driver_id}`, href: `/drivers/${result.driver_id}`, year: race.season_year, overline: locale === 'uk' ? 'Перша позиція у протоколі' : 'First-position result entry', title: result.driver, detail: result.constructor }))]} />
    <RaceClassification locale={locale} entries={results.map(result => ({ id: String(result.position_display_order), position: result.position_text, driverId: result.driver_id, driver: result.driver, constructorId: result.constructor_id, constructor: result.constructor, sharedCar: Boolean(result.shared_car) }))} />
    <RaceConstructorField locale={locale} entries={results.map(result => ({ driverId: result.driver_id, driver: result.driver, constructorId: result.constructor_id, constructor: result.constructor, position: result.position_text, sharedCar: Boolean(result.shared_car) }))} />
    <section aria-label={locale === 'uk' ? 'Паспорт Гран-прі' : 'Grand Prix quick facts'}>
      <h2>{locale === 'uk' ? 'Гран-прі в цифрах' : 'Grand Prix at a glance'}</h2>
      <div className="driver-grid">
        <article className="driver"><span className="index">{locale === 'uk' ? 'Сезон' : 'Season'}</span><h3><Link href={`/seasons/${race.season_year}`}>{race.season_year}</Link></h3></article>
        <article className="driver"><span className="index">{locale === 'uk' ? 'Раунд' : 'Round'}</span><h3>{race.round}</h3></article>
        <article className="driver"><span className="index">{locale === 'uk' ? 'Показані записи результатів' : 'Displayed result entries'}</span><h3>{results.length}</h3></article>
        {race.circuit_id && race.circuit_name && <article className="driver"><span className="index">{locale === 'uk' ? 'Траса' : 'Circuit'}</span><h3><Link href={`/circuits/${race.circuit_id}`}>{race.circuit_name}</Link></h3></article>}
      </div>
      <p>{locale === 'uk' ? 'Таблиця показує не більше 100 записів, а не обов’язково повний склад учасників. Кількість записів не завжди дорівнює кількості унікальних пілотів або стартових автомобілів: історичні гонки включали спільні автомобілі. Дані практик, кваліфікації, погоди та шин не виводяться без окремих підтверджених джерел.' : 'The table shows up to 100 result entries, not necessarily the full field. Entries do not necessarily equal unique drivers or starting cars: historical races included shared drives. Practice, qualifying, weather and tyre data require separate verified sources.'}</p>
    </section>
    <section aria-labelledby="race-evidence-journey" data-testid="race-evidence-journey">
      <h2 id="race-evidence-journey">{locale === 'uk' ? 'Дослідіть цей Гран-прі' : 'Explore this Grand Prix'}</h2>
      <p>{locale === 'uk' ? 'Від конкретного етапу — до його сезону, траси й учасників. Усі зв’язки нижче походять з імпортованих результатів.' : 'Follow this event into its season, circuit and recorded participants. Every link below comes from the imported historical records.'}</p>
      <div className="driver-grid">
        <article className="driver"><span className="index">{locale === 'uk' ? 'Контекст сезону' : 'Season context'}</span>
          <h3><Link href={`/seasons/${race.season_year}`}>{race.season_year} ↗</Link></h3></article>
        {race.circuit_id && <article className="driver"><span className="index">{locale === 'uk' ? 'Історія траси' : 'Circuit history'}</span>
          <h3><Link href={`/circuits/${race.circuit_id}`}>{race.circuit_name ?? race.circuit_id} ↗</Link></h3></article>}
        <article className="driver"><span className="index">{locale === 'uk' ? 'Пілоти в результатах' : 'Drivers in results'}</span>
          <h3>{new Set(results.map(result => result.driver_id)).size}</h3></article>
        <article className="driver"><span className="index">{locale === 'uk' ? 'Конструктори в результатах' : 'Constructors in results'}</span>
          <h3>{new Set(results.map(result => result.constructor_id)).size}</h3></article>
      </div>
      {results.length > 0 && <p>{locale === 'uk' ? 'Перший запис у таблиці:' : 'First displayed classification entry:'}{' '}
        <Link href={`/drivers/${results[0].driver_id}`}>{results[0].driver}</Link>{' · '}
        <Link href={`/constructors/${results[0].constructor_id}`}>{results[0].constructor}</Link>.
        {locale === 'uk' ? ' Порядок записів не є самостійним підтвердженням офіційного переможця.' : ' Row order alone is not independent proof of the official winner.'}
      </p>}
      <p>{locale === 'uk' ? 'Показано не більше 100 записів результатів. Унікальні пілоти та конструктори обчислені тільки для показаних записів, а не всього заявочного списку.' : 'Up to 100 result entries are displayed. Unique driver and constructor counts describe only these entries, not the complete entry list.'}</p>
    </section>
    <section aria-labelledby="race-results-story" data-testid="race-results-story">
      <h2 id="race-results-story">{locale === 'uk' ? 'Історія гонки за класифікацією' : 'Race story in the classification'}</h2>
      <p>{locale === 'uk'
        ? `Серед ${results.length} показаних записів: ${podium.length} результатів із позиціями 1–3, ${sharedCount} записів про спільний автомобіль і ${retirements} записів із зазначеною причиною вибуття.`
        : `Among ${results.length} displayed entries: ${podium.length} results in positions 1–3, ${sharedCount} shared-car entries and ${retirements} entries with retirement reasons.`}</p>
      {podium.length > 0 && <ol className="records">{podium.map(result =>
        <li key={result.position_display_order} className="record">
          <span className="position">{result.position_text}</span>
          <span><strong><Link href={`/drivers/${result.driver_id}`}>{result.driver}</Link></strong>
            <small><Link href={`/constructors/${result.constructor_id}`}>{result.constructor}</Link></small></span>
        </li>)}</ol>}
      <p>{locale === 'uk'
        ? 'Ці відомості походять із показаних рядків бази, а не з незалежно перевіреного офіційного протоколу. Вони не відтворюють перебіг гонки.'
        : 'These facts come from displayed archive rows, not an independently checked official classification. They do not reconstruct events during the race.'}</p>
    </section>
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
