import Image from 'next/image';
import type { RaceMoment } from '@/components/driver/showcase-model';
import type { CircuitArtwork } from '@/components/circuit-layout-registry';
import styles from './race-cover.module.css';

/** A race-specific editorial composition. Geometry must match this exact event. */
export function RaceCover({ moment, driverName, locale, artwork, firstWin }: {
  moment: RaceMoment; driverName: string; locale: 'uk' | 'en'; artwork?: CircuitArtwork; firstWin: boolean;
}) {
  const uk = locale === 'uk';
  const race = moment.race;
  return <figure className={styles.cover} data-testid="home-race-cover">
    <p className={styles.eyebrow}>{firstWin ? (uk ? 'ПЕРША ПЕРЕМОГА' : 'THE FIRST WIN') : (uk ? 'ПОЧАТОК КАР’ЄРИ В РЕЗУЛЬТАТАХ' : 'A CAREER’S FIRST RESULT')}</p>
    <div className={styles.scene}>
      <span className={styles.year}>{race.year}</span>
      {artwork && <Image unoptimized src={artwork.path} width={500} height={500} alt={uk ? `Конфігурація ${artwork.layout_id} на Гран-прі ${race.year} року` : `${artwork.layout_id} layout at the ${race.year} Grand Prix`} />}
    </div>
    <figcaption><span className={styles.name}>{driverName}</span><h2><a href={`/${locale}/races/${race.id}`}>{race.name} ↗</a></h2>
      <p>{race.date ?? (uk ? `Етап ${race.round}` : `Round ${race.round}`)}</p>
      <div className={styles.finish}><span>{uk ? 'Результат' : 'Result'}</span><strong>{moment.results.map(row => row.position_text).join(' / ') || '—'}</strong><a href={`/${locale}/drivers/${moment.results[0]?.driver_id ?? ''}`}>{uk ? 'Історія кар’єри' : 'Career history'} ↗</a></div>
    </figcaption>
    <details className={styles.credit}><summary>{uk ? 'Джерела та ілюстрація' : 'Sources & illustration'}</summary><p>F1DB · <a href={`/${locale}/sources`}>{uk ? 'Дані гонки' : 'Race data'}</a>{artwork && <> · <a href={artwork.source_url}>{artwork.author}</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · {artwork.layout_id} · {uk ? 'Ілюстрація конфігурації; не масштабна карта.' : 'Layout illustration; not a scale map.'}</>}</p></details>
  </figure>;
}
