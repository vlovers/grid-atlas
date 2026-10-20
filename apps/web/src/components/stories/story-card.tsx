import { MotorsportArt, type ArtKind } from './motorsport-art';
import styles from './stories.module.css';

export function StoryCard({ href, title, eyebrow, year, action, kind = 'velocity', tone = 'coral', detail }: {
  href: string; title: string; eyebrow: string; year?: number | string; action: string; kind?: ArtKind;
  tone?: 'coral' | 'mint' | 'violet' | 'gold'; detail?: string;
}) {
  return <article className={`${styles.storyCard} ${styles[tone]}`} data-story-reveal>
    <a href={href}><div className={styles.cardArt}><MotorsportArt kind={kind} tone={tone} />
      {year != null && <span className={styles.posterYear}>{year}</span>}<span className={styles.corner} aria-hidden="true">↗</span></div>
      <div className={styles.cardBody}><p className={styles.kicker}>{eyebrow}</p><h3>{title}</h3>{detail && <p className={styles.cardDetail}>{detail}</p>}<span className={styles.cardAction}>{action} <span aria-hidden="true">↗</span></span></div>
    </a>
  </article>;
}
