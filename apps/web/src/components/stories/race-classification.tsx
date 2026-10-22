import { Link } from '@/i18n/navigation';
import styles from './race-classification.module.css';

export type ClassificationEntry = {
  id: string;
  position: string;
  driverId: string;
  driver: string;
  constructorId: string;
  constructor: string;
  sharedCar: boolean;
};

export function RaceClassification({ entries, locale }: { entries: ClassificationEntry[]; locale: 'uk' | 'en' }) {
  const podium = entries.filter(entry => ['1', '2', '3'].includes(entry.position));
  if (!podium.length) return null;
  return <section className={styles.section} data-testid="race-classification-visual" aria-labelledby="race-classification-heading">
    <div className={styles.heading}>
      <span className={styles.eyebrow}>{locale === 'uk' ? 'АРХІВНІ РЕЗУЛЬТАТИ' : 'ARCHIVED CLASSIFICATION'}</span>
      <h2 id="race-classification-heading">{locale === 'uk' ? 'Перші три позиції' : 'First three positions'}</h2>
      <p>{locale === 'uk' ? 'Записи позицій 1–3 з імпортованого протоколу. Спільні автомобілі можуть створювати кілька записів на одній позиції.' : 'Position 1–3 entries from imported classification rows. Shared drives may create multiple entries at the same position.'}</p>
    </div>
    <ol className={styles.grid}>{podium.map(entry => <li key={entry.id} className={styles.card}>
      <span className={styles.position}>{entry.position.padStart(2, '0')}</span>
      <div className={styles.identity}><strong><Link href={`/drivers/${entry.driverId}`}>{entry.driver}</Link></strong>
        <span><Link href={`/constructors/${entry.constructorId}`}>{entry.constructor}</Link></span>

      </div>
      <span aria-hidden="true" className={styles.arrow}>↗</span>
    </li>)}</ol>
    <p className={styles.note}>{locale === 'uk' ? 'Це візуалізація записів F1DB, не окремо підтверджений офіційний подіум.' : 'A visualization of F1DB result entries, not an independently verified official podium.'}</p>
  </section>;
}
