import { Link } from '@/i18n/navigation';
import { candidateCircuitNarratives } from './circuit-candidates';
import { legacyCircuitHistory } from './circuit-history-stories';
import { isCircuitEditionApproved } from './circuit-release';
import facts from './circuit-extra-stories.json';
import nextFacts from './circuit-next20-stories.json';
import finalFacts from './circuit-final33-stories.json';
import styles from './circuit-history-stories.module.css';

export const circuitNarratives = candidateCircuitNarratives;
export const hasPublicCircuitMoments = (id: string) => Boolean(legacyCircuitHistory[id]) || isCircuitEditionApproved(id) || legacy.some(entry => entry.id === id);
const legacy = [...facts, ...nextFacts, ...finalFacts];
type Locale = 'en' | 'uk';
type Race = { race_id: string; season_year: number; race_name: string; race_date: string | null;
  winners: { driver_id: string; driver_name: string; constructor_id: string; constructor_name: string }[] };

function ReviewDetails({ locale }: { locale: Locale }) {
  return <details className={styles.review}><summary>{locale === 'uk' ? 'Про джерела добірки' : 'About the selection’s sources'}</summary><p>{locale === 'uk'
    ? 'Короткі перекази наведених джерел; перевірено за допомогою ШІ. Незалежне редакційне схвалення ще не отримано. Гонки обрано за конкретними подіями — першою перемогою, боротьбою за титул або переломним моментом, а не за місцем у календарі.'
    : 'Short summaries of the cited sources, checked with AI. Independent editorial approval remains pending. Races are selected for specific milestones, title battles or turning points, rather than calendar position.'}</p></details>;
}

export function CircuitBiography({ circuitId, locale }: { circuitId: string; locale: Locale }) {
  const candidate = circuitNarratives.find(entry => entry.circuit_id === circuitId);
  const approved = isCircuitEditionApproved(circuitId);
  const existing = legacyCircuitHistory[circuitId]?.[locale];
  const biography = approved ? candidate?.biography : existing ? { title: { en: existing.title, uk: existing.title }, text: { en: existing.introduction, uk: existing.introduction }, source: existing.moments[0]?.url } : undefined;
  const previous = legacy.find(entry => entry.id === circuitId);
  const uk = locale === 'uk';
  return <div data-testid="circuit-biography"><h2>{uk ? 'Історія траси' : 'Circuit history'}</h2>
    {biography ? <><h3>{biography.title[locale]}</h3><p>{biography.text[locale]}</p><a href={biography.source} target="_blank" rel="noopener noreferrer">{uk ? 'Джерело · Formula 1' : 'Source · Formula 1'} ↗</a><ReviewDetails locale={locale} /></>
      : previous ? <><h3>{previous.title[locale]}</h3><p>{previous.description[locale]}</p><a href={previous.source} target="_blank" rel="noopener noreferrer">{uk ? 'Джерело' : 'Source'} ↗</a><ReviewDetails locale={locale} /></>
        : <p>{uk ? 'Окремий нарис історії цієї траси ще не підготовлено. Нижче можна дослідити її конфігурації та Гран-прі.' : 'A dedicated circuit history is not available yet. Explore its layouts and Grands Prix below.'}</p>}
  </div>;
}

export function CircuitMoments({ circuitId, locale, history }: { circuitId: string; locale: Locale; history: Race[] }) {
  const existing = legacyCircuitHistory[circuitId]?.[locale];
  // Reuse the already-public, source-linked short feature when no reviewed longform exists.
  // This does not publish any candidate narratives or bypass circuit-release.json.
  const featured = legacy.find(entry => entry.id === circuitId);
  const moments = isCircuitEditionApproved(circuitId) ? circuitNarratives.find(entry => entry.circuit_id === circuitId)?.moments : existing?.moments.map((moment, index) => ({ id: `${circuitId}-existing-${index}`, year: Number(moment.year), title: { en: moment.title, uk: moment.title }, text: { en: moment.description, uk: moment.description }, source: moment.url, locator: moment.year })) ?? (featured ? [{ id: `${circuitId}-featured`, year: Number(featured.year), title: featured.title, text: featured.description, source: featured.source, locator: featured.year }] : undefined);
  const uk = locale === 'uk';
  return <div data-testid="circuit-moments"><h2>{uk ? 'Легендарні моменти' : 'Memorable moments'}</h2>
    {moments ? <div className={styles.momentGrid}>{moments.map(moment => {
      const matches = history.filter(race => race.season_year === moment.year);
      const race = matches.length === 1 ? matches[0] : null;
      return <article className={styles.momentCard} key={moment.id} data-moment-id={moment.id}>
        <span className={styles.year}>{moment.year}</span><h3>{moment.title[locale]}</h3><p>{moment.text[locale]}</p>
        {race && <><Link href={`/races/${race.race_id}`}>{uk ? 'Гонка' : 'Race'} · {race.race_date ?? race.season_year} ↗</Link>
          <p><small>{uk ? 'Переможці гонки' : 'Race winners'}: {race.winners.map((winner, index) => <span key={`${winner.driver_id}:${winner.constructor_id}`}>{index > 0 && ' · '}<Link href={`/drivers/${winner.driver_id}`}>{winner.driver_name}</Link> / <Link href={`/constructors/${winner.constructor_id}`}>{winner.constructor_name}</Link></span>)}</small></p></>}
        <details><summary>{uk ? 'Джерело сюжету' : 'Story source'}</summary><a href={moment.source} target="_blank" rel="noopener noreferrer">{uk ? 'Відкрити джерело' : 'Open source'} · {moment.locator} ↗</a></details>
      </article>;
    })}</div> : <p>{uk ? 'Окремої добірки визначних подій поки немає. Усі відомі результати доступні нижче.' : 'A dedicated selection of significant moments is not available yet. Browse all available results below.'}</p>}
    {moments && <ReviewDetails locale={locale} />}
  </div>;
}
