import { EditorialHero, type Statistic } from '../editorial/primitives';
import profile from './story-header.module.css';
import type { ReactNode } from 'react';
import { MotorsportArt, type ArtKind } from './motorsport-art';
import { storyCopy } from './copy';
import type { CircuitArtwork } from '../circuit-layout-registry';
import styles from './stories.module.css';

export function StoryHeader({ title, eyebrow, lead, locale, kind = 'apex', marker, circuitArtwork, statistics, actions, context }: {
  title: string; eyebrow: string; lead: ReactNode; locale: 'uk' | 'en'; kind?: ArtKind; marker?: string | number; circuitArtwork?: CircuitArtwork | null; statistics?: readonly Statistic[]; actions?: ReactNode; context?: ReactNode;
}) {
  if (statistics) return <EditorialHero title={title} eyebrow={eyebrow} lead={lead} context={context} actions={actions} statistics={statistics} testId="story-header"
    media={<figure className={profile.cover}>
      {circuitArtwork ? <>
        {/* Existing pinned outline and attribution; no change to asset eligibility. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={circuitArtwork.path} width={500} height={330} alt={locale === 'uk' ? `Контур історичної конфігурації ${circuitArtwork.layout_id} траси ${title}` : `Historical ${circuitArtwork.layout_id} layout outline of ${title}`} />
        <figcaption>{locale === 'uk' ? 'Контур конфігурації за F1DB; не інженерна карта.' : 'F1DB-sourced layout outline; not an engineering map.'}{' '}
          <a href={circuitArtwork.source_url} target="_blank" rel="noopener noreferrer">{circuitArtwork.author} · {circuitArtwork.layout_id} ↗</a>{' · '}
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">{circuitArtwork.license} ↗</a>
        </figcaption>
      </> : <><MotorsportArt kind="apex" tone="coral" /><figcaption>{storyCopy[locale].circuitArt}</figcaption></>}
    </figure>} />;
  return <header className={styles.entityHeader} data-testid="story-header">
    <div className={styles.entityArt}>{circuitArtwork ? <>
      {/* Locally hosted, pinned F1DB SVG; no remote image request or invented track shape. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.circuitHeroOutline} src={circuitArtwork.path} width={640} height={480}
        alt={locale === 'uk'
          ? `Контур історичної конфігурації ${circuitArtwork.layout_id} траси ${title}`
          : `Historical ${circuitArtwork.layout_id} layout outline of ${title}`} />
    </> : <MotorsportArt kind={kind} tone={kind === 'apex' ? 'mint' : 'coral'} />}
    {marker != null && <span aria-hidden="true">{marker}</span>}</div>
    <div className={styles.entityCopy}><p className={styles.kicker}>{eyebrow}</p><h1>{title}</h1><div className={styles.entityLead}>{lead}</div></div>
    <p className={styles.artCredit}>{circuitArtwork ? <>
      {locale === 'uk' ? 'Контур конфігурації за F1DB; не інженерна карта. ' : 'F1DB-sourced layout outline; not an engineering map. '}
      <a href={circuitArtwork.source_url} target="_blank" rel="noopener noreferrer">
        {circuitArtwork.author} · {circuitArtwork.layout_id} ↗
      </a>{' · '}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">{circuitArtwork.license} ↗</a>
    </> : kind === 'apex' ? storyCopy[locale].circuitArt : storyCopy[locale].artNote}</p>
  </header>;
}
