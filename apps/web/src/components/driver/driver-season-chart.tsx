import styles from './driver-season-chart.module.css';

type Season = { year: number; starts: number; wins: number; podiums: number };
type Props = { seasons: readonly Season[]; locale: 'uk' | 'en'; driverId: string; selectedYear?: number };

export function DriverSeasonChart({ seasons, locale, driverId, selectedYear }: Props) {
  if (seasons.length === 0) return null;
  const chronological = [...seasons].sort((a, b) => a.year - b.year);
  const maxEntries = Math.max(1, ...chronological.map(s => s.starts));
  const maxWins = Math.max(1, ...chronological.map(s => s.wins));
  const maxPodiums = Math.max(1, ...chronological.map(s => s.podiums));
  const format = new Intl.NumberFormat(locale);
  const t = locale === 'uk'
    ? { heading: 'Ритм кар’єри', subtitle: 'Результати за сезонами — записи в історичному архіві, не офіційна турнірна таблиця.', entries: 'Записи результатів', wins: 'Переможні записи', podiums: 'Подіумні записи', year: 'Сезон', open: 'Переглянути сезон' }
    : { heading: 'The rhythm of a career', subtitle: 'Season-by-season archive result entries, not official championship standings.', entries: 'Result entries', wins: 'Winning entries', podiums: 'Podium entries', year: 'Season', open: 'Explore season' };
  return <section className={styles.section} aria-labelledby="driver-season-chart-title" data-testid="driver-season-chart">
    <div className={styles.intro}><div><span className={styles.eyebrow}>{locale === 'uk' ? 'ДАНІ / КАР’ЄРА' : 'DATA / CAREER'}</span><h3 id="driver-season-chart-title">{t.heading}</h3></div><p>{t.subtitle}</p></div>
    <div className={styles.legend}><span><i className={styles.entriesKey} />{t.entries}</span><span><i className={styles.winsKey} />{t.wins}</span><span><i className={styles.podiumsKey} />{t.podiums}</span></div>
    <div className={styles.scroll} role="region" tabIndex={0} aria-label={t.heading}>
      <ol className={styles.chart} style={{ '--seasons': chronological.length } as React.CSSProperties}>
        {chronological.map(s => <li key={s.year} className={s.year === selectedYear ? styles.selected : undefined}>
          <a href={`/${locale}/drivers/${driverId}?season=${s.year}#driver-career`} title={`${t.open}: ${s.year}`} aria-label={`${s.year}: ${format.format(s.starts)} ${t.entries}, ${format.format(s.wins)} ${t.wins}, ${format.format(s.podiums)} ${t.podiums}`} aria-current={s.year === selectedYear ? 'true' : undefined}>
            <span className={styles.plot} aria-hidden="true"><span className={styles.entriesBar} style={{ height: `${Math.max(3, s.starts / maxEntries * 100)}%` }} /><span className={styles.winsBar} style={{ height: `${s.wins ? Math.max(3, s.wins / maxWins * 100) : 0}%` }} /><span className={styles.podiumsBar} style={{ height: `${s.podiums ? Math.max(3, s.podiums / maxPodiums * 100) : 0}%` }} /></span>
            <strong>{s.year}</strong><small>{format.format(s.wins)} / {format.format(s.starts)}</small>
          </a>
        </li>)}
      </ol>
    </div>
    <p className={styles.footnote}>{locale === 'uk' ? 'Висота стовпчиків нормалізована окремо для кожної з трьох серій. Точні значення доступні у підписах і за допомогою клавіатури.' : 'Bar heights are normalized independently for each of the three series. Exact counts are available in accessible labels.'}</p>
  </section>;
}
