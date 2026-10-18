import type { QuickFact } from './types';
import { RecordDetail } from './record-detail';
import styles from './discovery.module.css';

export type QuickFactsProps = Readonly<{
  label: string;
  facts: readonly QuickFact[];
  unavailableLabel: string;
  emptyLabel: string;
  /** A visible scope/coverage note, supplied by the data owner. */
  note?: string;
}>;

export function QuickFacts({ label, facts, unavailableLabel, emptyLabel, note }: QuickFactsProps) {
  return <section className={styles.surface} aria-label={label}>
    {note && <p className={styles.note}>{note}</p>}
    {facts.length ? <dl className={styles.facts}>
      {facts.map(fact => <div className={styles.fact} key={fact.id}>
        <dt className={styles.label}>{fact.label}</dt>
        <dd className={styles.value}>{fact.value ?? <span className={styles.unavailable}>{unavailableLabel}</span>}</dd>
        {fact.detail && <dd className={styles.factDetail}><RecordDetail detail={fact.detail} /></dd>}
      </div>)}
    </dl> : <p className={styles.empty}>{emptyLabel}</p>}
  </section>;
}
