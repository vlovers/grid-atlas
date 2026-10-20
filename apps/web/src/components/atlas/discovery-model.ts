/** Derivations from the imported public archive, never from the current calendar. */
export function seasonDecades(seasons: readonly { year: number }[]) {
  const years = [...new Set(seasons.map(s => s.year))].filter(y => Number.isInteger(y) && y >= 1950 && y <= 2200).sort((a, b) => a - b);
  return [...new Set(years.map(y => Math.floor(y / 10) * 10))].map(decade => ({ decade, years: years.filter(y => y >= decade && y < decade + 10) }));
}

export function featuredIdentities<T extends { id: string; external_id: string }>(curated: readonly (T | undefined)[], fallback: readonly T[]) {
  const unique = new Map<string, T>();
  for (const record of [...curated, ...fallback]) if (record && !unique.has(record.id)) unique.set(record.id, record);
  return [...unique.values()].slice(0, 3);
}

/** Keep gaps visible: position comes from the year, not array order. */
export function careerSignature(seasons: readonly { year: number; starts: number; wins: number }[]) {
  const sorted = [...seasons].sort((a, b) => a.year - b.year);
  const first = sorted[0]?.year ?? 0;
  const span = Math.max(1, (sorted.at(-1)?.year ?? first) - first);
  const maximum = Math.max(1, ...sorted.map(s => s.starts));
  return sorted.map(s => ({ ...s, x: 24 + (s.year - first) / span * 452,
    entriesHeight: s.starts / maximum * 150, winsHeight: s.wins / maximum * 150 }));
}
