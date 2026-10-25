import 'server-only';
import { cache } from 'react';
import { getData, type Driver } from '@/lib/api';
import { storyPeopleFor } from './editorial-people';

/** Fail closed: only exact F1DB external IDs become links; names are never used as identity evidence. */
export const resolveEditorialPeople = cache(async (storySlug: string) => {
  const subjects = storyPeopleFor(storySlug);
  return Promise.all(subjects.map(async ([externalId, en, uk]) => {
    try {
      const catalogue = await getData<Driver>(`/api/drivers?q=${encodeURIComponent(externalId)}&limit=10&offset=0`);
      const exact = catalogue.filter(driver => driver.external_id === externalId);
      if (exact.length !== 1) return { externalId, en, uk, id: null };
      return { externalId, en, uk, id: exact[0].id };
    } catch {
      // The editorial draft must remain readable when the archive API is unavailable.
      return { externalId, en, uk, id: null };
    }
  }));
});
