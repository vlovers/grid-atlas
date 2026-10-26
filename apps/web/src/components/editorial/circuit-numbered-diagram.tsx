import { CIRCUIT_ARTWORK } from '@/components/circuit-layout-registry';
import type { CornerGuide } from './circuit-corner-model';
import styles from './circuit-corner-guide.module.css';

/** Editorial annotation coordinates, scoped to one source-backed local outline. */
export function CircuitNumberedDiagram({ guide, locale }: { guide: CornerGuide; locale: 'uk' | 'en' }) {
  const artwork = CIRCUIT_ARTWORK.get(guide.layout_id);
  if (!guide.diagram || !artwork || guide.diagram.asset !== artwork.path) return null;
  return <figure className={styles.numberedFigure} data-testid="circuit-numbered-diagram">
    <div className={styles.diagramViewport} role="region" tabIndex={0} aria-label={locale === 'uk' ? 'Пронумерована схема траси' : 'Numbered circuit diagram'}><div className={styles.diagram}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={artwork.path} width={500} height={500} alt={`${guide.layout_id} · ${locale === 'uk' ? 'контур конфігурації' : 'layout outline'}`} />
      <svg viewBox="0 0 500 500" aria-hidden="true" focusable="false">{guide.diagram.points.map(point => <line key={point.number} x1={point.anchor[0]} y1={point.anchor[1]} x2={point.label[0]} y2={point.label[1]} />)}</svg>
      {guide.diagram.points.map(point => {
        const section = guide.sections.find(item => item.numbers.includes(point.number));
        return section && <a key={point.number} href={`#${section.id}`} style={{ left: `${point.label[0]/5}%`, top: `${point.label[1]/5}%` }} aria-label={`${point.number} · ${section.name ?? (locale === 'uk' ? 'Без окремої назви' : 'No individual name')}`}>{point.number}</a>;
      })}
    </div></div>
    <figcaption><a href={artwork.source_url}>{artwork.author}</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · {locale === 'uk' ? 'Додано приблизні маркери за схемою FIA; ілюстрація, не масштабна карта.' : 'Approximate FIA-sourced annotations added; illustration, not a scale map.'}</figcaption>
  </figure>;
}
