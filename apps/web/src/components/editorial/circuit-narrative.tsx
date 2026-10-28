import { Link } from '@/i18n/navigation';
import { candidateCircuitNarratives } from './circuit-candidates';
import { legacyCircuitHistory } from './circuit-history-stories';
import { isCircuitEditionApproved } from './circuit-release';
import { getPublicCircuitStory, parseSingleCircuitYear, uniqueRaceInYear } from './circuit-public-moments';
import styles from './circuit-history-stories.module.css';

export const circuitNarratives = candidateCircuitNarratives;
export const hasPublicCircuitMoments = (id: string) => Boolean(legacyCircuitHistory[id]) || isCircuitEditionApproved(id) || Boolean(getPublicCircuitStory(id));
type Locale = 'en' | 'uk';
type Race = { race_id: string; season_year: number; race_name: string; race_date: string | null;
  winners: { driver_id: string; driver_name: string; constructor_id: string; constructor_name: string }[] };

function ReviewDetails({ locale }: { locale: Locale }) {
  return <details className={styles.review}><summary>{locale === 'uk' ? 'Про джерела добірки' : 'About the selection’s sources'}</summary><p>{locale === 'uk'
    ? 'Короткі перекази наведених джерел; перевірено за допомогою ШІ. Незалежне редакційне схвалення ще не отримано. Посилання на гонку показуємо лише тоді, коли архів однозначно визначає подію за роком; сюжети про кілька років не прив’язуємо до однієї гонки.'
    : 'Short summaries of the cited sources, checked with AI. Independent editorial approval remains pending. Race links appear only when the archive identifies exactly one event for the year; stories spanning several years are not linked to a single race.'}</p></details>;
}

export function CircuitBiography({ circuitId, locale }: { circuitId: string; locale: Locale }) {
  const candidate = circuitNarratives.find(entry => entry.circuit_id === circuitId);
  const approved = isCircuitEditionApproved(circuitId);
  const existing = legacyCircuitHistory[circuitId]?.[locale];
  const biography = approved ? candidate?.biography : existing ? { title: { en: existing.title, uk: existing.title }, text: { en: existing.introduction, uk: existing.introduction }, source: existing.moments[0]?.url } : undefined;
  const previous = getPublicCircuitStory(circuitId);
  const uk = locale === 'uk';
  return <div data-testid="circuit-biography"><h2>{uk ? 'Історія траси' : 'Circuit history'}</h2>
    {biography ? <><h3>{biography.title[locale]}</h3><p>{biography.text[locale]}</p><a href={biography.source} target="_blank" rel="noopener noreferrer">{uk ? 'Джерело · Formula 1' : 'Source · Formula 1'} ↗</a><ReviewDetails locale={locale} /></>
      : previous ? <p>{uk ? 'Коротку історію з посиланням на джерело зібрано в розділі «Легендарні моменти» нижче.' : 'Find this circuit’s short, source-linked story in Memorable moments below.'} <a href="#circuit-moments">{uk ? 'Перейти до історії ↓' : 'Jump to the story ↓'}</a></p>
        : <p>{uk ? 'Окремий нарис історії цієї траси ще не підготовлено. Нижче можна дослідити її конфігурації та Гран-прі.' : 'A dedicated circuit history is not available yet. Explore its layouts and Grands Prix below.'}</p>}
  </div>;
}

export function CircuitMoments({ circuitId, locale, history }: { circuitId: string; locale: Locale; history: Race[] }) {
  const existing = legacyCircuitHistory[circuitId]?.[locale];
  const featured = getPublicCircuitStory(circuitId);
  const moments = isCircuitEditionApproved(circuitId)
    ? circuitNarratives.find(entry => entry.circuit_id === circuitId)?.moments.map(moment => ({
        id: moment.id, yearLabel: String(moment.year), raceYear: moment.year,
        title: moment.title, text: moment.text, source: moment.source, locator: moment.locator,
      }))
    : existing?.moments.map((moment, index) => ({
        id: `${circuitId}-existing-${index}`, yearLabel: moment.year,
        raceYear: parseSingleCircuitYear(moment.year),
        title: { en: moment.title, uk: moment.title }, text: { en: moment.description, uk: moment.description },
        source: moment.url, locator: moment.year,
      })) ?? (featured ? [{
        id: `${circuitId}-featured`, yearLabel: featured.year,
        raceYear: parseSingleCircuitYear(featured.year),
        title: featured.title, text: featured.description, source: featured.source, locator: featured.year,
      }] : undefined);
  const uk = locale === 'uk';
  return <div data-testid="circuit-moments"><h2>{uk ? 'Легендарні моменти' : 'Memorable moments'}</h2>
    {moments ? <div className={styles.momentGrid}>{moments.map(moment => {
      const race = uniqueRaceInYear(history, moment.raceYear);
      return <article className={styles.momentCard} key={moment.id} data-moment-id={moment.id}>
        <span className={styles.year}>{moment.yearLabel}</span><h3>{moment.title[locale]}</h3><p>{moment.text[locale]}</p>
        {race && <><Link href={`/races/${race.race_id}`}>{uk ? 'Гонка' : 'Race'} · {race.race_date ?? race.season_year} ↗</Link>
          <p><small>{uk ? 'Переможці гонки' : 'Race winners'}: {race.winners.map((winner, index) => <span key={`${winner.driver_id}:${winner.constructor_id}`}>{index > 0 && ' · '}<Link href={`/drivers/${winner.driver_id}`}>{winner.driver_name}</Link> / <Link href={`/constructors/${winner.constructor_id}`}>{winner.constructor_name}</Link></span>)}</small></p></>}
        <details><summary>{uk ? 'Джерело сюжету' : 'Story source'}</summary><a href={moment.source} target="_blank" rel="noopener noreferrer">{uk ? 'Відкрити джерело' : 'Open source'} · {moment.locator} ↗</a></details>
      </article>;
    })}</div> : <p>{uk ? 'Окремої добірки визначних подій поки немає. Усі відомі результати доступні нижче.' : 'A dedicated selection of significant moments is not available yet. Browse all available results below.'}</p>}
    {moments && <ReviewDetails locale={locale} />}
  </div>;
}
