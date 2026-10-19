import { notFound } from 'next/navigation';

export type FocusKind = 'driver' | 'constructor';
type Counts = { result_entries: number; races: number; winning_races: number };
export type ComparedNeighbor = {
  entity_type: FocusKind; entity_id: string; name: string;
  from: Counts | null; to: Counts | null;
};
export type SeasonComparison = {
  focus: { entity_type: FocusKind; entity_id: string; name: string };
  from_year: number; to_year: number;
  added: ComparedNeighbor[]; removed: ComparedNeighbor[]; unchanged: ComparedNeighbor[];
  provenance: 'imported-main-race-results'; limitations: string[];
};
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
export const validId = (v: string) =>
  /^[1-9][0-9]{0,18}$/.test(v) && BigInt(v) <= 9223372036854775807n;
export const validYear = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9]{4}$/.test(v) && Number(v) >= 1950 && Number(v) <= 2200;
const count = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0;
const fail = (): never => { throw new Error('Invalid Time Machine response'); };
const metrics = (v: unknown): v is Counts =>
  object(v) && count(v.result_entries) && count(v.races) && count(v.winning_races) &&
  (v.races as number) <= (v.result_entries as number) &&
  (v.winning_races as number) <= (v.races as number);
export function parseComparison(payload: unknown, kind: FocusKind, id: string,
  fromYear: number, toYear: number): SeasonComparison {
  if (!object(payload) || !object(payload.data)) fail();
  const data = payload.data;
  if (!object(data.focus) || data.focus.entity_type !== kind ||
      data.focus.entity_id !== id || typeof data.focus.name !== 'string' || !data.focus.name.trim() ||
      data.from_year !== fromYear || data.to_year !== toYear ||
      data.provenance !== 'imported-main-race-results' ||
      !Array.isArray(data.limitations) || !data.limitations.every(v => typeof v === 'string' && v.length > 0)) fail();
  const neighborType = kind === 'driver' ? 'constructor' : 'driver';
  const seen = new Set<string>();
  for (const status of ['added','removed','unchanged'] as const) {
    const rows = data[status];
    if (!Array.isArray(rows) || rows.length > 500) fail();
    for (const n of rows) {
      if (!object(n) || n.entity_type !== neighborType || typeof n.entity_id !== 'string' ||
        !validId(n.entity_id) || seen.has(n.entity_id) ||
        typeof n.name !== 'string' || !n.name.trim() ||
        (n.from !== null && !metrics(n.from)) ||
        (n.to !== null && !metrics(n.to))) fail();
      if ((status === 'added' && (n.from !== null || n.to === null)) ||
          (status === 'removed' && (n.from === null || n.to !== null)) ||
          (status === 'unchanged' && (n.from === null || n.to === null))) fail();
      seen.add(n.entity_id);
    }
  }
  if (seen.size > 500) fail();
  return data as unknown as SeasonComparison;
}

const apiBase = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
export async function getSeasonComparison(kind: FocusKind, id: string,
  fromYear: number, toYear: number): Promise<SeasonComparison> {
  const type = kind === 'driver' ? 'drivers' : 'constructors';
  const path = `/api/explorer/${type}/${encodeURIComponent(id)}/compare?fromYear=${fromYear}&toYear=${toYear}`;
  let response: Response;
  try {
    response = await fetch(new URL(path, apiBase), { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  } catch (error) {
    throw new Error('Time Machine temporarily unavailable', { cause: error });
  }
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Time Machine API status ${response.status}`);
  return parseComparison(await response.json(), kind, id, fromYear, toYear);
}
