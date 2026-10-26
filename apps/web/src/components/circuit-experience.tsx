'use client';

import { EditorialSelect } from './editorial/select';
import { useMemo, useState } from 'react';
import Link from 'next/link';

import { CIRCUIT_ARTWORK } from './circuit-layout-registry';
import styles from './circuit-experience.module.css';

type Layout = {
  id: string; external_layout_id: string; effective: boolean;
  length_km: string; turns: number; linked_races: number;
  first_recorded_year: number | null; last_recorded_year: number | null;
  source_locator: string; release_tag: string; content_hash: string;
};
type Event = {
  race_id: string; season_year: number; round: number; race_name: string;
  layout_id: string | null; external_layout_id: string | null;
  course_length_km: string; turns: number; laps: number;
  distance_km: string; scheduled_laps: number; scheduled_distance_km: string;
  direction: string | null; source_locator: string; release_tag: string;
  content_hash: string;
};
export type { Layout as CircuitLayout, Event as CircuitTechnicalEvent };

const labels = {
  uk: {
    kicker: 'КОНФІГУРАЦІЇ / ІСТОРІЯ', title: 'Як змінювалася траса',
    lead: 'Порівняйте конфігурації різних років. Оберіть сезон, щоб побачити трасу того Гран-прі.',
    select: 'Історична конфігурація', all: 'Усі конфігурації',
    effective: 'Позначена джерелом як актуальна', length: 'Довжина кола',
    turns: 'Повороти', events: 'Пов’язані Гран-прі', first: 'Перше зафіксоване використання',
    latest: 'Останнє зафіксоване використання', year: 'Сезон', distance: 'Дистанція гонки',
    grandPrix: 'Гран-прі', license: 'Ліцензія', laps: 'Кола', direction: 'Напрямок руху', source: 'Джерело і межі',
    noEvents: 'Для цієї конфігурації немає пов’язаних гонок в архіві.',
    measurements: 'Параметри гонок', showAll: 'Показати всі записи',
    note: 'Кожен рядок містить дані конкретного Гран-прі. Довжина й кількість поворотів можуть відрізнятися в інші роки.',
    notMap: 'Роки проведення Гран-прі, не географічна карта траси',
    graphic: 'Контур історичної конфігурації',
    illustration: 'Контур конфігурації за матеріалами F1DB, не масштабна інженерна карта',
    credit: 'Автор контурів: Jules Roy · CC BY 4.0',
    selectForMap: 'Оберіть конфігурацію, щоб побачити контур',
    noGraphic: 'Перевірений контур для цієї конфігурації недоступний.',
    yearBrowse: 'Досліджуйте за сезоном', yearHint: 'Оберіть рік, щоб переглянути конфігурацію, використану в архівних перегонах.',
    yearSelected: 'Вибраний сезон', noLayoutForYear: 'Для цього сезону немає пов’язаної конфігурації.',
    compare: 'Порівняння конфігурацій', compareHint: 'Порівняння лише параметрів, зафіксованих у F1DB для кожної конфігурації; це не оцінка швидкості чи складності.',
    yearLayouts: 'Конфігурації цього сезону', yearLayoutHint: 'Оберіть конфігурацію, якщо в одному сезоні зафіксовано декілька.',
    exploreTimeline: 'Хронологія Гран-прі', timelineHint: 'Оберіть зафіксований сезон, щоб переглянути конфігурацію та пов’язані перегони.',
    compareYear: 'Зафіксовані роки', compareMissing: 'Немає достатньо даних для порівняння.',
    previous: 'Попередній сезон', next: 'Наступний сезон', seasonEvents: 'Параметри гонки', clearYear: 'Показати всі роки',
  },
  en: {
    kicker: 'LAYOUTS / HISTORY', title: 'How the circuit changed',
    lead: 'Compare layouts across the years. Choose a season to see the configuration of its Grand Prix.',
    select: 'Historical layout', all: 'All layouts',
    effective: 'Marked current by the source', length: 'Lap length',
    turns: 'Corners', events: 'Linked Grands Prix', first: 'First recorded use',
    latest: 'Latest recorded use', year: 'Season', distance: 'Race distance',
    grandPrix: 'Grand Prix', license: 'License', laps: 'Laps', direction: 'Direction', source: 'Source and limits',
    noEvents: 'No linked Grand Prix is recorded for this layout.',
    measurements: 'Race measurements', showAll: 'Show all records',
    note: 'Every row is specific to one event. Length and corner counts are not assumed valid for other years.',
    notMap: 'Years with Grands Prix, not a geographic track map',
    graphic: 'Historical layout outline',
    illustration: 'F1DB-sourced layout outline, not an engineering scale map',
    credit: 'Outline artwork: Jules Roy · CC BY 4.0',
    selectForMap: 'Choose a layout to view its outline',
    noGraphic: 'No verified outline available for this layout.',
    yearBrowse: 'Explore by season', yearHint: 'Choose a year to see the layout recorded for its Grands Prix.',
    yearSelected: 'Selected season', noLayoutForYear: 'No linked layout is recorded for this season.',
    compare: 'Layout comparison', compareHint: 'Compare only measurements recorded by F1DB for each layout. This is not a speed or difficulty ranking.',
    yearLayouts: 'Layouts in this season', yearLayoutHint: 'Choose a layout when multiple are recorded for one season.',
    exploreTimeline: 'Grand Prix timeline', timelineHint: 'Choose a recorded season to inspect its layout and linked races.',
    compareYear: 'Recorded years', compareMissing: 'Not enough layout data to compare.',
    previous: 'Previous season', next: 'Next season', seasonEvents: 'Race measurements', clearYear: 'Show all years',
  },
} as const;

