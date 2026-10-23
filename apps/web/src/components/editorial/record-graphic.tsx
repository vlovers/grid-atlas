import styles from './record-graphic.module.css';

/** Every mark is an existing API count; series share one scale and missing years stay empty. */
export function RecordGraphic({ rows, label, winsLabel, locale }: {
  rows: readonly { year: number; records: number; wins: number }[];
  label: string; winsLabel: string; locale: 'en' | 'uk';
}) {
  const sorted = [...rows].sort((a, b) => a.year - b.year);
  if (!sorted.length) return <p className={styles.empty}>{locale === 'uk' ? 'Зафіксованих сезонів немає.' : 'No recorded seasons.'}</p>;
  const plural = new Intl.PluralRules(locale).select(sorted.length);
  const seasonWord = locale === 'uk' ? (plural === 'one' ? 'сезон' : plural === 'few' ? 'сезони' : 'сезонів') : (plural === 'one' ? 'season' : 'seasons');
  const first = sorted[0].year;
  const last = sorted[sorted.length - 1].year;
  const max = Math.max(1, ...sorted.map(row => row.records), ...sorted.map(row => row.wins));
  const x = (year: number) => last === first ? 250 : 16 + (year - first) / (last - first) * 468;
  const width = Math.min(22, 350 / (last - first + 1));
  return <div className={styles.graphic} data-testid="profile-record-graphic">
    <p className={styles.label}>{locale === 'uk' ? 'ЗАФІКСОВАНІ СЕЗОНИ' : 'SEASONS IN THE RECORD'}</p>
    <div className={styles.range}><strong>{first}</strong><span>{sorted.length} {seasonWord}</span><strong>{last}</strong></div>
    <svg viewBox="0 0 500 180" role="img" aria-label={label}>
      <title>{label}</title>
      <desc>{sorted.map(row => `${row.year}: ${row.records} ${label}, ${row.wins} ${winsLabel}`).join('; ')}</desc>
      {[10, 60, 110, 160].map(y => <path key={y} className={styles.grid} d={`M8 ${y}H492`} />)}
      {sorted.map(row => <g key={row.year}>
        <rect className={styles.records} x={x(row.year) - width / 2} y={160 - row.records / max * 150} width={width} height={row.records / max * 150} />
        <rect className={styles.wins} x={x(row.year) - width / 2} y={160 - row.wins / max * 150} width={width} height={row.wins / max * 150} />
      </g>)}
    </svg>
    <p className={styles.legend}><span>{label}</span><span>{winsLabel}</span></p>
    <p className={styles.note}>{locale === 'uk' ? 'Одна шкала для обох рядів. Точні значення — у таблицях сезону.' : 'One scale for both series. Exact counts are available in the season tables.'}</p>
  </div>;
}
