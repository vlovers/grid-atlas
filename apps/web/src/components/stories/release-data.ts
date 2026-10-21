import 'server-only';
import { cache } from 'react';
import { getData, type Driver } from '@/lib/api';
import type { DriverCareer, DriverProfile, DriverSeasonResult } from '@/components/driver/showcase-model';

/** Bounded canonical ID lookup. A similar name from another source is not a match. */
export const resolveReleaseDriver = cache(async (slug: string, locale: 'en' | 'uk') => {
  const catalogue = await getData<Driver>(`/api/drivers?q=${encodeURIComponent(slug)}&limit=10&offset=0`);
  const matches = catalogue.filter(d => d.external_id === slug);
  if (matches.length !== 1) return null;
  const id = matches[0].id;
  const [profiles, careers] = await Promise.all([
    getData<DriverProfile>(`/api/drivers/${id}`), getData<DriverCareer>(`/api/drivers/${id}/career?locale=${locale}`),
  ]);
  const profile = profiles[0], career = careers[0];
  if (!profile || !career || profile.external_id !== slug || career.external_id !== slug || career.id !== id || career.source_slug !== 'f1db') return null;
  return { profile, career };
});
export const releaseResults = cache((id: string, year: number) => getData<DriverSeasonResult>(`/api/drivers/${id}/seasons/${year}/results`));
