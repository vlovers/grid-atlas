import type { ReactNode } from 'react';
import { MotorsportArt, type ArtKind } from './motorsport-art';
import { storyCopy } from './copy';
import styles from './stories.module.css';

export function StoryHeader({ title, eyebrow, lead, locale, kind = 'apex', marker }: {
  title: string; eyebrow: string; lead: ReactNode; locale: 'uk' | 'en'; kind?: ArtKind; marker?: string | number;
}) {
  return <header className={styles.entityHeader} data-testid="story-header">
    <div className={styles.entityArt}><MotorsportArt kind={kind} tone={kind === 'apex' ? 'mint' : 'coral'} />{marker != null && <span aria-hidden="true">{marker}</span>}</div>
    <div className={styles.entityCopy}><p className={styles.kicker}>{eyebrow}</p><h1>{title}</h1><div className={styles.entityLead}>{lead}</div></div>
    <p className={styles.artCredit}>{kind === 'apex' ? storyCopy[locale].circuitArt : storyCopy[locale].artNote}</p>
  </header>;
}
