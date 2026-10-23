import type { CircuitArtwork } from '@/components/circuit-layout-registry';
import styles from './archive.module.css';

/** Reuses the existing API-to-manifest selection and unmodified local SVG lane. */
export function CircuitCover({ circuitArtwork, title, locale }: { circuitArtwork: CircuitArtwork; title: string; locale: 'uk' | 'en' }) {
  return <figure className={styles.circuitCover} data-testid="circuit-cover">
    <p className={styles.label}>{locale === 'uk' ? 'Історична конфігурація' : 'Historical layout'} / {circuitArtwork.layout_id}</p>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={circuitArtwork.path} width={500} height={500} alt={locale === 'uk'
      ? `Контур історичної конфігурації ${circuitArtwork.layout_id} траси ${title}`
      : `Historical ${circuitArtwork.layout_id} layout outline of ${title}`} />
    <figcaption><span>{locale === 'uk' ? 'Ілюстрація однієї конфігурації; вона не описує всі роки історії траси.' : 'An illustration of one layout; it does not represent every year of the circuit’s history.'}</span>
      <a href={circuitArtwork.source_url} target="_blank" rel="noopener noreferrer">{circuitArtwork.author} · {circuitArtwork.layout_id} ↗</a>
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">{circuitArtwork.license} ↗</a>
    </figcaption>
  </figure>;
}
