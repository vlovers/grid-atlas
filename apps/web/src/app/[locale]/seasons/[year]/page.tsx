import { StoryHeader } from '@/components/stories/story-header';
import { storyCopy } from '@/components/stories/copy';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { getData, type Race } from '@/lib/api';

type Lineup = { constructor_id: string; constructor_name: string; driver_id: string; driver_name: string; races: number; wins: number };
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const t = await getTranslations('UI');
  const { year } = await params;
  return { title: t('seasonTitle', { year }) };
}

export default async function SeasonPage({ params }: { params: Promise<{ year: string }> }) {
  const t = await getTranslations('UI');
  const { year } = await params;
  if (!/^[0-9]{4}$/.test(year) || Number(year) < 1950 || Number(year) > 2200) notFound();
  await getData<{ year: number }>(`/api/seasons/${year}`);
  const [races, lineups] = await Promise.all([
    getData<Race>(`/api/seasons/${year}/races?limit=100`),
    getData<Lineup>(`/api/seasons/${year}/lineups`),
  ]);
  const locale = await getLocale() as 'uk' | 'en';
  const teams = new Map<string, { id: string; name: string; drivers: Lineup[] }>();
  for (const row of lineups) {
    if (!teams.has(row.constructor_id)) teams.set(row.constructor_id, { id: row.constructor_id, name: row.constructor_name, drivers: [] });
    teams.get(row.constructor_id)!.drivers.push(row);
  }
  return <section className="page">
    <StoryHeader title={t('seasonTitle', { year })} eyebrow={storyCopy[locale].seasonHeader} locale={locale} kind="grid" marker={year} lead={t('seasonLead')} />
    <section aria-labelledby="season-journey" data-testid="season-journey">
      <h2 id="season-journey">{locale === 'uk' ? 'Сезон у трьох етапах' : 'Season in three moments'}</h2>
      <p>{locale === 'uk' ? 'Від початку календаря через середину до фінального зафіксованого етапу. Це точки навігації по архіву, а не редакційний вибір найважливіших подій.' : 'From the opening race through the middle of the calendar to the last recorded round. These are archive navigation points, not editorial claims about the most important moments.'}</p>
      {races.length ? <ol className="records">
        {[races[0], ...(races.length > 2 ? [races[Math.floor((races.length - 1) / 2)]] : []), ...(races.length > 1 ? [races[races.length - 1]] : [])].map((entry, index) =>
          <li className="record" key={entry.id}><span className="position">{String(index + 1).padStart(2, '0')}</span>
            <span><strong><Link href={`/races/${entry.id}`}>{entry.official_name} ↗</Link></strong>
            <small>{locale === 'uk' ? 'Раунд' : 'Round'} {entry.round} · {entry.circuit_name ?? t('unknownCircuit')}</small></span>
          </li>)}
      </ol> : <p>{t('noRaces')}</p>}
      <p>{locale === 'uk' ? 'Результати окремих гонок не дорівнюють офіційним підсумкам чемпіонату через історичні системи нарахування та відкидання очок.' : 'Individual race points cannot be treated as official championship totals because historical scoring and dropped-results rules varied.'}</p>
    </section>
    <h2>{t('grandsPrix')}</h2>
    {races.length === 0 ? <p>{t('noRaces')}</p> : <div className="records">{races.map(r=>
      <Link key={r.id} className="record" href={`/races/${r.id}`}><span className="position">{String(r.round).padStart(2,'0')}</span><span><strong>{r.official_name}</strong><small>{r.circuit_name || t('unknownCircuit')}{r.race_date ? ' · '+r.race_date : ''}</small></span><span aria-hidden="true">↗</span></Link>
    )}</div>}
    <h2>{t('lineups')}</h2>
    <p>{t('lineupsLead')}</p>
    {teams.size ? <div className="lineup-grid">{Array.from(teams.values()).map(team=>
      <article className="lineup-team" key={team.id}>
        <h3><Link href={`/constructors/${team.id}`}>{team.name} ↗</Link></h3>
        <ul>{team.drivers.map(driver=><li key={driver.driver_id}>
          <Link href={`/drivers/${driver.driver_id}`}>{driver.driver_name}</Link>
          <span>{t('raceWins', { races: driver.races, wins: driver.wins })}</span>
        </li>)}</ul>
      </article>
    )}</div> : <p>{t('noLineups')}</p>}
    <Link className="back" href="/seasons">← {t('allSeasons')}</Link>
  </section>;
}
