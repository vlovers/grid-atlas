import type { RelatedJourney } from './types';
import styles from './discovery.module.css';

export type RelatedJourneysProps = Readonly<{
  label: string;
  items: readonly RelatedJourney[];
  emptyLabel: string;
}>;

export function RelatedJourneys({ label, items, emptyLabel }: RelatedJourneysProps) {
  return <nav className={styles.surface} aria-label={label}>
    {items.length ? <ul className={styles.journeys}>
      {items.map(item => <li key={item.id}>
        <a className={styles.journey} href={item.destination.href}>
          <span className={styles.journeyKind}>{item.kind}</span>
          <span className={styles.journeyContent}>
            <strong>{item.destination.label}</strong>
            <span className={styles.relationship}>{item.relationship}</span>
            {item.context && <span className={styles.context}>{item.context}</span>}
          </span>
          <span className={styles.arrow} aria-hidden="true">↗</span>
        </a>
      </li>)}
    </ul> : <p className={styles.empty}>{emptyLabel}</p>}
  </nav>;
}
