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
    <h2>{t('grandPrixHistory')}</h2>
    {races.length ? <div className="records">{races.map(race => <Link className="record" key={race.id} href={`/races/${race.id}`}>
      <span className="position">{race.season_year}</span><span><strong>{race.official_name}</strong><small>{t('round', { round: race.round })}{race.race_date ? ` · ${race.race_date}` : ''}</small></span><span aria-hidden="true">↗</span>
    </Link>)}</div> : <p>{t('noCircuitRaces')}</p>}
    <nav className="actions" aria-label={t('circuitPages')}>
      {page > 1 && <Link className="secondary" href={pageHref(path, page - 1)}>← {t('previous')}</Link>}
      {offset + PAGE_SIZE < circuit.races && offset + PAGE_SIZE <= MAX_OFFSET && <Link className="secondary" href={pageHref(path, page + 1)}>{t('next')} →</Link>}
    </nav>
    <Link className="back" href="/circuits">← {t('allCircuits')}</Link>
  </section></>;
}
