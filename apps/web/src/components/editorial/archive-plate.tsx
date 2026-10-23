import { Link } from '@/i18n/navigation';
import styles from './archive.module.css';

/** A typeset preview of real linked records, never a fabricated historical image. */
export function ArchivePlate({ marker, label, entries, note }: {
  marker: string; label: string; note: string;
  entries: readonly { id: string; href: string; title: string; meta: string }[];
}) {
  return <aside className={styles.plate} aria-label={label} data-testid="archive-plate">
    <p className={styles.label}>{label}</p><p className={styles.marker}>{marker}</p>
    <ol className={styles.plateRecords}>{entries.map(entry => <li key={entry.id}>
      <Link href={entry.href}><span>{entry.meta}</span><strong>{entry.title}</strong><span aria-hidden="true">↗</span></Link>
    </li>)}</ol><p className={styles.note}>{note}</p>
  </aside>;
}
