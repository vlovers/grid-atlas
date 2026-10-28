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