export function CircuitExperience({ layouts, events, locale }: {
  layouts: Layout[]; events: Event[]; locale: 'uk' | 'en';
}) {
  const t = labels[locale];
  const [selected, setSelected] = useState(layouts.find(l => l.effective)?.id ?? layouts[0]?.id ?? '');
  const [showAll, setShowAll] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const recordedYears = useMemo(() => [...new Set(events.filter(e => e.layout_id && layouts.some(l => l.id === e.layout_id)).map(e => e.season_year))].sort((a,b) => a-b), [events, layouts]);
  const selectYear = (year: number) => {
    const event = events.find(e => e.season_year === year && e.layout_id && layouts.some(l => l.id === e.layout_id));
    if (!event?.layout_id) return;
    setSelectedYear(year); setSelected(event.layout_id); setShowAll(false);
  };
  const yearIndex = selectedYear === null ? -1 : recordedYears.indexOf(selectedYear);
  const yearLayouts = selectedYear === null ? [] : layouts.filter(layout => events.some(event => event.season_year === selectedYear && event.layout_id === layout.id));
  const current = layouts.find(l => l.id === selected);
  const artwork = current ? CIRCUIT_ARTWORK.get(current.external_layout_id) : undefined;
  const matching = useMemo(() => events.filter(e => (!selected || e.layout_id === selected) && (selectedYear === null || e.season_year === selectedYear)), [events, selected, selectedYear]);
  const visible = showAll ? matching : matching.slice(0, 12);
  return <section className={styles.shell} aria-labelledby="circuit-experience-title" data-testid="circuit-experience">
    <p className={styles.kicker}>{t.kicker}</p>
    <h2 id="circuit-experience-title">{t.title}</h2>
    <p className={styles.lead}>{t.lead}</p>
    {recordedYears.length > 0 && <div className={styles.yearExplorer} data-testid="circuit-year-explorer">
      <div className={styles.yearExplorerHeading}><div><strong>{t.yearBrowse}</strong><p>{t.yearHint}</p></div><span aria-live="polite">{selectedYear === null ? '' : `${t.yearSelected}: ${selectedYear}`}</span></div>
      <div className={styles.yearExplorerControls}>
        <button type="button" disabled={yearIndex <= 0} onClick={() => selectYear(recordedYears[yearIndex-1])} aria-label={t.previous}>‹</button>
        <label className={styles.yearPickerLabel}>{t.year}<EditorialSelect data-testid="circuit-year-select" value={selectedYear ?? ''} onValueChange={value => { if (value) selectYear(Number(value)); }}>
          <option value="">—</option>
          {recordedYears.map(year => <option key={year} value={year}>{year}</option>)}
        </EditorialSelect></label>
        <button type="button" disabled={yearIndex < 0 || yearIndex >= recordedYears.length-1} onClick={() => selectYear(recordedYears[yearIndex+1])} aria-label={t.next}>›</button>
        {selectedYear !== null && <button type="button" className={styles.clearYear} onClick={() => { setSelectedYear(null); setShowAll(false); }}>{t.clearYear}</button>}
      </div>
    </div>}
    {yearLayouts.length > 1 && <fieldset className={styles.yearLayouts} data-testid="circuit-year-layouts">
      <legend>{t.yearLayouts}</legend><p>{t.yearLayoutHint}</p>
      <div>{yearLayouts.map(layout => <label key={layout.id}>
        <input type="radio" name="circuit-year-layout" value={layout.id} checked={selected === layout.id}
          onChange={() => { setSelected(layout.id); setShowAll(false); }} />
        <span>{layout.external_layout_id}</span>
      </label>)}</div>
    </fieldset>}
    <figure className={styles.trackVisual} data-testid="circuit-track-visual">
      <div className={styles.trackGlow} aria-hidden="true" />
      {artwork ? <>
        {/* Licensed local SVG is served directly; Next image transformation is unnecessary. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={artwork.layout_id} className={styles.trackOutline}
          src={artwork.path} width={500} height={500} loading="lazy"
          alt={`${t.graphic}: ${current?.external_layout_id}`} />
        <figcaption className={styles.trackCredit}>
          <span>{t.illustration}</span>
          <a href={artwork.source_url} target="_blank" rel="noopener noreferrer">{t.credit} ↗</a>
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">{t.license} ↗</a>
        </figcaption>
      </> : <p className={styles.trackFallback}>
        {current ? t.noGraphic : t.selectForMap}
      </p>}
    </figure>
    <div className={styles.layout}>
      <div className={styles.selector}>
        <label htmlFor="circuit-layout-select">{t.select}</label>
        <EditorialSelect id="circuit-layout-select" data-testid="circuit-layout-select" value={selected}
          onValueChange={value => { setSelected(value); setSelectedYear(null); setShowAll(false); }}>
          <option value="">{t.all}</option>
          {layouts.map(l => <option key={l.id} value={l.id}>{l.external_layout_id} · {l.length_km} km</option>)}
        </EditorialSelect>
      </div>
      {current && <div className={styles.measurements} data-testid="circuit-layout-facts">
        <div><span>{t.length}</span><strong>{current.length_km} km</strong></div>
        <div><span>{t.turns}</span><strong>{current.turns}</strong></div>
        <div><span>{t.events}</span><strong>{current.linked_races}</strong></div>
        <div><span>{t.first}</span><strong>{current.first_recorded_year ?? '—'}</strong></div>
        <div><span>{t.latest}</span><strong>{current.last_recorded_year ?? '—'}</strong></div>
        {current.effective && <p className={styles.effective}>{t.effective}</p>}
      </div>}
    </div>
    {layouts.length > 1 && <details className={styles.compare} data-testid="circuit-layout-comparison">
      <summary><h3 id="circuit-layout-comparison-title">{t.compare} <small>· {layouts.length}</small></h3></summary>
      <p>{t.compareHint}</p>
      <div className={styles.compareScroll} role="region" aria-label={t.compare} tabIndex={0}>
        <table className={styles.compareTable}>
          <thead><tr><th scope="col">{t.select}</th><th scope="col">{t.length}</th><th scope="col">{t.turns}</th><th scope="col">{t.events}</th><th scope="col">{t.compareYear}</th></tr></thead>
          <tbody>{layouts.map(layout => <tr key={layout.id} className={selected === layout.id ? styles.selectedLayout : undefined}>
            <th scope="row"><button type="button" aria-pressed={selected === layout.id} onClick={() => { setSelected(layout.id); setSelectedYear(null); setShowAll(false); }}>{layout.external_layout_id}</button></th>
            <td>{layout.length_km} km</td><td>{layout.turns}</td><td>{layout.linked_races}</td>
            <td>{layout.first_recorded_year ?? '—'} – {layout.last_recorded_year ?? '—'}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </details>}
    <details className={styles.eventDisclosure} key={selectedYear ?? 'all'} open={selectedYear !== null} data-testid="circuit-event-data">
      <summary><h3>{selectedYear === null ? t.measurements : `${t.seasonEvents} · ${selectedYear}`} <small>· {matching.length}</small></h3></summary>
      <p>{t.note}</p>
      {matching.length ? <>
        <div className={styles.eventScroll} role="region" tabIndex={0} aria-label={t.measurements}>
          <table className={styles.eventTable}><thead><tr><th scope="col">{t.year}</th><th scope="col">{t.grandPrix}</th><th scope="col">{t.length}</th><th scope="col">{t.turns}</th><th scope="col">{t.laps}</th><th scope="col">{t.distance}</th><th scope="col">{t.source}</th></tr></thead>
            <tbody>{visible.map(e => <tr key={e.race_id} data-race-id={e.race_id}><th scope="row">{e.season_year}</th><td><Link href={`/${locale}/races/${e.race_id}`}>{e.race_name} ↗</Link></td><td>{e.course_length_km} km</td><td>{e.turns}</td><td>{e.laps}</td><td>{e.distance_km} km</td><td><details className={styles.provenance}><summary>{t.source} · {e.release_tag}</summary><code>{e.source_locator}</code><code>{e.content_hash}</code></details></td></tr>)}</tbody>
          </table>
        </div>
        {!showAll && matching.length > visible.length && <button type="button" className={styles.more} onClick={() => setShowAll(true)}>{t.showAll} ({matching.length})</button>}
      </> : <p>{t.noEvents}</p>}
    </details>
  </section>;
}
