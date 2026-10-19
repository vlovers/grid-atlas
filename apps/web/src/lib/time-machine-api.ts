import { notFound } from 'next/navigation';
import { parseTimeMachineComparison, type TimeMachineComparison } from './time-machine-contract';

export type { TimeMachineAssociation, TimeMachineCount, TimeMachineComparison } from './time-machine-contract';
const base = process.env.API_BASE_URL || 'http://127.0.0.1:3001';
const validId = (value: string) => /^[1-9][0-9]{0,18}$/.test(value) &&
  BigInt(value) <= 9223372036854775807n;
const validYear = (value: number) => Number.isInteger(value) && value >= 1950 && value <= 2200;

export async function getTimeMachineComparison(
  kind: 'driver' | 'constructor', id: string, fromYear: number, toYear: number,
): Promise<TimeMachineComparison> {
  if (!validId(id) || !validYear(fromYear) || !validYear(toYear) || fromYear === toYear) {
    throw new Error('Invalid Time Machine comparison request');
  }
  const path = `/api/explorer/${kind}s/${encodeURIComponent(id)}/compare?${new URLSearchParams({ fromYear: String(fromYear), toYear: String(toYear) })}`;
  let response: Response;
  try {
    response = await fetch(new URL(path, base), { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  } catch (error) {
    console.error('Grid Atlas Time Machine request failed:', path, error);
    throw new Error('Time Machine data is temporarily unavailable.', { cause: error });
  }
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`Time Machine API status ${response.status}`);
  try {
    return parseTimeMachineComparison(await response.json(), kind, id, fromYear, toYear);
  } catch (error) {
    console.error('Grid Atlas Time Machine response invalid:', path, error);
    throw new Error('Time Machine data is temporarily unavailable.', { cause: error });
  }
}
