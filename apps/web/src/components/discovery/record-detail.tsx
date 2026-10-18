import type { Disclosure } from './types';
import styles from './discovery.module.css';

/** Native disclosure keeps explanations keyboard accessible without client JS. */
export function RecordDetail({ detail }: Readonly<{ detail: Disclosure }>) {
  return <details className={styles.detail}>
    <summary>{detail.label}</summary>
    <div className={styles.detailBody}>
      <p>{detail.text}</p>
      {detail.source && <a className={styles.textLink} href={detail.source.href}>{detail.source.label}</a>}
    </div>
  </details>;
}
