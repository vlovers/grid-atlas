import type { ReactNode } from 'react';
import { LicensedMedia } from '@/components/media/licensed-media';
import { selectMediaCollection, type MediaAsset, type MediaSubject } from '@/components/media/registry';
import { editorialCopy } from './copy';
import styles from './editorial.module.css';

export type EditorialLocale = 'uk' | 'en';
export type Statistic = { label: string; value: ReactNode };

export function SectionHeading({ kicker, title, note, id }: { kicker: string; title: string; note?: string; id: string }) {
  return <header className={styles.sectionHeading} data-story-reveal><div><p className={styles.kicker}>{kicker}</p><h2 id={id} tabIndex={-1}>{title}</h2></div>{note && <p>{note}</p>}</header>;
}

export function StatisticStrip({ stats, className = '', scope }: { stats: readonly Statistic[]; className?: string; scope?: string }) {
  return <><dl className={`${styles.statistics} ${className}`} data-testid="statistic-strip">{stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>{scope && <p className={styles.scope}>{scope}</p>}</>;
}

export function EditorialTabs({ label, items }: { label: string; items: readonly { id: string; label: string }[] }) {
  return <nav data-testid="profile-section-nav" className={styles.tabs} aria-label={label}>{items.map((item, i) => <a key={item.id} href={`#${item.id}`}><span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{item.label}</a>)}</nav>;
}

/** The published-media registry remains the sole eligibility gate. */
export function EditorialMedia({ assets, subject, title, locale, years, children }: {
  assets: readonly MediaAsset[]; subject: MediaSubject; title: string; locale: EditorialLocale;
  years?: string; children?: ReactNode;
}) {
  const asset = selectMediaCollection(assets,subject)[0];
  const t = editorialCopy[locale];
  if (asset) return <div className={styles.media} data-editorial-media="approved"><LicensedMedia assets={assets} assetId={asset.id} subject={subject} label={title} locale={locale} presentation="hero" /></div>;
  return <figure className={`${styles.plate} ${children ? styles.recordPlate : ''}`} data-editorial-media="archive-composition">
    <div className={styles.plateRule} aria-hidden="true" />
    {!children && <span className={styles.plateWord} aria-hidden="true">{subject.id.replaceAll('-', ' ')}</span>}
    {children ? children : <div className={styles.plateContent}><span className={styles.plateIndex}>{t.edition} / {subject.id}</span>
      <p className={styles.plateName}>{title}</p>{years && <span className={styles.plateYears}>{years}</span>}
    </div>}
    <figcaption><span>{t.plate}</span>{t.plateNote}</figcaption>
  </figure>;
}

export function EditorialHero({ title, eyebrow, context, lead, media, actions, statistics, scope, className = '', testId = 'editorial-hero' }: {
  title: string; eyebrow: string; context?: ReactNode; lead: ReactNode; media: ReactNode;
  actions?: ReactNode; statistics?: readonly Statistic[]; scope?: string; className?: string; testId?: string;
}) {
  return <header className={`${styles.hero} ${className}`} data-testid={testId}>
    <div className={styles.heroCopy}><p className={styles.kicker}>{eyebrow}</p><h1>{title}</h1>
      {context && <div className={styles.heroContext}>{context}</div>}
      <div className={styles.heroLead}>{lead}</div>{actions && <div className={styles.actions}>{actions}</div>}</div>
    {statistics && <StatisticStrip stats={statistics} scope={scope} />}
    <div className={styles.heroMedia}>{media}</div>
  </header>;
}

export function SourceAttribution({ locale, children }: { locale: EditorialLocale; children?: ReactNode }) {
  return <aside className={styles.sourceAttribution}><span>{children ?? 'GRID ATLAS / F1DB'}</span><a href={`/${locale}/sources`}>{editorialCopy[locale].source} ↗</a></aside>;
}

export function EmptyMediaState({ title, note, locale }: { title?: string; note?: string; locale: EditorialLocale }) {
  const t = editorialCopy[locale];
  return <aside className={styles.emptyMedia} data-testid="editorial-empty-media"><span aria-hidden="true">[ — ]</span><div><h3>{title ?? t.mediaTitle}</h3><p>{note ?? t.mediaNote}</p></div></aside>;
}

/** Native progressive disclosure for complete records; all content remains server rendered. */
export function ArchiveDisclosure({ label, count, children, id, open }: { label: string; count?: ReactNode; children: ReactNode; id?: string; open?: boolean }) {
  return <details id={id} className={styles.archiveDisclosure} open={open}><summary><span>{label}</span>{count !== undefined && <span className={styles.disclosureCount}>{count}</span>}</summary><div>{children}</div></details>;
}
