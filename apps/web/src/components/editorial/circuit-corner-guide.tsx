import { CircuitNumberedDiagram } from './circuit-numbered-diagram';
import legacyGuides from './circuit-corner-guides.json';
import { CIRCUIT_ARTWORK } from '@/components/circuit-layout-registry';
import { cornerGuideFor, cornerSources, numberedCorners } from './circuit-corner-model';
import styles from './circuit-corner-guide.module.css';

export const legacyNamedCircuitIds = ['monaco', 'silverstone', 'monza', 'suzuka', 'spa-francorchamps'];

export function CircuitCornerGuide({ circuitId, locale, availableLayouts = [] }: { circuitId: string; locale: 'en' | 'uk'; availableLayouts?: string[] }) {
  const guide = cornerGuideFor(circuitId, availableLayouts);
  const uk = locale === 'uk';
  if (!guide) {
    const existing = legacyNamedCircuitIds.includes(circuitId) ? legacyGuides.find(item => item.id === circuitId) : null;
    return <div className={styles.section} data-testid="circuit-corner-guide"><h2>{uk ? 'Дослідіть повороти' : 'Explore the corners'}</h2>{existing ? <div className={styles.grid}>{existing.sections.map(section => <article className={styles.card} key={section.label}><h3>{section.label}</h3><p>{section[locale]}</p><a href={section.source} target="_blank" rel="noopener noreferrer">{uk ? 'Джерело' : 'Source'} ↗</a></article>)}</div> : <p>{uk ? 'Довідник назв поворотів для цієї траси ще не підготовлено.' : 'A corner-name guide is not available for this circuit yet.'}</p>}
      {existing && <details className={styles.note}><summary>{uk ? 'Джерела назв' : 'Naming sources'}</summary><p>{uk ? 'Раніше опубліковані огляди, перевірені за допомогою ШІ. Незалежне редакційне схвалення ще не отримано. Сучасні назви не переносяться автоматично на історичні конфігурації.' : 'Existing AI-reviewed summaries. Independent editorial approval remains pending. Modern names do not automatically apply to historical layouts.'}</p></details>}
    </div>;
  }
  const artwork = CIRCUIT_ARTWORK.get(guide.layout_id);
  const mapSource = cornerSources[`${circuitId}-map`];
  const hasFiaMap = /^https:\/\/www\.fia\.com\//.test(mapSource ?? '');
  const provisionalNumbering = guide.sections.some(section => !['source_checked_ai', 'independently_verified'].includes(section.confirmation_status));
  const historicalReference = guide.sections.flatMap(section => section.sources).map(key => cornerSources[key]).find(url => typeof url === 'string' && /^https:\/\//.test(url));
  const layoutReference = [mapSource, historicalReference].find(url => typeof url === 'string' && /^https:\/\//.test(url));
  return <div className={styles.section} data-testid="circuit-corner-guide">
    <h2 id="corner-guide-title">{uk ? 'Дослідіть повороти' : 'Explore the corners'}</h2>
    <p>{guide.numbered_turns} {provisionalNumbering ? (uk ? 'попередніх позицій для дослідження — не підтверджена нумерація поворотів' : 'provisional study positions — not verified turn numbers') : (uk ? 'пронумерованих поворотів' : 'numbered turns')} · {guide.layout_id}</p>
    <div className={styles.explorer}>
      {guide.diagram ? <CircuitNumberedDiagram guide={guide} locale={locale} /> : artwork && <figure className={styles.outline}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artwork.path} width={500} height={500} loading="lazy" alt={`${guide.layout_id} · ${uk ? 'контур конфігурації' : 'layout outline'}`} />
        <figcaption><a href={artwork.source_url}>{artwork.author}</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></figcaption>
      </figure>}
      <div><nav className={styles.turns} aria-label={provisionalNumbering ? (uk ? 'Попередні позиції дослідження за маршрутом' : 'Historical study positions in route order') : (uk ? 'Повороти за порядком кола' : 'Corners in lap order')}>{numberedCorners(guide).map(corner => <a key={corner.number} href={`#${corner.section_id}`} aria-label={`${provisionalNumbering ? (uk ? 'Попередня позиція' : 'Provisional position') : (uk ? 'Поворот' : 'Turn')} ${corner.number} · ${corner.name ?? (uk ? 'Без підтвердженої назви' : 'No verified individual name')}`}>{corner.number}</a>)}</nav>
        <p>{provisionalNumbering ? (uk ? 'Це лише порядок дослідницьких записів, а не підтверджені номери апексів. Не використовуйте їх як історичну схему FIA.' : 'These are research-entry positions, not authenticated apex numbers. Do not use them as a period FIA turn map.') : (uk ? 'Оберіть номер, щоб дізнатися про назву. Кілька поворотів можуть утворювати одну іменовану секцію.' : 'Choose a number to explore its name. A named section can contain several numbered turns.')}</p>
        {layoutReference && <a className={styles.mapLink} href={layoutReference} target="_blank" rel="noopener noreferrer">{hasFiaMap && !provisionalNumbering ? (uk ? 'Відкрити схему FIA з номерами' : 'Open the numbered FIA map') : (uk ? 'Відкрити історичне джерело (не пронумеровану карту)' : 'Open historical evidence (not a numbered map)')} · {guide.numbering_year} ↗</a>}
      </div>
    </div>
    <div className={styles.grid}>{guide.sections.map(section => <article className={styles.card} id={section.id} tabIndex={-1} key={section.id}>
      <span className={styles.counter}>{provisionalNumbering ? (uk ? 'Позиція ' : 'Study ') : 'T'}{section.numbers.join(' / ')}</span><h3>{section.name ?? (uk ? 'Без підтвердженої назви' : 'No verified individual name')}{provisionalNumbering && section.name ? (uk ? ' (прив’язка не підтверджена)' : ' (mapping unverified)') : null}</h3>
      {section.explanation && <p>{section.explanation[locale]}</p>}
      {section.aliases.length > 0 && <p><small>{provisionalNumbering ? (uk ? 'Орієнтири для порівняння, не підтверджені назви поворотів' : 'Comparative landmarks, not verified corner names') : (uk ? 'Інші та історичні назви' : 'Alternative and historical names')}: {section.aliases.join(' · ')}</small></p>}
      {[...section.sources.slice(1), section.sources[0]].map(key => cornerSources[key]).filter((url): url is string => typeof url === 'string' && /^https:\/\//.test(url)).slice(0, 1).map(url => <a key={url} href={url} target="_blank" rel="noopener noreferrer">{provisionalNumbering ? (uk ? 'Історичне джерело (не доказ номера)' : 'Historical source (not number verification)') : (uk ? 'Джерело про поворот' : 'Corner source')} ↗</a>)}
    </article>)}</div>
    <details className={styles.note}><summary>{uk ? 'Джерела та історичні назви' : 'Sources & historical naming'}</summary><p>{hasFiaMap && !provisionalNumbering ? (uk ? `Нумерація: схема FIA ${guide.numbering_year} року. Назви й описи: джерела біля кожної секції. Довідник стосується лише зазначеної конфігурації; незалежне редакційне схвалення ще не отримано.` : `Numbering: FIA ${guide.numbering_year} map. Names and descriptions: sources linked with each section. This guide applies only to the stated layout; independent editorial approval remains pending.`) : (uk ? `Історична конфігурація ${guide.numbering_year} року. Кількість і порядок поворотів реконструйовані за джерелами, але точна пронумерована схема FIA цієї епохи не підтверджена. Сучасні назви можуть відрізнятися; незалежна перевірка ще потрібна.` : `Historic ${guide.numbering_year} layout. Turn count comes from the pinned F1DB layout, while the displayed study positions are NOT authenticated historical apex numbers or locations; source-linked landmarks may not correspond to these slots. Modern names may differ; independent review is still required.`)}</p>{circuitId === 'monaco' && <p>{uk ? 'Число 18 у вступі статті F1.com про Монако суперечить нумерації FIA 1–19. № 17 збережено без окремої назви; Swimming Pool та Nouvelle Chicane охоплюють кілька номерів.' : 'The Monaco article’s introduction says 18, conflicting with FIA numbering 1–19. Turn 17 retains no individual name; Swimming Pool and Nouvelle Chicane span multiple numbers.'}</p>}</details>
  </div>;
}
