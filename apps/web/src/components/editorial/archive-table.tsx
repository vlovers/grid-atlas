import type { ReactNode } from 'react';
import styles from './archive-table.module.css';

export function ArchiveTable({ label, locale, children }: { label: string; locale: 'en' | 'uk'; children: ReactNode }) {
  return <div className={styles.wrap} data-testid="archive-table">
    <p className={styles.hint}>{locale === 'uk' ? 'За потреби прокрутіть таблицю горизонтально. Клавіатура: Tab, потім ← →.' : 'Scroll horizontally when needed. Keyboard: Tab, then ← →.'}</p>
    <div className={styles.scroll} role="region" aria-label={label} tabIndex={0}>{children}</div>
  </div>;
}
