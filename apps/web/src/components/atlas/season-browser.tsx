'use client';
import { useState } from 'react';
import { seasonDecades } from './discovery-model';
import { atlasCopy } from './copy';
import styles from './visuals.module.css';

export function SeasonBrowser({ seasons, locale }: { seasons: { year: number }[]; locale: 'uk' | 'en' }) {
  const t = atlasCopy[locale];
  const decades = seasonDecades(seasons);
  const [selected, setSelected] = useState(decades[0]?.decade);
  const active = decades.find(d => d.decade === selected);
  if (!active) return <p>{t.noSeasons}</p>;
  return <div className={styles.seasonBrowser}>
    <nav aria-label={t.decade} className={styles.decades}>{decades.map(d => <button key={d.decade} type="button"
      aria-pressed={selected === d.decade} onClick={() => setSelected(d.decade)} aria-controls="imported-years">{d.decade}<span aria-hidden="true">{locale === 'uk' ? '-ті' : 's'}</span></button>)}</nav>
    <div id="imported-years" className={styles.yearDisplay}>
      <p aria-live="polite" className={styles.decadeNumber}>{active.decade}<span aria-hidden="true">—</span></p>
      <nav aria-label={t.seasonLabel} className={styles.seasonLinks}>{active.years.map(year => <a key={year} href={`/${locale}/seasons/${year}`}>{year}<span aria-hidden="true">↗</span></a>)}</nav>
    </div>
    <noscript><nav aria-label={t.allSeasons}>{decades.flatMap(d => d.years).map(year => <a className={styles.noScriptYear} key={year} href={`/${locale}/seasons/${year}`}>{year}</a>)}</nav></noscript>
  </div>;
}
