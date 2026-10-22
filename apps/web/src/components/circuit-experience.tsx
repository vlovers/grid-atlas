'use client';

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
    kicker: 'КОНФІГУРАЦІЇ / ІСТОРІЯ', title: 'Траса змінюється з часом',
    lead: 'Дані F1DB прив’язані до конкретної конфігурації або Гран-прі. Тут немає вигаданого контуру, секторів, DRS чи рейтингів шин.',
    select: 'Історична конфігурація', all: 'Усі конфігурації',
    effective: 'Позначена джерелом як актуальна', length: 'Довжина кола',
    turns: 'Повороти', events: 'Пов’язані Гран-прі', first: 'Перше зафіксоване використання',
    latest: 'Останнє зафіксоване використання', year: 'Сезон', distance: 'Дистанція гонки',
    laps: 'Кола', direction: 'Напрямок руху', source: 'Джерело і межі',
    noEvents: 'Для цієї конфігурації немає пов’язаних гонок в архіві.',
    measurements: 'Виміри конкретних етапів', showAll: 'Показати всі записи',
    note: 'Кожен рядок — вимір конкретної гонки. Довжина і кількість поворотів не переносяться автоматично на інші роки.',
    notMap: 'Схематична шкала вимірів, не географічна карта траси',
    graphic: 'Контур історичної конфігурації',
    illustration: 'Контур конфігурації за матеріалами F1DB, не масштабна інженерна карта',
    credit: 'Автор контурів: Jules Roy · CC BY 4.0',
    selectForMap: 'Оберіть конфігурацію, щоб побачити контур',
    noGraphic: 'Перевірений контур для цієї конфігурації недоступний.',
    yearBrowse: 'Досліджуйте за сезоном', yearHint: 'Оберіть рік, щоб переглянути конфігурацію, використану в архівних перегонах.',
    yearSelected: 'Вибраний сезон', noLayoutForYear: 'Для цього сезону немає пов’язаної конфігурації.',
    compare: 'Порівняння конфігурацій', compareHint: 'Порівняння лише параметрів, зафіксованих у F1DB для кожної конфігурації; це не оцінка швидкості чи складності.',
    exploreTimeline: 'Хронологія Гран-прі', timelineHint: 'Оберіть зафіксований сезон, щоб переглянути конфігурацію та пов’язані перегони.',
    compareYear: 'Зафіксовані роки', compareMissing: 'Немає достатньо даних для порівняння.',
    previous: 'Попередній сезон', next: 'Наступний сезон', seasonEvents: 'Гран-прі обраного сезону', clearYear: 'Показати всі роки',
  },
  en: {
    kicker: 'LAYOUTS / HISTORY', title: 'The circuit through time',
    lead: 'F1DB data belongs to a particular layout or Grand Prix. No invented track outline, sectors, DRS or tyre ratings are shown.',
    select: 'Historical layout', all: 'All layouts',
    effective: 'Marked current by the source', length: 'Lap length',
    turns: 'Corners', events: 'Linked Grands Prix', first: 'First recorded use',
    latest: 'Latest recorded use', year: 'Season', distance: 'Race distance',
    laps: 'Laps', direction: 'Direction', source: 'Source and limits',
    noEvents: 'No linked Grand Prix is recorded for this layout.',
    measurements: 'Event-specific measurements', showAll: 'Show all records',
    note: 'Every row is specific to one event. Length and corner counts are not assumed valid for other years.',
    notMap: 'Abstract measurement scale, not a geographic track map',
    graphic: 'Historical layout outline',
    illustration: 'F1DB-sourced layout outline, not an engineering scale map',
    credit: 'Outline artwork: Jules Roy · CC BY 4.0',
    selectForMap: 'Choose a layout to view its outline',
    noGraphic: 'No verified outline available for this layout.',
    yearBrowse: 'Explore by season', yearHint: 'Choose a year to see the layout recorded for its Grands Prix.',
    yearSelected: 'Selected season', noLayoutForYear: 'No linked layout is recorded for this season.',
    compare: 'Layout comparison', compareHint: 'Compare only measurements recorded by F1DB for each layout. This is not a speed or difficulty ranking.',
    exploreTimeline: 'Grand Prix timeline', timelineHint: 'Choose a recorded season to inspect its layout and linked races.',
    compareYear: 'Recorded years', compareMissing: 'Not enough layout data to compare.',
    previous: 'Previous season', next: 'Next season', seasonEvents: 'Grands Prix in selected season', clearYear: 'Show all years',
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
  const current = layouts.find(l => l.id === selected);
  const artwork = current ? CIRCUIT_ARTWORK.get(current.external_layout_id) : undefined;
  const matching = useMemo(() => events.filter(e => (!selected || e.layout_id === selected) && (selectedYear === null || e.season_year === selectedYear)), [events, selected, selectedYear]);
  const visible = showAll ? matching : matching.slice(0, 12);
  const maxLength = Math.max(1, ...events.map(e => Number(e.course_length_km)), ...layouts.map(l => Number(l.length_km)));
  const timelineYears = [...new Set(events.map(e => e.season_year))].sort((a, b) => a - b);
  const minYear = events.length ? Math.min(...events.map(e => e.season_year)) : null;
  const maxYear = events.length ? Math.max(...events.map(e => e.season_year)) : null;
  return <section className={styles.shell} aria-labelledby="circuit-experience-title" data-testid="circuit-experience">
    <p className={styles.kicker}>{t.kicker}</p>
    <h2 id="circuit-experience-title">{t.title}</h2>
    <p className={styles.lead}>{t.lead}</p>
    {recordedYears.length > 0 && <div className={styles.yearExplorer} data-testid="circuit-year-explorer">
      <div className={styles.yearExplorerHeading}><div><strong>{t.yearBrowse}</strong><p>{t.yearHint}</p></div><span aria-live="polite">{selectedYear === null ? '' : `${t.yearSelected}: ${selectedYear}`}</span></div>
      <div className={styles.yearExplorerControls}>
        <button type="button" disabled={yearIndex <= 0} onClick={() => selectYear(recordedYears[yearIndex-1])} aria-label={t.previous}>‹</button>
        <label className={styles.yearPickerLabel}>{t.year}<select data-testid="circuit-year-select" value={selectedYear ?? ''} onChange={e => { if (e.target.value) selectYear(Number(e.target.value)); }}>
          <option value="">—</option>
          {recordedYears.map(year => <option key={year} value={year}>{year}</option>)}
        </select></label>
        <button type="button" disabled={yearIndex < 0 || yearIndex >= recordedYears.length-1} onClick={() => selectYear(recordedYears[yearIndex+1])} aria-label={t.next}>›</button>
        {selectedYear !== null && <button type="button" className={styles.clearYear} onClick={() => { setSelectedYear(null); setShowAll(false); }}>{t.clearYear}</button>}
      </div>
    </div>}
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
          <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">License ↗</a>
        </figcaption>
      </> : <p className={styles.trackFallback}>
        {current ? t.noGraphic : t.selectForMap}
      </p>}
    </figure>
    <div className={styles.layout}>
      <div className={styles.selector}>
        <label htmlFor="circuit-layout-select">{t.select}</label>
        <select id="circuit-layout-select" data-testid="circuit-layout-select" value={selected}
          onChange={e => { setSelected(e.target.value); setSelectedYear(null); setShowAll(false); }}>
          <option value="">{t.all}</option>
          {layouts.map(l => <option key={l.id} value={l.id}>{l.external_layout_id} · {l.length_km} km</option>)}
        </select>
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
    {layouts.length > 1 && <section className={styles.compare} aria-labelledby="circuit-layout-comparison-title" data-testid="circuit-layout-comparison">
      <h3 id="circuit-layout-comparison-title">{t.compare}</h3>
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
    </section>}
    {minYear !== null && maxYear !== null && <section className={styles.eraRail} aria-labelledby="circuit-era-rail-title" data-testid="circuit-era-rail">
      <div className={styles.eraRailIntro}><h3 id="circuit-era-rail-title">{t.exploreTimeline}</h3><p>{t.timelineHint}</p></div>
      <div className={styles.timelineHeading}><strong>{minYear}</strong><span>{t.notMap}</span><strong>{maxYear}</strong></div>
      <div className={styles.timelineBar} aria-hidden="true">
        {timelineYears.map(year => <span key={year}
          className={selected && !events.some(e => e.season_year === year && e.layout_id === selected) ? styles.dimmed : ''}
          style={{ left: `${maxYear === minYear ? 50 : ((year - minYear) / (maxYear - minYear)) * 100}%` }} />)}
      </div>
      <div className={styles.eraRailYears} role="group" aria-label={t.exploreTimeline}>
        {recordedYears.map(year => {
          const linked = events.filter(e => e.season_year === year && e.layout_id);
          return <button key={year} type="button" aria-pressed={selectedYear === year}
            className={selectedYear === year ? styles.activeYear : undefined}
            onClick={() => selectYear(year)}>
            <strong>{year}</strong><span>{linked.length} GP</span>
          </button>;
        })}
      </div>
    </section>}
    <h3>{selectedYear === null ? t.measurements : `${t.seasonEvents} · ${selectedYear}`}</h3>
    <p>{t.note}</p>
    {matching.length ? <div className={styles.events}>
      {visible.map(e => <article key={e.race_id} className={styles.event}>
        <div className={styles.eventHead}>
          <span>{e.season_year} · {t.year}</span>
          <Link href={`/${locale}/races/${e.race_id}`}>{e.race_name} ↗</Link>
        </div>
        <div className={styles.eventStats}>
          <div><small>{t.length}</small><strong>{e.course_length_km} km</strong><span className={styles.meter}><span style={{ width: `${Math.min(100, Number(e.course_length_km) / maxLength * 100)}%` }}/></span></div>
          <div><small>{t.turns}</small><strong>{e.turns}</strong></div>
          <div><small>{t.laps}</small><strong>{e.laps}</strong></div>
          <div><small>{t.distance}</small><strong>{e.distance_km} km</strong></div>
        </div>
        <details className={styles.provenance}>
          <summary>{t.source} · {e.release_tag}</summary>
          <code>{e.source_locator}</code>
          <code>{e.content_hash}</code>
        </details>
      </article>)}
      {!showAll && matching.length > visible.length && <button type="button" className={styles.more}
        onClick={() => setShowAll(true)}>{t.showAll} ({matching.length})</button>}
    </div> : <p>{t.noEvents}</p>}
  </section>;
}
