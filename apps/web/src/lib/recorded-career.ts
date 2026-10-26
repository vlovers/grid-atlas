/** A read-only projection of recorded associations. No contracts or missing years inferred. */
export type CareerObservation = { year: number; id: string; name: string; entries: number };
export type RecordedCareer = { id: string; name: string; kind: 'driver' | 'constructor'; years: number[]; observations: CareerObservation[] };
const validId = (v: unknown): v is string => typeof v === 'string' && /^[1-9][0-9]{0,18}$/.test(v) && BigInt(v) <= 9223372036854775807n;
const validYear = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1950 && v <= 2200;
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function recordedCareer(rows: unknown[], kind: RecordedCareer['kind'], id: string): RecordedCareer {
  const row = rows[0];
  if (!record(row) || row.id !== id || row.entity_type !== kind || typeof row.name !== 'string' || !row.name.trim() || !Array.isArray(row.participation)) throw new Error('Invalid recorded career identity');
  const seen = new Set<string>();
  const observations = row.participation.map((item: unknown): CareerObservation => {
    if (!record(item) || !validYear(item.year) || !validId(item.related_id) || typeof item.related_name !== 'string' || !item.related_name.trim() || typeof item.result_entries !== 'number' || !Number.isSafeInteger(item.result_entries) || item.result_entries < 1) throw new Error('Invalid recorded career association');
    const key = `${item.year}:${item.related_id}`;
    if (seen.has(key)) throw new Error('Duplicate recorded career association');
    seen.add(key);
    return { year: item.year, id: item.related_id, name: item.related_name, entries: item.result_entries };
  }).sort((a, b) => a.year - b.year || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  return { id, kind, name: row.name, years: [...new Set(observations.map(o => o.year))], observations };
}
export function suggestedComparisons(career: RecordedCareer, near?: number) {
  const { years, observations } = career;
  const pairs: { from: number; to: number; changed: boolean }[] = [];
  const signature = (year: number) => observations.filter(o => o.year === year).map(o => o.id).sort().join(',');
  for (let i = 1; i < years.length; i++) pairs.push({ from: years[i - 1], to: years[i], changed: signature(years[i - 1]) !== signature(years[i]) });
  // Prefer changes near the selected period, then adjacent recorded seasons. Never fill gaps.
  return pairs.sort((a, b) => Number(b.changed) - Number(a.changed) || (near === undefined ? b.to - a.to : Math.abs(a.to - near) - Math.abs(b.to - near))).slice(0, 6);
}
export function careerPartners(career: RecordedCareer) {
  const partners = new Map<string, { id: string; name: string; seasons: CareerObservation[] }>();
  for (const observation of career.observations) {
    const partner = partners.get(observation.id) ?? { id: observation.id, name: observation.name, seasons: [] };
    partner.seasons.push(observation);
    partners.set(observation.id, partner);
  }
  return [...partners.values()].sort((a, b) => a.seasons[0].year - b.seasons[0].year || a.name.localeCompare(b.name));
}
export function comparisonHref(locale: string, career: Pick<RecordedCareer, 'id' | 'kind'>, from: number, to: number) {
  return `/${locale}/time-machine?${new URLSearchParams({ kind: career.kind, id: career.id, from: String(from), to: String(to) })}`;
}

/** Shift an existing pair through adjacent recorded seasons; gaps are never filled. */
export function neighboringComparisons(career: RecordedCareer, from: number, to: number) {
  const left = career.years.indexOf(from), right = career.years.indexOf(to);
  if (left < 0 || right <= left) return [];
  return ([-1, 1] as const).flatMap(direction => {
    const a = left + direction, b = right + direction;
    return a >= 0 && b < career.years.length ? [{ from: career.years[a], to: career.years[b], direction }] : [];
  });
}
