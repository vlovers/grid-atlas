import type { Participation } from '@/components/driver/showcase-model';
import styles from './connection-preview.module.css';

export function ConnectionPreview({ id, name, rows, locale }: { id: string; name: string; rows: readonly Participation[]; locale: 'uk' | 'en' }) {
  const positions = [[65, 55], [435, 55], [65, 245], [435, 245]];
  return <figure className={styles.preview}>
    <div className={styles.canvas}>
      <svg viewBox="0 0 500 300" preserveAspectRatio="none" aria-hidden="true">
        {rows.slice(0, 4).map((row, index) => <path key={row.related_id} d={`M250 150Q${positions[index][0]} 150 ${positions[index][0]} ${positions[index][1]}`} />)}
      </svg>
      <a className={styles.focus} href={`/${locale}/drivers/${id}`}>{name}<span>{locale === 'uk' ? 'Пілот' : 'Driver'}</span></a>
      <ul>{rows.slice(0, 4).map(row => <li key={row.related_id}><a href={`/${locale}/explorer/drivers/${id}?year=${row.year}&selected=${row.related_id}`}>
        <strong>{row.related_name}</strong><span>{row.year} <span aria-hidden="true">↗</span></span></a></li>)}</ul>
    </div>
    <figcaption>{locale === 'uk' ? 'Зафіксовані зв’язки з різних сезонів · відкрийте рік для перевірки' : 'Observed associations across seasons · open a year to inspect'}</figcaption>
  </figure>;
}
