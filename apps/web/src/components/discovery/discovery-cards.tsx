import type { DiscoveryItem } from './types';
import styles from './discovery.module.css';

export type DiscoveryCardsProps = Readonly<{
  label: string;
  items: readonly DiscoveryItem[];
  emptyLabel: string;
}>;

export function DiscoveryCards({ label, items, emptyLabel }: DiscoveryCardsProps) {
  return <section className={styles.surface} aria-label={label}>
    {items.length ? <ul className={styles.cards}>
      {items.map(item => <li className={styles.card} key={item.id}>
        <p className={styles.kicker}>{item.kind}</p>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.relationship}>{item.relationship}</p>
        <p className={styles.copy}>{item.summary}</p>
        {item.fact && <dl className={styles.cardFact}><dt>{item.fact.label}</dt><dd>{item.fact.value}</dd></dl>}
        <a className={styles.action} href={item.destination.href}>
          <span>{item.destination.label}</span><span aria-hidden="true">↗</span>
        </a>
      </li>)}
    </ul> : <p className={styles.empty}>{emptyLabel}</p>}
  </section>;
}
