'use client';

import { useId, useRef, useState } from 'react';
import type { MediaAsset } from './registry';
import { ImageFrame } from './image-frame';
import { MediaCaption } from './media-caption';
import styles from './gallery.module.css';

/** Receives only the server-selected, currently approved collection. No candidate lookup. */
export function MediaGallery({ assets, locale, label }: { assets: readonly MediaAsset[]; locale: 'uk' | 'en'; label: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const uk = locale === 'uk';
  const current = index === null ? null : assets[index];
  const move = (step: number) => setIndex(value => ((value ?? 0) + step + assets.length) % assets.length);
  const frame = (asset: MediaAsset, eager = false) => <ImageFrame source={asset.delivery.local_path} width={asset.image.width!} height={asset.image.height!}
    alt={asset.alt[locale]!} label={label} unavailable={uk ? 'Немає зображення' : 'Image unavailable'} failed={uk ? 'Зображення тимчасово недоступне' : 'Image temporarily unavailable'} eager={eager} />;
  return <>
    <div className={styles.gallery}>{assets.map((asset, i) => <figure key={asset.id} className={styles.card}>
      {frame(asset)}
      <button type="button" className={styles.enlarge} aria-haspopup="dialog" onClick={() => { setIndex(i); dialog.current?.showModal(); }}>
        <span aria-hidden="true">↗</span> {uk ? 'Переглянути зображення' : 'View image'} <span className={styles.srOnly}>{i + 1}: {asset.alt[locale]}</span>
      </button>
      <MediaCaption asset={asset} locale={locale} />
    </figure>)}</div>
    <dialog ref={dialog} onClose={() => setIndex(null)} className={styles.viewer} aria-labelledby={titleId} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}
      onKeyDown={event => {
        if (event.key === 'Tab') {
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, a[href], summary')).filter(element => element.getClientRects().length > 0);
          const active = controls.indexOf(document.activeElement as HTMLElement);
          if (controls.length) { event.preventDefault(); controls[(active + (event.shiftKey ? -1 : 1) + controls.length) % controls.length].focus(); }
        }
        if (assets.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
      }}>
      <div className={styles.viewerBody}>
        <header className={styles.toolbar}><h4 id={titleId}>{uk ? 'Фотоархів' : 'Image archive'} · {label}</h4><button type="button" autoFocus onClick={() => dialog.current?.close()}>{uk ? 'Закрити' : 'Close'} ×</button></header>
        {current && <><p className={styles.counter} aria-live="polite" aria-atomic="true">{(index ?? 0) + 1} / {assets.length} · {current.alt[locale]}</p>
          <figure key={current.id} className={styles.fullImage}>
            {frame(current)}<MediaCaption asset={current} locale={locale} />
          </figure></>}
        {assets.length > 1 && <nav className={styles.navigation} aria-label={uk ? 'Навігація зображеннями' : 'Image navigation'}>
          <button type="button" onClick={() => move(-1)}>← {uk ? 'Попереднє' : 'Previous'}</button><button type="button" onClick={() => move(1)}>{uk ? 'Наступне' : 'Next'} →</button>
        </nav>}
      </div>
    </dialog>
  </>;
}
