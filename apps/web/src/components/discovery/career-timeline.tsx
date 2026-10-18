import type { CareerEntry } from './types';
import { RecordDetail } from './record-detail';
import styles from './discovery.module.css';

export type CareerTimelineProps = Readonly<{
  label: string;
  entries: readonly CareerEntry[];
  emptyLabel: string;
  note?: string;
}>;

/** Renders supplied order only: no invented gap years, team identities or milestones. */
export function CareerTimeline({ label, entries, emptyLabel, note }: CareerTimelineProps) {
  return <section className={styles.surface} aria-label={label}>
    {note && <p className={styles.note}>{note}</p>}
    {entries.length ? <ol className={styles.timeline}>
      {entries.map(entry => <li className={styles.timelineEntry} key={entry.id}>
        <span className={styles.period}>{entry.period}</span>
        <div className={styles.timelineBody}>
          <h3 className={styles.entryTitle}>{entry.title}</h3>
          <p className={styles.copy}>{entry.summary}</p>
          {!!entry.entities?.length && <ul className={styles.entityLinks}>
            {entry.entities.map(entity => <li key={entity.href}><a className={styles.entityLink} href={entity.href}>{entity.label}<span aria-hidden="true"> ↗</span></a></li>)}
          </ul>}
          {entry.destination && <a className={styles.textLink} href={entry.destination.href}>{entry.destination.label}<span aria-hidden="true"> ↗</span></a>}
          {entry.detail && <RecordDetail detail={entry.detail} />}
        </div>
      </li>)}
    </ol> : <p className={styles.empty}>{emptyLabel}</p>}
  </section>;
}
