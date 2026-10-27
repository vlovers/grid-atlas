import styles from './driver-season-chart.module.css';

type Season = { year: number; starts: number; wins: number; podiums: number };
type Props = { seasons: readonly Season[]; locale: 'uk' | 'en'; driverId: string; selectedYear?: number };

export function DriverSeasonChart({ seasons, locale, driverId, selectedYear }: Props) {
  if (seasons.length === 0) return null;
  const chronological = [...seasons].sort((a, b) => a.year - b.year);
  const maximum = Math.max(1, ...chronological.flatMap(s => [s.starts, s.wins, s.podiums]));
  const format = new Intl.NumberFormat(locale);
  const t = locale === 'uk'
    ? { heading: 'Ритм кар’єри', subtitle: 'Як змінювалися результати протягом кар’єри.', entries: 'Результати гонок', wins: 'Результати на першому місці', podiums: 'Результати в першій трійці', year: 'Сезон', open: 'Переглянути сезон' }
    : { heading: 'The rhythm of a career', subtitle: 'Follow the results across a career.', entries: 'Race results', wins: 'First-place results', podiums: 'Top-three results', year: 'Season', open: 'Explore season' };
  return <section className={styles.section} aria-labelledby="driver-season-chart-title" data-testid="driver-season-chart" data-story-reveal>
    <div className={styles.intro}><div><span className={styles.eyebrow}>{locale === 'uk' ? 'ДАНІ / КАР’ЄРА' : 'DATA / CAREER'}</span><h3 id="driver-season-chart-title">{t.heading}</h3></div><p>{t.subtitle}</p></div>
    <p className={styles.footnote}>{locale === 'uk' ? 'Спільна шкала: 0–' : 'Shared scale: 0–'}{maximum}</p>
    <div className={styles.legend}><span><i className={styles.entriesKey} />{t.entries}</span><span><i className={styles.winsKey} />{t.wins}</span><span><i className={styles.podiumsKey} />{t.podiums}</span></div>
    <div className={styles.scroll} role="region" tabIndex={0} aria-label={t.heading}>
      <ol className={styles.chart} style={{ '--seasons': chronological.length } as React.CSSProperties}>
        {chronological.map(s => <li key={s.year} className={s.year === selectedYear ? styles.selected : undefined}>
          <a href={`/${locale}/drivers/${driverId}?season=${s.year}#driver-career`} title={`${t.open}: ${s.year}`} aria-label={`${s.year}: ${format.format(s.starts)} ${t.entries}, ${format.format(s.wins)} ${t.wins}, ${format.format(s.podiums)} ${t.podiums}`} aria-current={s.year === selectedYear ? 'true' : undefined}>
            <span className={styles.plot} aria-hidden="true"><span className={styles.entriesBar} style={{ height: `${s.starts / maximum * 100}%` }} /><span className={styles.winsBar} style={{ height: `${s.wins ? s.wins / maximum * 100 : 0}%` }} /><span className={styles.podiumsBar} style={{ height: `${s.podiums ? s.podiums / maximum * 100 : 0}%` }} /></span>
            <strong>{s.year}</strong><small>{format.format(s.wins)} / {format.format(s.starts)}</small>
          </a>
        </li>)}
      </ol>
    </div>
    <p className={styles.footnote}>{locale === 'uk' ? 'Одна шкала для всіх трьох рядів. Це кількість результатів, а не офіційних стартів. Точні числа — у таблиці нижче.' : 'All three series share one scale. Counts describe result entries, not official starts. Exact numbers are in the table below.'}</p>
    <details className={styles.values}><summary>{locale === 'uk' ? 'Точні результати за сезонами' : 'Exact results by season'}</summary>
      <div className={styles.scroll} role="region" tabIndex={0} aria-label={t.heading}>
        <table><caption>{t.heading}</caption><thead><tr><th scope="col">{t.year}</th><th scope="col">{t.entries}</th><th scope="col">{t.wins}</th><th scope="col">{t.podiums}</th></tr></thead>
          <tbody>{chronological.map(s => <tr key={s.year}><th scope="row"><a href={`/${locale}/drivers/${driverId}?season=${s.year}#driver-career`}>{s.year}</a></th><td>{format.format(s.starts)}</td><td>{format.format(s.wins)}</td><td>{format.format(s.podiums)}</td></tr>)}</tbody>
        </table>
      </div>
    </details>
  </section>;
}
