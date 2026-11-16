import { MediaCollection } from '../collection';
import { CircuitDiagram } from '../licensed-media';
import { approvedPublicationAssets, archiveReleaseUrl, type CircuitVisualContext } from './model';
import { selectCircuitVisualDiagram } from './selection';
import styles from './proposal.module.css';

/** Isolated reader proposal. Research candidates never enter the media props. */
export function CircuitVisualProposal({ context, locale }: { context: CircuitVisualContext; locale: 'en' | 'uk' }) {
  const uk = locale === 'uk';
  const first = context.years[0], last = context.years.at(-1)!;
  const layoutSource = context.sources.find(source => source.claim_type === 'svg_layout')!;
  const diagram = selectCircuitVisualDiagram(approvedPublicationAssets, context);
  return <article className={styles.dossier} data-testid="circuit-visual-proposal" data-circuit={context.id}>
    <header className={styles.cover}>
      <div className={styles.marker} aria-hidden="true">{String(context.year).slice(2)}<span>GA / {context.country.toUpperCase()}</span></div>
      <div className={styles.intro}><p className={styles.eyebrow}>{uk ? 'МІСЦЯ В АРХІВІ' : 'PLACES IN THE ARCHIVE'} / {context.place}</p>
        <h2>{context.name}</h2><p className={styles.standfirst}>{uk ? 'Спершу записи. Зображення — коли перевірено їхнє походження та права.' : 'Start with the record. Imagery follows a checked identity and permission to reuse.'}</p>
        <dl className={styles.facts}><div><dt>{uk ? 'Рік запису' : 'Reference year'}</dt><dd>{context.year}</dd></div><div><dt>{uk ? 'Довжина в записі' : 'Recorded length'}</dt><dd>{new Intl.NumberFormat(uk ? 'uk-UA' : 'en-GB', { maximumFractionDigits: 3 }).format(context.length)} km</dd></div><div><dt>{uk ? 'Сезони в архіві' : 'Recorded seasons'}</dt><dd>{context.years.length}</dd></div></dl>
      </div>
    </header>
    <section className={styles.rhythm} aria-labelledby={`years-${context.id}`}>
      <header><h3 id={`years-${context.id}`}>{uk ? 'Роки залишають слід.' : 'The years leave a trace.'}</h3><p>{first}–{last} · {uk ? 'позначено лише сезони з імпортованим записом гонки' : 'only seasons with an imported race record are marked'}</p></header>
      <div className={styles.trace} role="img" aria-label={`${uk ? 'Сезони з записами' : 'Recorded seasons'}: ${context.years.join(', ')}`} data-testid="archive-year-trace">
        {Array.from({ length: 77 }, (_, index) => 1950 + index).map(year => <span key={year} aria-hidden="true" className={context.years.includes(year) ? styles.recorded : styles.absent} />)}
      </div><div className={styles.axis} aria-hidden="true"><span>1950</span><span>1975</span><span>2000</span><span>2026</span></div>
      <p className={styles.note}>{uk ? 'Оригінальна візуалізація даних · це не схема траси та не нумерація поворотів.' : 'Original data visualization · not a circuit map or corner numbering.'}</p>
      <p className={styles.note}>{uk ? 'Дані за 2026 рік попередні. Відсутність запису не доводить відсутності перегонів.' : '2026 records remain provisional. A missing record does not prove an absence of racing.'}</p>
    </section>
    <div className={styles.columns}>
      <section className={styles.photoSlot} aria-labelledby={`photo-${context.id}`} data-testid="rights-safe-photo-slot">
        <p className={styles.eyebrow}>{uk ? 'ФОТОАРХІВ' : 'THE IMAGE ARCHIVE'}</p>{context.approvedPhotoCount === 0 ? <div className={styles.photoFrame}><span className={styles.emptyMark} aria-hidden="true">◌</span><h3 id={`photo-${context.id}`}>{uk ? 'Місце для зображення. Не для підміни.' : 'Space for an image. Room for honesty.'}</h3><p>{uk ? 'Для цієї пропозиції немає схвалених фотографій. Іншу трасу або сучасний знімок минулої епохи не підставляємо.' : 'This proposal has no cleared photographs. Another venue or a modern image standing in for the past would tell the wrong story.'}</p></div> : <h3 id={`photo-${context.id}`}>{uk ? 'Фотографії з перевіреним походженням' : 'Photographs with reviewed provenance'}</h3>}
        <MediaCollection assets={approvedPublicationAssets} subject={{ type: 'circuit', id: context.id }} label={context.name} locale={locale} />
      </section>
      <section className={styles.reference} aria-labelledby={`layout-${context.id}`} data-testid="rights-safe-diagram-slot"><p className={styles.eyebrow}>{uk ? 'КОНФІГУРАЦІЯ · КОНТЕКСТ' : 'LAYOUT / CONTEXT'}</p>
        <h3 id={`layout-${context.id}`}>{uk ? 'Той самий ідентифікатор. Окрема перевірка епохи.' : 'A shared identifier. A separate era check.'}</h3>
        <p className={styles.layoutName}>{context.layout} <span>· {context.year}</span></p>{diagram ? <CircuitDiagram assets={approvedPublicationAssets} assetId={diagram.id} circuitId={context.id} raceId={context.raceId} label={context.name} locale={locale} /> : <p>{uk ? 'Зовнішній рисунок тут не відтворено. Прив’язка запису до layout_id не підтверджує кожен історичний вигин чи права на конкретну схему.' : 'The external artwork is not reproduced here. A record bound to a layout ID does not authenticate every period bend or clear an individual diagram for reuse.'}</p>}
        {context.caveats.includes('layout_event_metadata_conflict') && <p className={styles.caveat}>{uk ? 'Bugatti: у гонці 1967 року — 8 поворотів і 4,422 км; атрибут конфігурації містить 14 і 4,185 км. Ці записи не взаємозамінні.' : 'Bugatti: the 1967 event records 8 turns / 4.422km; the layout attribute records 14 / 4.185km. These observations are not interchangeable.'}</p>}
        {context.caveats.includes('modern_comparison_not_period_evidence') && <p className={styles.caveat}>{uk ? 'Сучасне порівняння Mont-Tremblant 2001 року не підтверджує геометрію гонок F1 1968–1970 років.' : 'The modern 2001 Mont-Tremblant comparison does not authenticate the 1968–1970 F1 geometry.'}</p>}
        <a href={layoutSource.file_page_url} target="_blank" rel="noopener noreferrer">{uk ? 'Відкрити джерело рисунка' : 'Inspect the artwork source'} ↗</a>
        <p className={styles.note}>Jules Roy · {uk ? 'джерело декларує' : 'source declares'} <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · {uk ? 'окреме схвалення прав очікується' : 'individual rights review pending'}</p>
      </section>
    </div>
    <footer className={styles.footer}><span>{context.officialName}</span><a href={archiveReleaseUrl}>F1DB v2026.17.0 · CC BY 4.0 ↗</a></footer>
  </article>;
}
