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
  return <div className={styles.section} data-testid="circuit-corner-guide">
    <h2 id="corner-guide-title">{uk ? 'Дослідіть повороти' : 'Explore the corners'}</h2>
    <p>{guide.numbered_turns} {uk ? 'пронумерованих поворотів' : 'numbered turns'} · {guide.layout_id}</p>
    <div className={styles.explorer}>
      {guide.diagram ? <CircuitNumberedDiagram guide={guide} locale={locale} /> : artwork && <figure className={styles.outline}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artwork.path} width={500} height={500} loading="lazy" alt={`${guide.layout_id} · ${uk ? 'контур конфігурації' : 'layout outline'}`} />
        <figcaption><a href={artwork.source_url}>{artwork.author}</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></figcaption>
      </figure>}
      <div><nav className={styles.turns} aria-label={uk ? 'Повороти за порядком кола' : 'Corners in lap order'}>{numberedCorners(guide).map(corner => <a key={corner.number} href={`#${corner.section_id}`} aria-label={`${corner.number} · ${corner.name ?? (uk ? 'Без окремої назви' : 'No individual name')}`}>{corner.number}</a>)}</nav>
        <p>{uk ? 'Оберіть номер, щоб дізнатися про назву. Кілька поворотів можуть утворювати одну іменовану секцію.' : 'Choose a number to explore its name. A named section can contain several numbered turns.'}</p>
        <a className={styles.mapLink} href={cornerSources[`${circuitId}-map`]} target="_blank" rel="noopener noreferrer">{uk ? 'Відкрити схему FIA з номерами' : 'Open the numbered FIA map'} · {guide.numbering_year} ↗</a>
      </div>
    </div>
    <div className={styles.grid}>{guide.sections.map(section => <article className={styles.card} id={section.id} tabIndex={-1} key={section.id}>
      <span className={styles.counter}>T{section.numbers.join(' / ')}</span><h3>{section.name ?? (uk ? 'Без окремої назви' : 'No individual name')}</h3>
      {section.explanation && <p>{section.explanation[locale]}</p>}
      {section.aliases.length > 0 && <p><small>{uk ? 'Інші та історичні назви' : 'Alternative and historical names'}: {section.aliases.join(' · ')}</small></p>}
      <a href={cornerSources[section.sources[1]]} target="_blank" rel="noopener noreferrer">{uk ? 'Історія назви · F1.com' : 'Name history · F1.com'} ↗</a>
    </article>)}</div>
    <details className={styles.note}><summary>{uk ? 'Джерела та історичні назви' : 'Sources & historical naming'}</summary><p>{uk ? 'Нумерація: офіційна схема FIA 2025. Назви: F1.com, 2026. Цей довідник стосується лише зазначеної конфігурації; давніші назви наведено як альтернативи без непідтверджених дат. Джерела перевірено за допомогою ШІ; незалежне редакційне схвалення ще не отримано.' : 'Numbering: official FIA 2025 map. Names: F1.com, 2026. This guide applies only to the specified layout; older names are alternatives without unverified dates. Sources checked with AI; independent editorial approval remains pending.'}</p>{circuitId === 'monaco' && <p>{uk ? 'Число 18 у вступі статті F1.com про Монако суперечить нумерації FIA 1–19. № 17 збережено без окремої назви; Swimming Pool та Nouvelle Chicane охоплюють кілька номерів.' : 'The Monaco article’s introduction says 18, conflicting with FIA numbering 1–19. Turn 17 retains no individual name; Swimming Pool and Nouvelle Chicane span multiple numbers.'}</p>}</details>
  </div>;
}
