import type { MediaAsset, MediaSubject } from './registry';
import { selectMedia } from './registry';
import { ImageFrame } from './image-frame';
import { MediaCaption } from './media-caption';
import styles from './media.module.css';

const copy = {
  en: { unavailable: 'Media awaiting review', detail: 'An image will appear after identity, source and reuse rights are checked.',
    layout: 'Historical layout unconfirmed', layoutDetail: 'No approved diagram matches this exact race. A current layout is not substituted.',
    source: 'Original source', file: 'File record', changes: 'Changes', rights: 'Reuse conditions', failed: 'Image temporarily unavailable' },
  uk: { unavailable: 'Медіа очікує на перевірку', detail: 'Зображення з’явиться після перевірки особи чи об’єкта, джерела та прав на використання.',
    layout: 'Історичну конфігурацію не підтверджено', layoutDetail: 'Немає схваленої схеми саме для цієї гонки. Поточна конфігурація її не замінює.',
    source: 'Першоджерело', file: 'Сторінка файлу', changes: 'Зміни', rights: 'Умови використання', failed: 'Зображення тимчасово недоступне' },
};

export type LicensedMediaProps = {
  assets: readonly MediaAsset[]; assetId?: string; subject: MediaSubject; label: string;
  locale: 'uk' | 'en'; raceId?: string; diagram?: boolean; approvedRemoteOrigins?: readonly string[]; asOf?: string; presentation?: 'hero' | 'archive';
};

/** Server-side rights gate. Candidate manifests are never imported by this module. */
export function LicensedMedia({ assets, assetId, subject, label, locale, raceId, diagram = false,
  approvedRemoteOrigins = [], asOf, presentation = 'archive' }: LicensedMediaProps) {
  const candidate = selectMedia(assets, assetId, subject, raceId, approvedRemoteOrigins, asOf);
  const asset = candidate && (!diagram || candidate.kind === 'circuit-diagram') ? candidate : null;
  const t = copy[locale];
  return <figure className={`${styles.media} ${presentation === 'hero' ? styles.hero : ''}`}>
    <ImageFrame source={asset ? asset.delivery.local_path ?? asset.delivery.remote_url : null}
      width={asset?.image.width ?? (diagram ? 500 : 3)} height={asset?.image.height ?? (diagram ? 500 : 4)}
      alt={asset?.alt[locale] ?? ''} label={label} unavailable={diagram ? t.layout : t.unavailable}
      failed={t.failed} eager={presentation === 'hero'} />
    {!asset && <figcaption className={styles.caption}>{diagram ? t.layoutDetail : t.detail}</figcaption>}
    {asset && <MediaCaption asset={asset} locale={locale} />}
  </figure>;
}

export function CircuitDiagram(props: Omit<LicensedMediaProps, 'subject' | 'diagram'> & { circuitId: string }) {
  const { circuitId, ...rest } = props;
  return <LicensedMedia {...rest} subject={{ type: 'circuit', id: circuitId }} diagram />;
}
