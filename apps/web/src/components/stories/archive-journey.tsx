import { Link } from '@/i18n/navigation';
import styles from './archive-journey.module.css';

export type ArchiveJourneyItem = {
  id: string;
  href: string;
  overline: string;
  title: string;
  detail?: string;
  year?: number;
};

export function ArchiveJourney({ title, description, items, locale, testId }: {
  title: string;
  description: string;
  items: ArchiveJourneyItem[];
  locale: 'uk' | 'en';
  testId: string;
}) {
  if (!items.length) return null;
  return <section className={styles.section} aria-label={title} data-testid={testId}>
    <header className={styles.heading}>
      <div><span className={styles.eyebrow}>{locale === 'uk' ? 'ІСТОРИЧНИЙ АРХІВ' : 'HISTORICAL ARCHIVE'}</span><h2>{title}</h2></div>
      <p>{description}</p>
    </header>
    <ol className={styles.track}>
      {items.map((item, index) => <li key={item.id} className={styles.stop}>
        <Link className={styles.card} href={item.href}>
          <span className={styles.counter}>{String(index + 1).padStart(2, '0')}</span>
          <span className={styles.year}>{item.year ?? 'F1'}</span>
          <span className={styles.overline}>{item.overline}</span>
          <strong>{item.title}</strong>
          {item.detail && <span className={styles.detail}>{item.detail}</span>}
          <span className={styles.action}>{locale === 'uk' ? 'Дослідити' : 'Explore'} <span aria-hidden="true">↗</span></span>
        </Link>
      </li>)}
    </ol>
  </section>;
}
