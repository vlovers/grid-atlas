import type { CircuitLayout, CircuitTechnicalEvent } from '../circuit-experience';

export type CircuitRaceRecord = {
  race_id: string; season_year: number; round: number; race_date: string | null; race_name: string;
  recorded_drivers: number; recorded_constructors: number; winner_entries: number;
  winners: { driver_id: string; driver_name: string; constructor_id: string; constructor_name: string }[];
};

/** Join exact event identities. An available modern layout is never a period fallback. */
export function circuitReadingModel(history: readonly CircuitRaceRecord[], layouts: readonly CircuitLayout[],
  events: readonly CircuitTechnicalEvent[], requestedRace?: string) {
  const seen = new Set<string>();
  const records = [...history].sort((a, b) => a.season_year - b.season_year || a.round - b.round)
    .filter(race => { if (seen.has(race.race_id)) return false; seen.add(race.race_id); return true; })
    .map(race => {
      const matches = events.filter(event => event.race_id === race.race_id && event.season_year === race.season_year && event.round === race.round);
      const event = matches.length === 1 ? matches[0] : null;
      const layout = event?.layout_id && event.external_layout_id ? layouts.find(row =>
        row.id === event.layout_id && row.external_layout_id === event.external_layout_id) ?? null : null;
      return { race, event, layout, measurementsDiffer: Boolean(event && layout &&
        (Number(event.course_length_km) !== Number(layout.length_km) || event.turns !== layout.turns)) };
    });
  const chapters = layouts.flatMap(layout => {
    const observations = records.filter(record => record.layout?.id === layout.id);
    if (!observations.length) return [];
    return [{ layout, observations, first: observations[0], last: observations.at(-1)! }];
  }).sort((a, b) => a.first.race.season_year - b.first.race.season_year || a.first.race.round - b.first.race.round);
  const candidates = [records[0], ...chapters.map(chapter => chapter.first), records[Math.floor((records.length - 1) / 2)], records.at(-1)]
    .filter((record, index, all): record is (typeof records)[number] => Boolean(record) && all.findIndex(item => item?.race.race_id === record!.race.race_id) === index)
    .sort((a, b) => a.race.season_year - b.race.season_year || a.race.round - b.race.round);
  const journey = candidates.length > 6 ? [...candidates.slice(0, 2), ...candidates.slice(Math.floor(candidates.length / 2) - 1, Math.floor(candidates.length / 2) + 1), ...candidates.slice(-2)] : candidates;
  return { records, chapters, journey, years: [...new Set(records.map(record => record.race.season_year))],
    selected: requestedRace ? records.find(record => record.race.race_id === requestedRace) ?? null : records.at(-1) ?? null,
    unknownRace: Boolean(requestedRace && !records.some(record => record.race.race_id === requestedRace)) };
}
export type CircuitReadingModel = ReturnType<typeof circuitReadingModel>;
