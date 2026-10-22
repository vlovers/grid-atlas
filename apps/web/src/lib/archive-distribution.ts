export type ArchivePoint = { year: number; position?: number };

export type ArchiveDistribution = {
  keys: number[];
  counts: number[];
  first: number;
  last: number;
  maxCount: number;
};

export function archiveDistribution(entries: readonly ArchivePoint[], axis: 'year' | 'round'): ArchiveDistribution {
  const countsByKey = new Map<number, number>();
  for (const entry of entries) {
    const key = axis === 'round' ? entry.position : entry.year;
    if (key === undefined || !Number.isSafeInteger(key)) continue;
    countsByKey.set(key, (countsByKey.get(key) ?? 0) + 1);
  }
  const keys = [...countsByKey.keys()].sort((a, b) => a - b);
  const counts = keys.map(key => countsByKey.get(key)!);
  return {
    keys,
    counts,
    first: keys[0] ?? 0,
    last: keys[keys.length - 1] ?? 0,
    maxCount: Math.max(1, ...counts),
  };
}

export function archivePointPosition(key: number, first: number, last: number): number {
  if (first === last) return 50;
  return Math.max(0, Math.min(100, ((key - first) / (last - first)) * 100));
}
