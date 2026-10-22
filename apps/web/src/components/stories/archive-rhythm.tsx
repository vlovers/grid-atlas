import { Link } from '@/i18n/navigation';
import styles from './archive-rhythm.module.css';

export type ArchiveRhythmEntry = {
  id: string;
  year: number;
  position?: number;
  label: string;
  href: string;
  detail?: string;
};

export function ArchiveRhythm({ entries, locale, title, description, testId, axis = 'year' }: {
  entries: ArchiveRhythmEntry[];
  locale: 'uk' | 'en';
  title: string;
  description: string;
  testId: string;
  axis?: 'year' | 'round';
}) {
  if (!entries.length) return null;
  const years = [...new Set(entries.map(entry => axis === 'round' ? (entry.position ?? entry.year) : entry.year))].sort((a, b) => a - b);
  const first = years[0];
  const last = years[years.length - 1];
  const span = Math.max(1, last - first);
  const buckets = new Map<number, ArchiveRhythmEntry[]>();
  for (const entry of entries) {
    const key = axis === 'round' ? (entry.position ?? entry.year) : entry.year;
    buckets.set(key, [...(buckets.get(key) ?? []), entry]);
  }
  const maxCount = Math.max(1, ...[...buckets.values()].map(items => items.length));
  const hasSingleYear = first === last;
  const distributionLabel = axis === 'round'
    ? (locale === 'uk' ? 'Розподіл записів за раундами' : 'Records by round')
    : (locale === 'uk' ? 'Розподіл записів за роками' : 'Records by year');
  return <section className={styles.section} aria-label={title} data-testid={testId}>
    <div className={styles.header}>
      <div><span className={styles.eyebrow}>{locale === 'uk' ? 'АРХІВ У ЧАСІ' : 'ARCHIVE IN TIME'}</span><h2>{title}</h2></div>
      <p>{description}</p>
    </div>
    <div className={styles.summary} aria-label={locale === 'uk' ? 'Охоплення архіву' : 'Archive coverage'}>
      <span>{axis === 'round' ? (locale === 'uk' ? `Раунд ${first}` : `Round ${first}`) : first}</span><span>{entries.length} {locale === 'uk' ? 'записів' : 'records'}</span><span>{axis === 'round' ? (locale === 'uk' ? `Раунд ${last}` : `Round ${last}`) : last}</span>
    </div>
    <div className={styles.plot} role="list" aria-label={distributionLabel}>
      {years.map(year => {
        const items = buckets.get(year)!;
        return <div key={year} className={styles.point} role="listitem" style={{ left: hasSingleYear ? '50%' : `${((year - first) / span) * 100}%` }}>
          <span className={styles.bar} style={{ height: `${Math.max(12, items.length / maxCount * 100)}%` }} />
          <span className={styles.srOnly}>{axis === 'round' ? (locale === 'uk' ? 'Раунд' : 'Round') : (locale === 'uk' ? 'Рік' : 'Year')} {year}: {items.length}</span>
        </div>;
      })}
    </div>
    <div className={styles.scroll}>
      <ol className={styles.entries}>{entries.map(entry => <li key={entry.id}>
        <Link href={entry.href} className={styles.entry}>
          <span className={styles.year}>{axis === 'round' ? `R${entry.position ?? entry.year}` : entry.year}</span>
          <span className={styles.name}>{entry.label}</span>
          {entry.detail && <small>{entry.detail}</small>}
          <span className={styles.arrow} aria-hidden="true">↗</span>
        </Link>
      </li>)}</ol>
    </div>
    <p className={styles.note}>{locale === 'uk' ? 'Графік показує кількість архівних записів за роками або раундами календаря, а не спортивний рейтинг чи незмінність конфігурації.' : 'The graphic counts archived records by year or calendar round; it does not rank sporting importance or imply an unchanged layout.'}</p>
  </section>;
}
