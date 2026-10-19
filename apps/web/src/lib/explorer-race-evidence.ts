import { notFound } from 'next/navigation';

export type EvidenceRace = {
  race_id: string;
  round: number;
  race_date: string | null;
  official_name: string;
  result_entries: number;
  winning_result_entries: number;
};
export type PairRaceEvidence = {
  driver: { id: string; name: string };
  constructor: { id: string; name: string };
  year: number;
  races: EvidenceRace[];
  truncated: boolean;
  limit: number;
  provenance: 'imported-main-race-results';
  limitations: string[];
};

const base = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const positiveId = (v: unknown): v is string =>
  typeof v === 'string' && /^[1-9][0-9]{0,18}$/.test(v) &&
  BigInt(v) <= 9223372036854775807n;
const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const count = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const fail = (): never => { throw new Error('Malformed Explorer race evidence response'); };

export function parsePairRaceEvidence(payload: unknown, driverId: string, constructorId: string, year: number): PairRaceEvidence {
  if (!positiveId(driverId) || !positiveId(constructorId) ||
    !Number.isInteger(year) || year < 1950 || year > 2200 || !record(payload)) fail();
  const data: unknown = payload.data;
  if (!record(data)) fail();
  if (!record(data.driver) || !record(data.constructor) ||
    data.driver.id !== driverId || data.constructor.id !== constructorId ||
    !text(data.driver.name) || !text(data.constructor.name) ||
    data.year !== year || data.provenance !== 'imported-main-race-results' ||
    typeof data.truncated !== 'boolean' || data.limit !== 100 ||
    !Array.isArray(data.races) || !Array.isArray(data.limitations) ||
    !data.limitations.every(text)) fail();
  const races: unknown[] = data.races as unknown[];
  const seen = new Set<string>();
  for (const item of races) {
    if (!record(item)) fail();
    const race = item as Record<string, unknown>;
    if (!positiveId(race.race_id) || seen.has(race.race_id) ||
      !count(race.round) || race.round < 1 || !text(race.official_name) ||
      !(race.race_date === null || typeof race.race_date === 'string') ||
      !count(race.result_entries) || race.result_entries < 1 ||
      !count(race.winning_result_entries) || race.winning_result_entries > race.result_entries) fail();
    seen.add(race.race_id as string);
  }
  if (races.length > 100 || (data.truncated && races.length !== 100)) fail();
  return data as PairRaceEvidence;
}

export async function getPairRaceEvidence(driverId: string, constructorId: string, year: number): Promise<PairRaceEvidence> {
  if (!positiveId(driverId) || !positiveId(constructorId) || !Number.isInteger(year) || year < 1950 || year > 2200) fail();
  const path = `/api/explorer/drivers/${driverId}/constructors/${constructorId}/races?year=${year}`;
  let response: Response;
  try {
    response = await fetch(new URL(path, base), {
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    console.error('Grid Atlas race evidence request failed:', path, error);
    throw new Error('Race evidence temporarily unavailable.', { cause: error });
  }
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Race evidence API status ${response.status}`);
  try {
    const payload: unknown = await response.json();
    return parsePairRaceEvidence(payload, driverId, constructorId, year);
  } catch (error) {
    console.error('Grid Atlas race evidence invalid:', path, error);
    throw new Error('Race evidence temporarily unavailable.', { cause: error });
  }
}
