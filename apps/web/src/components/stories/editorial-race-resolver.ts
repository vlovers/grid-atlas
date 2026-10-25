import 'server-only';
import { cache } from 'react';
import { releaseResults } from './release-data';
import { storyRaceCoordinates } from './editorial-race-coordinates';
import { resolveEditorialPeople } from './editorial-people-resolver';

/** A race link requires a unique canonical race ID from a participant's recorded year/round.
 *  Multiple protagonists can corroborate the same race; conflicting IDs fail closed.
 */
export const resolveEditorialRaces = cache(async (slug: string) => {
  const coordinates = storyRaceCoordinates(slug);
  const people = await resolveEditorialPeople(slug);
  const participants = people.filter(person => person.id);
  const years = [...new Set(coordinates.map(([year]) => year))];
  const resultsByParticipantAndYear = await Promise.all(participants.flatMap(person => years.map(async year => {
    try {
      const rows = await releaseResults(person.id!, year);
      return { year, person: person.externalId, rows };
    } catch {
      return { year, person: person.externalId, rows: [] };
    }
  })));

  return coordinates.map(([year, round, en, uk]) => {
    const matching = resultsByParticipantAndYear
      .filter(record => record.year === year)
      .flatMap(record => record.rows.filter(row => row.round === round).map(row => row.race_id));
    const unique = [...new Set(matching)];
    return { year, round, en, uk, id: unique.length === 1 ? unique[0] : null as string | null,
      verifiedBy: matching.length > 0 && unique.length === 1 ? matching.length : 0 };
  });
});
