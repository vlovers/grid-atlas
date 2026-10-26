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
    const corroboration = resultsByParticipantAndYear
      .filter(record => record.year === year)
      .map(record => ({ person: record.person, ids: [...new Set(record.rows.filter(row => row.round === round).map(row => row.race_id))] }))
      .filter(record => record.ids.length > 0);
    const unique = [...new Set(corroboration.flatMap(record => record.ids))];
    return { year, round, en, uk, id: unique.length === 1 ? unique[0] : null as string | null,
      verifiedBy: unique.length === 1 ? corroboration.filter(record => record.ids.length === 1 && record.ids[0] === unique[0]).length : 0 };
  });
});
