import 'server-only';
import { cache } from 'react';
import { releaseResults } from './release-data';
import { storyRaceCoordinates } from './editorial-race-coordinates';
import { resolveEditorialPeople } from './editorial-people-resolver';

/** Only race IDs confirmed by a canonical participant's year/round results are linked. */
export const resolveEditorialRaces = cache(async (slug: string) => {
  const coordinates = storyRaceCoordinates(slug);
  const people = await resolveEditorialPeople(slug);
  const primary = people.find(person => person.id);
  return Promise.all(coordinates.map(async ([year, round, en, uk]) => {
    if (!primary?.id) return { year, round, en, uk, id: null as string | null };
    try {
      const results = await releaseResults(primary.id, year);
      const ids = [...new Set(results.filter(row => row.round === round).map(row => row.race_id))];
      return { year, round, en, uk, id: ids.length === 1 ? ids[0] : null };
    } catch {
      return { year, round, en, uk, id: null as string | null };
    }
  }));
});
