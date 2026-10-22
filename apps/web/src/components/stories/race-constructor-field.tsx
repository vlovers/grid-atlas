import Link from 'next/link';
import styles from './race-constructor-field.module.css';

type Entry = {
  driverId: string;
  driver: string;
  constructorId: string;
  constructor: string;
  position: string | null;
  sharedCar: boolean;
};

export function RaceConstructorField({ entries, locale }: { entries: Entry[]; locale: 'uk' | 'en' }) {
  if (entries.length === 0) return null;
  const groups = new Map<string, { name: string; entries: Entry[] }>();
  for (const entry of entries) {
    const group = groups.get(entry.constructorId);
    if (group) group.entries.push(entry);
    else groups.set(entry.constructorId, { name: entry.constructor, entries: [entry] });
  }
  const sorted = [...groups].sort((a, b) => b[1].entries.length - a[1].entries.length || a[1].name.localeCompare(b[1].name));
  const maxEntries = Math.max(1, ...sorted.map(([, group]) => group.entries.length));
  return <section className={styles.section} aria-labelledby="race-constructor-field-title" data-testid="race-constructor-field">
    <div className={styles.heading}>
      <p className={styles.kicker}>{locale === 'uk' ? 'АРХІВ / КОНСТРУКТОРИ' : 'ARCHIVE / CONSTRUCTORS'}</p>
      <h2 id="race-constructor-field-title">{locale === 'uk' ? 'Конструктори в результатах' : 'Constructors in the results'}</h2>
      <p>{locale === 'uk'
        ? 'Кількість рядків класифікації за конструктором. Це не кількість стартових автомобілів: спільні автомобілі та історичні записи можуть створювати кілька рядків.'
        : 'Classification entry counts grouped by constructor. These are not starting-car counts: shared drives and historical records can produce multiple rows.'}</p>
    </div>
    <div className={styles.grid}>
      {sorted.map(([id, group]) => <article key={id} className={styles.card}>
        <div className={styles.cardTop}>
          <h3><Link href={`/${locale}/constructors/${id}`}>{group.name} ↗</Link></h3>
          <strong aria-label={locale === 'uk' ? `${group.entries.length} записів` : `${group.entries.length} entries`}>{group.entries.length}</strong>
        </div>
        <div className={styles.meter} aria-hidden="true"><span style={{ width: `${group.entries.length / maxEntries * 100}%` }} /></div>
        <ul>{group.entries.map((entry, index) => <li key={`${entry.driverId}-${index}`}>
          <span className={styles.position}>{entry.position || '—'}</span>
          <Link href={`/${locale}/drivers/${entry.driverId}`}>{entry.driver}</Link>
          {entry.sharedCar && <small>{locale === 'uk' ? 'Спільний автомобіль' : 'Shared car'}</small>}
        </li>)}</ul>
      </article>)}
    </div>
    <p className={styles.caveat}>{locale === 'uk'
      ? `Показано ${entries.length} рядків із завантаженої вибірки (не більше 100). Групування не встановлює офіційний порядок команд або повний склад стартового поля.`
      : `Showing ${entries.length} rows from the loaded sample (maximum 100). Grouping does not establish an official constructor ranking or the complete starting grid.`}</p>
  </section>;
}
