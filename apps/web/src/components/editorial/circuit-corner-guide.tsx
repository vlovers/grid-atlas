import guides from './circuit-corner-guides.json';
import styles from './circuit-corner-guide.module.css';

type Guide = { id: string; sections: { label: string; en: string; uk: string; source: string }[] };
const byId = new Map((guides as Guide[]).map(guide => [guide.id, guide]));
const raceOnlySource = (url: string) => url.includes('/f1db/f1db/blob/') && (url.endsWith('/race-results.yml') || url.endsWith('/race.yml'));
export function CircuitCornerGuide({ circuitId, locale }: { circuitId: string; locale: 'en' | 'uk' }) {
  const guide = byId.get(circuitId);
  if (!guide) return null;
  const uk = locale === 'uk';
  const hasIndependentTrackEvidence = guide.sections.some(section => !raceOnlySource(section.source));
  return <section className={styles.section} aria-labelledby="corner-guide-title" data-testid="circuit-corner-guide">
    <p className={styles.kicker}>{uk ? 'За межами результатів' : 'Beyond the results'}</p>
    <h2 id="corner-guide-title">{hasIndependentTrackEvidence
      ? (uk ? 'Повороти, траси та їхні історії' : 'Corners, circuits and stories')
      : (uk ? 'Історії гонок: з чого почати' : 'Race stories: where to begin')}</h2>
    <p className={styles.intro}>{!hasIndependentTrackEvidence ? (uk
      ? 'Ці сюжети спираються на гоночний архів. Назви конкретних поворотів, їх походження та історичні конфігурації ще потребують окремих достовірних джерел.'
      : 'These stories draw on race archive records. Individual corner names, their origins and historical configurations still need dedicated trustworthy sources.') : uk
      ? 'У кожної траси є історії — від назв поворотів до визначних гоночних вікендів. Деякі блоки пояснюють віражі, інші допомагають почати дослідження архівного результату. Протокол гонки не доводить кожну історичну подробицю.'
      : 'Every circuit has stories worth following, from named corners to remarkable race weekends. Some sections explain turns, others offer an entry point into an archival result. An official race classification does not prove every historical detail.'}</p>
    <div className={styles.grid}>{guide.sections.map((turn, index) => <article className={styles.card} key={turn.label}>
      <span className={styles.counter}>{String(index + 1).padStart(2, '0')}</span>
      <h3>{turn.label}</h3>
      <p>{turn[locale]}</p>
      <a href={turn.source} target="_blank" rel="noopener noreferrer">{uk ? 'Перевірити джерело' : 'Explore the source'} ↗</a>
    </article>)}</div>
    <p className={styles.note}>{uk ? 'AI-reviewed · Незалежна редакторська перевірка очікується' : 'AI-reviewed · Independent editorial verification pending'}</p>
  </section>;
}
