import Link from 'next/link';
import styles from './archive-highlights.module.css';

export type ArchiveHighlight = {
  id: string;
  eyebrow: string;
  title: string;
  detail: string;
  href?: string;
};
type Props = { locale: 'en' | 'uk'; title: string; description: string; items: ArchiveHighlight[] };
/** Visual, source-derived editorial cards. All content comes from archive API records. */
export function ArchiveHighlights({ locale, title, description, items }: Props) {
  if (!items.length) return null;
  return <section className={styles.section} aria-label={title} data-testid="archive-highlights">
    <header className={styles.heading}><p className={styles.kicker}>{locale === 'uk' ? 'АРХІВ / ГОЛОВНЕ' : 'ARCHIVE / HIGHLIGHTS'}</p><h2>{title}</h2><p>{description}</p></header>
    <div className={styles.grid}>{items.map(item => <article key={item.id} className={styles.card}>
      <span className={styles.eyebrow}>{item.eyebrow}</span>
      <h3>{item.href ? <Link href={item.href}>{item.title} <span aria-hidden="true">↗</span></Link> : item.title}</h3>
      <p>{item.detail}</p>
    </article>)}</div>
  </section>;
}
