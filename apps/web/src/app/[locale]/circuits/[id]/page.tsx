import { StoryHeader } from '@/components/stories/story-header';
import { storyCopy } from '@/components/stories/copy';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routeMetadata } from '@/lib/seo';
import { entitySeo } from '@/lib/entity-seo';
import SeoBreadcrumbs from '@/components/seo-breadcrumbs';
import { getData } from '@/lib/api';
import { catalogueParams, pageHref, PAGE_SIZE, MAX_OFFSET, validId, type CatalogueParams } from '@/lib/catalogue';

export const dynamic = 'force-dynamic';
type Circuit = { id: string; name: string; external_id: string; races: number; first_season: number | null; last_season: number | null };
type Race = { id: string; season_year: number; round: number; race_date: string | null; official_name: string };
type CircuitHistory = { race_id: string; season_year: number; round: number; race_date: string | null; race_name: string; recorded_drivers: number; recorded_constructors: number; winner_entries: number; winners: { driver_id: string; driver_name: string; constructor_id: string; constructor_name: string }[] };
type Props = { params: Promise<{ id: string; locale: string }>; searchParams: Promise<CatalogueParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const t = await getTranslations('UI');
  const { id, locale } = await params;
  if (!validId(id)) return { title: t('circuitMissing') };
  const [{ title, description }, [circuit]] = await Promise.all([
    entitySeo('circuits', id, locale), getData<Circuit>(`/api/circuits/${id}`),
  ]);
  const { page, offset } = catalogueParams(await searchParams);
  const suffix = page > 1 ? ` · ${locale === 'uk' ? 'Сторінка' : 'Page'} ${page}` : '';
  return { ...routeMetadata(locale, pageHref(`/circuits/${id}`, page), page > 1 && offset >= circuit.races),
    title: `${title}${suffix}`, description: `${description}${suffix}` };
}

