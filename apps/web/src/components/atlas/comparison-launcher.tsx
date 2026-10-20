'use client';
import { useState } from 'react';
import { atlasCopy } from './copy';
import styles from './comparison-launcher.module.css';

export function ComparisonLauncher({ id, name, years, locale }: { id: string; name: string; years: number[]; locale: 'uk' | 'en' }) {
  const t = atlasCopy[locale];
  const [from, setFrom] = useState(years[0]);
  const [to, setTo] = useState(years.at(-1)!);
  return <form className={styles.form} action={`/${locale}/time-machine`}>
    <p className={styles.name}>{name}</p><input type="hidden" name="kind" value="driver" /><input type="hidden" name="id" value={id} />
    <div className={styles.years}><label>{t.from}<select name="from" value={from} onChange={event => {
      const year = Number(event.target.value); setFrom(year); if (to <= year) setTo(years.find(y => y > year)!);
    }}>{years.slice(0, -1).map(year => <option key={year}>{year}</option>)}</select></label><span aria-hidden="true">→</span>
      <label>{t.to}<select name="to" value={to} onChange={event => setTo(Number(event.target.value))}>{years.filter(year => year > from).map(year => <option key={year}>{year}</option>)}</select></label></div>
    <p className={styles.note}>{t.comparisonNote}</p><button type="submit">{t.compare} ↗</button>
  </form>;
}
