import type { ExplorerGraph } from '@/lib/explorer-contract';
import styles from './explorer-graph.module.css';

type Props = { graph: ExplorerGraph; locale: 'en' | 'uk' };

const DISPLAY_LIMIT = 10;
const WIDTH = 840;
const HEIGHT = 540;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const RADIUS_X = 287;
const RADIUS_Y = 191;

/**
 * Read-only, keyboard-linkable first-pass visualization of verified HX-01
 * result associations. The full accessible list remains in the route.
 */
export default function ExplorerGraph({ graph, locale }: Props) {
  const uk = locale === 'uk';
  const focus = graph.nodes.find(node => node.key === graph.focus);
  const visible = graph.edges.slice(0, DISPLAY_LIMIT);
  return <section className={styles.panel} aria-label={uk ? 'Карта зв’язків' : 'Connection map'}>
    <div className={styles.header}>
      <strong>{uk ? 'Карта сезону' : 'Season map'} · {graph.year}</strong>
      <span>{uk ? 'Пілот у центрі' : 'Driver at center'}</span>
    </div>
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.map} role="img"
      aria-label={uk
        ? `Граф зв’язків пілота з ${visible.length} конструкторами у сезоні ${graph.year}`
        : `Driver connections to ${visible.length} constructors in season ${graph.year}`}>
      <defs>
        <radialGradient id="hx02-glow"><stop offset="0" stopColor="#e53935" stopOpacity=".25" />
          <stop offset="1" stopColor="#e53935" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx={CENTER_X} cy={CENTER_Y} r="225" fill="url(#hx02-glow)" />
      {visible.map((edge, i) => {
        const angle = -Math.PI / 2 + i * 2 * Math.PI / visible.length;
        const x = CENTER_X + RADIUS_X * Math.cos(angle);
        const y = CENTER_Y + RADIUS_Y * Math.sin(angle);
        return <line key={edge.key} x1={CENTER_X} y1={CENTER_Y} x2={x} y2={y}
          stroke="#f04438" strokeOpacity=".56" strokeWidth="2" strokeDasharray="5 5" />;
      })}
      <circle cx={CENTER_X} cy={CENTER_Y} r="87" fill="#c91e23" stroke="#ff6b67" strokeWidth="3" />
      <text x={CENTER_X} y={CENTER_Y - 18} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
        {uk ? 'ПІЛОТ' : 'DRIVER'}
      </text>
      <text x={CENTER_X} y={CENTER_Y + 8} textAnchor="middle" fill="#fff" fontSize="17" fontWeight="700">
        {(focus?.name ?? graph.focus).slice(0, 22)}
      </text>
      <text x={CENTER_X} y={CENTER_Y + 31} textAnchor="middle" fill="#fff" fontSize="12">
        {graph.year}
      </text>
      {visible.map((edge, i) => {
        const node = graph.nodes.find(item => item.key === edge.to);
        if (!node) return null;
        const angle = -Math.PI / 2 + i * 2 * Math.PI / visible.length;
        const x = CENTER_X + RADIUS_X * Math.cos(angle);
        const y = CENTER_Y + RADIUS_Y * Math.sin(angle);
        return <a key={edge.key} href={`/${locale}/constructors/${node.entity_id}`}
          className={styles.nodeLink}
          aria-label={uk ? `${node.name}, перейти до конструктора` : `${node.name}, open constructor`}>
          <circle cx={x} cy={y} r="48" fill="#202b36" stroke="#8c9ba7" strokeWidth="2" />
          <text x={x} y={y - 5} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">
            {node.name.length > 15 ? node.name.slice(0, 13) + '…' : node.name}
          </text>
          <text x={x} y={y + 15} textAnchor="middle" fill="#b9c7d2" fontSize="10">
            {edge.races} {uk ? 'гонок' : 'races'}
          </text>
        </a>;
      })}
    </svg>
    <p className={styles.caption}>{uk
      ? 'Лінії показують записи результатів, а не контракти чи правонаступництво.'
      : 'Lines represent recorded results, not contracts or team succession.'}
      {graph.edges.length > DISPLAY_LIMIT && ' ' + (uk
        ? `На карті показано ${DISPLAY_LIMIT} із ${graph.edges.length} зв’язків. Повний список нижче.`
        : `Map shows ${DISPLAY_LIMIT} of ${graph.edges.length} links. Full list below.`)}
    </p>
  </section>;
}