export default async function CircuitPage({ params, searchParams }: Props) {
  const t = await getTranslations('UI');
  const { id, locale } = await params;
  if (!validId(id)) notFound();
  const { page, offset } = catalogueParams(await searchParams);
  const [[circuit], races, history] = await Promise.all([
    getData<Circuit>(`/api/circuits/${id}`),
    getData<Race>(`/api/circuits/${id}/races?limit=${PAGE_SIZE}&offset=${offset}`),
    getData<CircuitHistory>(`/api/circuits/${id}/history`),
  ]);
  if (!circuit) notFound();
  const path = `/circuits/${id}`;
  const decades = new Map<number, Race[]>();
  for (const race of races) {
    const decade = Math.floor(race.season_year / 10) * 10;
    decades.set(decade, [...(decades.get(decade) ?? []), race]);
  }
  const { crumbs, description } = await entitySeo('circuits', id, locale);
  const currentCrumbs = crumbs.map((crumb, index) => index === crumbs.length - 1
    ? { ...crumb, path: pageHref(path, page) } : crumb);
  return <><SeoBreadcrumbs locale={locale} crumbs={currentCrumbs} description={description} /><section className="page">
    <StoryHeader title={circuit.name} eyebrow={storyCopy[locale as 'uk' | 'en'].circuitHeader} locale={locale as 'uk' | 'en'} marker={circuit.first_season ?? undefined}
      lead={<p className="lead">{t('circuitCount', { count: circuit.races })} {circuit.first_season !== null && t('seasonRange', { first: circuit.first_season, last: circuit.last_season ?? circuit.first_season })} {t('circuitLayouts')}</p>} />
    <section aria-label={locale === 'uk' ? 'Історичні факти про трасу' : 'Circuit history facts'}>
      <h2>{locale === 'uk' ? 'Паспорт траси' : 'Circuit quick facts'}</h2>
      <div className="driver-grid">
        <article className="driver"><span className="index">{locale === 'uk' ? 'Гран-прі в архіві' : 'Archived Grands Prix'}</span><h3>{circuit.races}</h3></article>
        {circuit.first_season !== null && <article className="driver"><span className="index">{locale === 'uk' ? 'Перше використання у базі' : 'First archived appearance'}</span><h3><Link href={`/seasons/${circuit.first_season}`}>{circuit.first_season}</Link></h3></article>}
        {circuit.last_season !== null && <article className="driver"><span className="index">{locale === 'uk' ? 'Останнє використання у базі' : 'Latest archived appearance'}</span><h3><Link href={`/seasons/${circuit.last_season}`}>{circuit.last_season}</Link></h3></article>}
      </div>
      <p>{locale === 'uk' ? 'Довжина, кількість поворотів, сектори, DRS і рекорди залежать від конфігурації та року. Поки ці дані не підтверджені, ми не показуємо припущень.' : 'Length, corners, sectors, DRS and lap records depend on the layout and event year. Unverified technical figures are deliberately omitted.'}</p>
    </section>
    <section aria-labelledby="circuit-era-journey" data-testid="circuit-era-journey">
      <h2 id="circuit-era-journey">{locale === 'uk' ? 'Подорож крізь історію траси' : 'Explore the circuit across eras'}</h2>
      <p>{locale === 'uk' ? 'Переходьте від першого зафіксованого етапу до останнього та відкривайте протоколи гонок. Послідовність відображає використання ідентифікатора траси в архіві, а не підтверджує однакову конфігурацію.' : 'Follow the circuit from its earliest to its latest archived event, and open each race classification. This is an identity-based history, not evidence that the layout stayed unchanged.'}</p>
      {history.length > 0 && <ol className="records">
        {[history[0], ...(history.length > 2 ? [history[Math.floor((history.length - 1) / 2)]] : []), ...(history.length > 1 ? [history[history.length - 1]] : [])].map((race, index) =>
          <li className="record" key={race.race_id}>
            <span className="position">{String(index + 1).padStart(2, '0')}</span>
            <span><strong><Link href={`/races/${race.race_id}`}>{race.season_year} · {race.race_name}</Link></strong>
              <small>{locale === 'uk' ? 'Пілоти у протоколі' : 'Drivers in classification'}: {race.recorded_drivers} · {locale === 'uk' ? 'Конструктори' : 'Constructors'}: {race.recorded_constructors}</small></span>
            <span aria-hidden="true">↗</span>
          </li>)}
      </ol>}
      <p>{locale === 'uk' ? 'Різні епохи могли використовувати різні схеми, довжину кола та правила. Технічні характеристики не переносяться між роками без окремого підтвердження.' : 'Different eras may have different layouts, lap lengths and rules. Technical attributes must be established for each specific event year.'}</p>
    </section>
    <section aria-label={locale === 'uk' ? 'Історія траси за десятиліттями' : 'Circuit history by decade'}>
      <h2>{locale === 'uk' ? 'Епохи траси' : 'Circuit eras'}</h2>
      <p>{locale === 'uk' ? 'Гран-прі згруповано за десятиліттями за датами в архіві. Кількість переможців — це записи з першою позицією, а не окремо підтверджений офіційний протокол.' : 'Grands Prix are grouped by archived decades. Winners are first-position result entries, not independently verified official classifications.'}</p>
      <div className="driver-grid">{[...new Set(history.map(race => Math.floor(race.season_year / 10) * 10))].sort((a,b) => b-a).map(decade => {
        const events = history.filter(race => Math.floor(race.season_year / 10) * 10 === decade);
        return <article className="driver" key={decade}>
          <span className="index">{decade}–{decade+9}</span>
          <h3>{events.length} {locale === 'uk' ? 'Гран-прі' : 'Grands Prix'}</h3>
          <p>{events.map(race => race.season_year).join(' · ')}</p>
        </article>;
      })}</div>
      <h2>{locale === 'uk' ? 'Переможці та результати' : 'Winners and results'}</h2>
      {history.length ? <div className="table-scroll"><table>
        <thead><tr><th>{locale === 'uk' ? 'Сезон' : 'Season'}</th><th>{locale === 'uk' ? 'Гран-прі' : 'Grand Prix'}</th><th>{locale === 'uk' ? 'Переможні записи' : 'Winning entries'}</th><th>{locale === 'uk' ? 'Пілоти в результатах' : 'Recorded drivers'}</th></tr></thead>
        <tbody>{history.map(race => <tr key={race.race_id}>
          <td><Link href={`/seasons/${race.season_year}`}>{race.season_year}</Link></td>
          <td><Link href={`/races/${race.race_id}`}>{race.race_name}</Link></td>
          <td>{race.winners.length ? race.winners.map(winner => <div key={`${winner.driver_id}:${winner.constructor_id}`}><Link href={`/drivers/${winner.driver_id}`}>{winner.driver_name}</Link> · <Link href={`/constructors/${winner.constructor_id}`}>{winner.constructor_name}</Link></div>) : '—'}</td>
          <td>{race.recorded_drivers}</td>
        </tr>)}</tbody>
      </table></div> : <p>{locale === 'uk' ? 'Немає зафіксованих Гран-прі.' : 'No recorded Grands Prix.'}</p>}
    </section>
    <section aria-labelledby="circuit-archive-overview" data-testid="circuit-archive-overview">
      <h2 id="circuit-archive-overview">{locale === 'uk' ? 'Історія проведених Гран-прі' : 'Recorded Grand Prix history'}</h2>
      <p>{locale === 'uk'
        ? `Архів пов’язує трасу ${circuit.name} із ${circuit.races} гонками${circuit.first_season !== null ? ` починаючи із сезону ${circuit.first_season}` : ''}${circuit.last_season !== null && circuit.last_season !== circuit.first_season ? ` і до ${circuit.last_season} року` : ''}. Нижче наведено офіційні назви та дати імпортованих етапів.`
        : `The historical archive associates ${circuit.name} with ${circuit.races} races${circuit.first_season !== null ? `, beginning in ${circuit.first_season}` : ''}${circuit.last_season !== null && circuit.last_season !== circuit.first_season ? ` and extending through ${circuit.last_season}` : ''}. The imported event names and dates are listed below.`}</p>
      <p>{locale === 'uk' ? 'Запис про трасу не підтверджує незмінність її конфігурації, довжини чи рекордів кола в різні роки. Схеми трас публікуватимуться лише після перевірки історичної конфігурації та прав на зображення.' : 'A circuit identity does not establish that its layout, length or lap records stayed the same across eras. Track maps require separate historical-layout verification and image-rights clearance.'} <Link href="/sources">{locale === 'uk' ? 'Джерела архіву' : 'Archive sources'} ↗</Link></p>
    </section>
    <h2>{t('grandPrixHistory')}</h2>
    {races.length ? <div data-testid="circuit-decade-history">
      <p>{locale === 'uk' ? 'Гран-прі за десятиліттями в межах цієї сторінки архіву. Кожен запис веде до конкретної гонки; рік — до сезону.' : 'Grand Prix by decade within this archive page. Each result links to its race; the year links to its season.'}</p>
      {[...decades].map(([decade, events]) => <section key={decade} aria-label={`${decade}s`}>
        <h3>{decade}–{decade + 9}</h3>
        <div className="records">{events.map(race => <div className="record" key={race.id}>
          <span className="position"><Link href={`/seasons/${race.season_year}`}>{race.season_year}</Link></span>
          <span><strong><Link href={`/races/${race.id}`}>{race.official_name} ↗</Link></strong>
            <small>{t('round', { round: race.round })}{race.race_date ? ` · ${race.race_date}` : ''}</small></span>
        </div>)}</div>
      </section>)}
    </div> : <p>{t('noCircuitRaces')}</p>}
    <nav className="actions" aria-label={t('circuitPages')}>
      {page > 1 && <Link className="secondary" href={pageHref(path, page - 1)}>← {t('previous')}</Link>}
      {offset + PAGE_SIZE < circuit.races && offset + PAGE_SIZE <= MAX_OFFSET && <Link className="secondary" href={pageHref(path, page + 1)}>{t('next')} →</Link>}
    </nav>
    <Link className="back" href="/circuits">← {t('allCircuits')}</Link>
  </section></>;
}
