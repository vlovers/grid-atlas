import type { Participation } from '@/components/driver/showcase-model';
import { atlasCopy } from './copy';
import styles from './career-map.module.css';

/** One cell per observed year; empty cells never imply nonparticipation. */
export function CareerMap({ rows, driverId, locale }: { rows: readonly Participation[]; driverId: string; locale: 'uk' | 'en' }) {
  const years = [...new Set(rows.map(row => row.year))].sort((a, b) => a - b);
  const constructors = [...new Map([...rows].sort((a, b) => a.year - b.year || a.first_race.round - b.first_race.round).map(r => [r.related_id, r.related_name])).entries()];
  if (!years.length) return null;
  return <figure className={styles.map}>
    <figcaption><strong>{atlasCopy[locale].chapter}</strong><span>{locale === 'uk' ? 'Кожен зв’язок веде до записів сезону' : 'Every connection opens its season records'}</span></figcaption>
    <div className={styles.scroll} role="region" aria-label={atlasCopy[locale].observedYears} tabIndex={0}>
      <div className={styles.track} style={{ gridTemplateColumns: `minmax(140px, 1.2fr) repeat(${years.length}, minmax(58px, 1fr))` }}>
        <span className={styles.key}>{locale === 'uk' ? 'Конструктор / рік' : 'Constructor / year'}</span>{years.map(year => <a className={styles.year} href={`/${locale}/drivers/${driverId}?season=${year}#driver-career`} key={year}>{year}</a>)}
        {constructors.map(([id, name], index) => <div className={styles.row} key={id}>
          <a className={styles.name} href={`/${locale}/constructors/${id}`}><span aria-hidden="true">0{index + 1}</span>{name}</a>
          {years.map(year => { const row = rows.find(r => r.related_id === id && r.year === year); return row
            ? <a className={styles.observed} key={year} href={`/${locale}/explorer/drivers/${driverId}?year=${year}&selected=${id}`}
              aria-label={`${name}, ${year}: ${row.races} ${atlasCopy[locale].recordedRaces}`}><span aria-hidden="true">{row.races}</span></a>
            : <span key={year} className={styles.gap} aria-label={locale === 'uk' ? `${name}, ${year}: немає завантажених записів; історія може бути неповною` : `${name}, ${year}: no imported records; history may be incomplete`} />; })}
        </div>)}
      </div>
    </div>
    <p>{locale === 'uk' ? 'Числа — зафіксовані гонки. Прогалини в архіві не доводять відсутності зв’язку. Це не історія контрактів.' : 'Numbers count recorded races. Gaps in the archive do not prove an association never existed. This is not a contract history.'}</p>
  </figure>;
}
