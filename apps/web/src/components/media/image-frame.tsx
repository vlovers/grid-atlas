'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './media.module.css';

export type ImageFrameProps = {
  source: string | null; width: number; height: number; alt: string;
  label: string; unavailable: string; failed: string;
};

/** Keep the exact same reserved frame when the file is absent or fails to load. */
export function ImageFrame({ source, width, height, alt, label, unavailable, failed }: ImageFrameProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const visible = source !== null && source !== failedSource;
  const message = source ? failed : unavailable;
  return <div className={styles.frame} style={{ aspectRatio: `${width} / ${height}` }}>
    {visible ? <Image src={source} width={width} height={height} alt={alt} unoptimized
      loading="lazy" decoding="async" referrerPolicy="no-referrer" className={styles.image}
      onError={() => setFailedSource(source)} /> : <div className={styles.fallback} role="img" aria-label={`${label}: ${message}`}>
      <div className={styles.marker} aria-hidden="true"><span /> <span /> <span /></div>
      <span className={styles.kicker}>{message}</span>
      <strong>{label}</strong>
    </div>}
  </div>;
}
