import { careerSignature } from './discovery-model';
import { atlasCopy } from './copy';
import type { DriverSeason } from '@/components/driver/showcase-model';
import styles from './visuals.module.css';

/** Original data drawing, not a portrait, circuit layout or championship chart. */
export function CareerSignature({ seasons, name, locale }: { seasons: readonly DriverSeason[]; name: string; locale: 'uk' | 'en' }) {
  const t = atlasCopy[locale];
  const points = careerSignature(seasons);
  return <figure className={styles.signature} data-testid="career-signature">
    <figcaption><span>{t.signature}</span><strong>{name}</strong><small>{t.signatureNote}</small></figcaption>
    {points.length ? <>
      <svg viewBox="0 0 500 230" role="img" aria-label={`${t.signatureNote}: ${name}`}>
        <title>{`${name} · ${t.signatureNote}`}</title>
        <desc>{points.map(p => `${p.year}: ${p.starts} ${t.entries}, ${p.wins} ${t.wins}`).join('; ')}</desc>
        {[40, 90, 140, 190].map(y => <path key={y} d={`M12 ${y}H488`} className={styles.grid} />)}
        {points.map(p => <g key={p.year}><title>{`${p.year}: ${p.starts} ${t.entries}, ${p.wins} ${t.wins}`}</title><path d={`M${p.x} 190v-${p.entriesHeight}`} className={styles.entries} />
          {p.wins > 0 && <path d={`M${p.x} 190v-${p.winsHeight}`} className={styles.wins} />}<circle cx={p.x} cy={190 - p.entriesHeight} r="3" className={styles.dot} /></g>)}
        <text x="12" y="220">{points[0].year}</text><text x="488" y="220" textAnchor="end">{points.at(-1)!.year}</text>
      </svg>
      <p className={styles.legend}><span>{t.entries}</span><span>{t.wins}</span></p>
    </> : <p className={styles.empty}>{t.noSignature}</p>}
  </figure>;
}
