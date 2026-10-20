import type { DriverCareer, DriverSeason } from '../driver/showcase-model';

/** A shared recorded season is a navigation pair, never a claim of rivalry. */
export function sharedSeason(a: readonly { year: number }[], b: readonly { year: number }[]) {
  const other = new Set(b.map(s => s.year));
  return a.map(s => s.year).filter(year => other.has(year)).sort((x, y) => y - x)[0] ?? null;
}
export function openingRecord(career: DriverCareer | null | undefined) {
  return career?.milestones.first_win ?? career?.milestones.first_appearance ?? null;
}
/** Always include genuine non-winning seasons; use recorded entries to find a starting point. */
export function seasonStories(seasons: readonly DriverSeason[]) {
  return [...seasons].sort((a, b) => b.wins - a.wins || b.starts - a.starts || a.year - b.year).slice(0, 3);
}
