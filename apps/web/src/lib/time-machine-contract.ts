/** Strict response boundary for the bounded Time Machine comparison API. */
export type TimeMachineCount = { result_entries: number; races: number; winning_races: number };
export type TimeMachineAssociation = {
  entity_type: 'driver' | 'constructor';
  entity_id: string;
  name: string;
  from: TimeMachineCount | null;
  to: TimeMachineCount | null;
};
export type TimeMachineComparison = {
  focus: { entity_type: 'driver' | 'constructor'; entity_id: string; name: string };
  from_year: number;
  to_year: number;
  added: TimeMachineAssociation[];
  removed: TimeMachineAssociation[];
  unchanged: TimeMachineAssociation[];
  provenance: 'imported-main-race-results';
  limitations: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const validId = (value: unknown): value is string =>
  typeof value === 'string' && /^[1-9][0-9]{0,18}$/.test(value) &&
  BigInt(value) <= 9223372036854775807n;
const validCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const validYear = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1950 && value <= 2200;
const fail = (): never => { throw new Error('Malformed Time Machine comparison response'); };

export function parseTimeMachineComparison(
  payload: unknown, kind: 'driver' | 'constructor', id: string, fromYear: number, toYear: number,
): TimeMachineComparison {
  if (!validId(id) || !validYear(fromYear) || !validYear(toYear) || fromYear === toYear || !isRecord(payload)) fail();
  const envelope = payload as Record<string, unknown>;
  if (!isRecord(envelope.data)) fail();
  const data = envelope.data as Record<string, unknown>;
  if (!isRecord(data.focus)) fail();
  const focus = data.focus as Record<string, unknown>;
  if (focus.entity_type !== kind || focus.entity_id !== id || typeof focus.name !== 'string' || !focus.name.trim() ||
      data.from_year !== fromYear || data.to_year !== toYear ||
      data.provenance !== 'imported-main-race-results' || !Array.isArray(data.limitations) ||
      !data.limitations.every(value => typeof value === 'string' && value.length > 0)) fail();
  const groups = ['added', 'removed', 'unchanged'] as const;
  const allIds = new Set<string>();
  for (const group of groups) {
    if (!Array.isArray(data[group])) fail();
    for (const value of data[group] as unknown[]) {
      if (!isRecord(value)) fail();
      const association = value as Record<string, unknown>;
      if (association.entity_type !== (kind === 'driver' ? 'constructor' : 'driver') ||
          !validId(association.entity_id) || typeof association.name !== 'string' ||
          !association.name.trim() || allIds.has(association.entity_id)) fail();
      allIds.add(association.entity_id as string);
      const from = association.from;
      const to = association.to;
      const validCounts = (counts: unknown): counts is TimeMachineCount => {
        if (!isRecord(counts)) return false;
        const entries = counts.result_entries;
        const races = counts.races;
        const wins = counts.winning_races;
        return validCount(entries) && validCount(races) && validCount(wins) && entries >= races && wins <= races;
      };
      if (!(from === null || validCounts(from)) || !(to === null || validCounts(to))) fail();
      if (group === 'added' ? from !== null || to === null
        : group === 'removed' ? from === null || to !== null
          : from === null || to === null) fail();
    }
  }
  return data as unknown as TimeMachineComparison;
}
