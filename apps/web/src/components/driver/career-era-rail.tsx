import type { DriverTeam, DriverSeason } from './showcase-model';
import styles from './career-era-rail.module.css';

type Era = { id: string; name: string; years: number[]; races: number; wins: number };
export function CareerEraRail({ teams, seasons, driverId, locale }: { teams: DriverTeam[]; seasons: DriverSeason[]; driverId: string; locale: 'uk' | 'en' }) {
  if (!seasons.length || !teams.length) return null;
  const years = [...new Set(seasons.map(s => s.year))].sort((a, b) => a - b);
  const eras: Era[] = [];
  for (const row of [...teams].sort((a, b) => a.year - b.year || a.constructor_id.localeCompare(b.constructor_id))) {
    const last = [...eras].reverse().find(e => e.id === row.constructor_id && e.years.at(-1) === row.year - 1);
    if (last) { last.years.push(row.year); last.races += row.races; last.wins += row.wins; }
    else eras.push({ id: row.constructor_id, name: row.constructor_name, years: [row.year], races: row.races, wins: row.wins });
  }
  const yearMin = years[0];
  const yearMax = years[years.length - 1];
  return <section className={styles.section} aria-labelledby="driver-era-rail-title" data-testid="driver-era-rail">
    <header><span className={styles.kicker}>{locale === 'uk' ? 'АРХІВ / КАР’ЄРА' : 'ARCHIVE / CAREER'}</span>
      <h2 id="driver-era-rail-title">{locale === 'uk' ? 'Роки та конструктори' : 'Seasons and constructors'}</h2>
      <p>{locale === 'uk' ? 'Лише сезони й конструктори, зафіксовані в результатах. Прогалини не означають відсутність контракту або участі в інших серіях.' : 'Only seasons and constructors recorded in race results. Gaps do not establish contract status or participation elsewhere.'}</p></header>
    <div className={styles.years} aria-label={locale === 'uk' ? 'Зафіксовані сезони' : 'Recorded seasons'}>
      {years.map(year => <a key={year} href={`/${locale}/drivers/${driverId}?season=${year}#driver-career`}>{year}</a>)}
    </div>
    <div className={styles.eras}>
      {eras.map((era, i) => <article key={`${era.id}-${era.years[0]}-${i}`} className={styles.era}>
        <div className={styles.period}><strong>{era.years[0]}{era.years.length > 1 ? `–${era.years.at(-1)}` : ''}</strong><span>{yearMin}–{yearMax}</span></div>
        <div className={styles.bar} aria-hidden="true"><span style={{ marginLeft: `${(era.years[0] - yearMin) / Math.max(1, yearMax - yearMin + 1) * 100}%`, width: `${era.years.length / Math.max(1, yearMax - yearMin + 1) * 100}%` }} /></div>
        <h3><a href={`/${locale}/constructors/${era.id}`}>{era.name} ↗</a></h3>
        <p>{era.races} {locale === 'uk' ? 'зафіксованих гонок' : 'recorded races'} · {era.wins} {locale === 'uk' ? 'перемог у результатах' : 'recorded wins'}</p>
      </article>)}
    </div>
  </section>;
}
