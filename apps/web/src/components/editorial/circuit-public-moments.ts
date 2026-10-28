import facts from './circuit-extra-stories.json' with { type: 'json' };
import nextFacts from './circuit-next20-stories.json' with { type: 'json' };
import finalFacts from './circuit-final33-stories.json' with { type: 'json' };

type LocalizedText = { en: string; uk: string };
export type PublicCircuitStory = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  year: string;
  source: string;
};

/** Existing short, cited summaries, not independently approved longform editions. */
export const publicCircuitStories: readonly PublicCircuitStory[] = [...facts, ...nextFacts, ...finalFacts];
const storiesById = new Map(publicCircuitStories.map(story => [story.id, story]));

export function getPublicCircuitStory(id: string): PublicCircuitStory | undefined {
  return storiesById.get(id);
}

/** A range or multi-year label is not an archive race identifier. */
export function parseSingleCircuitYear(label: string): number | null {
  return /^\d{4}$/.test(label) ? Number(label) : null;
}

/** Never guess which race a historical moment refers to when a circuit hosted multiple events. */
export function uniqueRaceInYear<T extends { season_year: number }>(races: readonly T[], year: number | null): T | null {
  if (year === null || !Number.isInteger(year)) return null;
  let match: T | null = null;
  for (const race of races) {
    if (race.season_year !== year) continue;
    if (match) return null;
    match = race;
  }
  return match;
}

export type CircuitStorySourceKind =
  | 'f1db-results'
  | 'formula1-results'
  | 'formula1-circuit-guide'
  | 'formula1-feature'
  | 'formula1-event-page'
  | 'other';

/** URL format classification only: no claim-level source verification or approval. */
export function circuitStorySourceKind(source: string): CircuitStorySourceKind {
  if (/^https:\/\/github\.com\/f1db\/f1db\/blob\/v2026\.17\.0\/src\/data\/seasons\/\d{4}\/races\/[^/]+\/race-results\.yml(?:#.*)?$/.test(source)) return 'f1db-results';
  let url: URL;
  try { url = new URL(source); } catch { return 'other'; }
  if (url.protocol !== 'https:' || url.hostname !== 'www.formula1.com') return 'other';
  if (/^\/en\/results\/\d{4}\/races\/\d+\/[^/]+\/race-result\/?$/.test(url.pathname)) return 'formula1-results';
  if (/^\/en\/information\/[^/]+\/?$/.test(url.pathname)) return 'formula1-circuit-guide';
  if (/^\/en\/latest\/article\/[^/]+\/?$/.test(url.pathname)) return 'formula1-feature';
  if (/^\/en\/racing\/\d{4}\/[^/]+\/?$/.test(url.pathname)) return 'formula1-event-page';
  return 'other';
}

type SourcePresentation = { badge: string; description: string; linkLabel: string };
const sourcePresentations: Record<CircuitStorySourceKind, Record<'en' | 'uk', SourcePresentation>> = {
  'f1db-results': {
    en: { badge: 'F1DB · results', description: 'The race-result file records classification data, not the weather, accidents or wider story. Context needs separate review.', linkLabel: 'Open race results' },
    uk: { badge: 'F1DB · результати', description: 'Файл результатів фіксує класифікацію, а не погоду, аварії чи повний перебіг подій. Контекст потребує окремої перевірки.', linkLabel: 'Відкрити результати' },
  },
  'formula1-results': {
    en: { badge: 'F1 · race results', description: 'The official race classification supports recorded results, not every circumstance described in the story.', linkLabel: 'Open race classification' },
    uk: { badge: 'Ф1 · результати гонки', description: 'Офіційний протокол підтверджує результати, але не всі обставини, описані в історії.', linkLabel: 'Відкрити протокол гонки' },
  },
  'formula1-circuit-guide': {
    en: { badge: 'F1 · circuit guide', description: 'A circuit overview may describe several eras. It is not a race-by-race historical record or independent fact approval.', linkLabel: 'Open circuit guide' },
    uk: { badge: 'Ф1 · довідка про трасу', description: 'Огляд траси може охоплювати різні епохи. Це не протокол окремої гонки й не незалежне схвалення фактів.', linkLabel: 'Відкрити довідку' },
  },
  'formula1-feature': {
    en: { badge: 'F1 · historical article', description: 'A Formula 1 editorial account provides historical context. Individual claims and translations still require independent review.', linkLabel: 'Read historical article' },
    uk: { badge: 'Ф1 · історична стаття', description: 'Редакційний матеріал Formula 1 дає історичний контекст. Окремі твердження й переклад ще потребують незалежної перевірки.', linkLabel: 'Читати історичну статтю' },
  },
  'formula1-event-page': {
    en: { badge: 'F1 · event page', description: 'A season-specific event page may describe the circuit, but must not be treated as a contemporary record of a different year.', linkLabel: 'Open event page' },
    uk: { badge: 'Ф1 · сторінка етапу', description: 'Сторінка етапу певного сезону може описувати трасу, але не є протоколом гонки іншого року.', linkLabel: 'Відкрити сторінку етапу' },
  },
  other: {
    en: { badge: 'External source', description: 'The source type and its relevance to the story have not been established.', linkLabel: 'Open source' },
    uk: { badge: 'Зовнішнє джерело', description: 'Тип джерела та його відповідність історії ще не встановлені.', linkLabel: 'Відкрити джерело' },
  },
};

export function circuitStorySourcePresentation(source: string, locale: 'en' | 'uk'): SourcePresentation {
  return sourcePresentations[circuitStorySourceKind(source)][locale];
}
