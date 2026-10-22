import { archiveDistribution, archivePointPosition } from '@/lib/archive-distribution';
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
  const { keys: years, counts, first, last, maxCount } = archiveDistribution(entries, axis);
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
      {years.map((year, index) => {
        const count = counts[index];
        return <div key={year} className={styles.point} role="listitem" style={{ left: `${archivePointPosition(year, first, last)}%` }}>
          <span className={styles.bar} style={{ height: `${Math.max(12, count / maxCount * 100)}%` }} />
          <span className={styles.srOnly}>{axis === 'round' ? (locale === 'uk' ? 'Раунд' : 'Round') : (locale === 'uk' ? 'Рік' : 'Year')} {year}: {count}</span>
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
