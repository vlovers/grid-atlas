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

export type CircuitStorySourceKind = 'f1db-results' | 'formula1-page' | 'other';

/** Classifies the linked evidence format, not the historical accuracy of a claim. */
export function circuitStorySourceKind(source: string): CircuitStorySourceKind {
  if (/^https:\/\/github\.com\/f1db\/f1db\/blob\/v2026\.17\.0\/src\/data\/seasons\/\d{4}\/races\/[^/]+\/race-results\.yml(?:#.*)?$/.test(source)) return 'f1db-results';
  if (/^https:\/\/www\.formula1\.com\/en\//.test(source)) return 'formula1-page';
  return 'other';
}

export function circuitStorySourcePresentation(source: string, locale: 'en' | 'uk') {
  const kind = circuitStorySourceKind(source);
  if (kind === 'f1db-results') return locale === 'uk'
    ? { badge: 'F1DB · результати', description: 'Файл результатів фіксує дані гонки. Деталі й контекст історії потребують окремої перевірки.', linkLabel: 'Відкрити результати' }
    : { badge: 'F1DB · results', description: 'The race-result file records race data. The story’s details and wider context require separate review.', linkLabel: 'Open race results' };
  if (kind === 'formula1-page') return locale === 'uk'
    ? { badge: 'Formula 1 · сторінка', description: 'Посилання веде на сторінку Formula 1. Воно не означає незалежного редакційного підтвердження кожного твердження.', linkLabel: 'Відкрити сторінку' }
    : { badge: 'Formula 1 · page', description: 'This links to a Formula 1 page; it does not mean every claim has received independent editorial verification.', linkLabel: 'Open source page' };
  return locale === 'uk'
    ? { badge: 'Зовнішнє джерело', description: 'Тип і відповідність цього джерела сюжету ще потребують перевірки.', linkLabel: 'Відкрити джерело' }
    : { badge: 'External source', description: 'This source’s type and relevance to the story still need review.', linkLabel: 'Open source' };
}
