/** Public profile/career API fields only. No editorial or championship inference. */
export type DriverProfile = { id: string; name: string; external_id: string; seasons: number;
  first_season: number | null; last_season: number | null; wins: number; podiums: number };
export type DriverSeason = { year: number; starts: number; wins: number; podiums: number; points: string };
export type DriverSeasonResult = { race_id: string; round: number; race_date: string | null; race_name: string;
  constructor_id: string; constructor_name: string; position_display_order: number; position_number: number | null;
  position_text: string; points: string | null; laps: number | null; reason_retired: string | null; shared_car: boolean };
export type DriverTeam = { year: number; constructor_id: string; constructor_name: string; races: number; wins: number };
export type CareerRace = { id: string; year: number; round: number; name: string; date: string | null; circuit_id: string | null };
export type CareerResult = { driver_id: string; constructor_id: string; position_display_order: number;
  position_number: number | null; position_text: string; points: string | null; shared_car: boolean; reason_retired: string | null };
export type RaceMoment = { race: CareerRace; results: CareerResult[] };
export type Participation = { year: number; related_id: string; related_name: string; races: number;
  result_entries: number; winning_races: number; recorded_points: string | null; points_missing: number;
  first_race: CareerRace; last_race: CareerRace };
export type DriverCareer = {
  id: string; external_id: string;
  summary: { result_entries: number; races: number; seasons: number; first_season: number | null;
    last_season: number | null; winning_races: number; podium_result_entries: number;
    recorded_points: string | null; points_missing: number };
  participation: Participation[];
  milestones: { first_appearance: RaceMoment | null; first_win: RaceMoment | null;
    last_win: RaceMoment | null; last_appearance: RaceMoment | null };
  source_slug: string; source_url: string; attribution: string;
  observations: { release_tag: string; artifact_name: string; sha256: string }[];
};
export type TeamEra = { key: string; id: string; name: string; years: number[]; rows: Participation[] };

/** Split gaps and returns to a constructor; ranges never fill unobserved seasons. */
export function teamEras(rows: readonly Participation[]): TeamEra[] {
  const byTeam = new Map<string, Participation[]>();
  for (const row of rows) byTeam.set(row.related_id, [...(byTeam.get(row.related_id) ?? []), row]);
  const eras: TeamEra[] = [];
  for (const [id, group] of byTeam) {
    let era: TeamEra | undefined;
    for (const row of [...group].sort((a, b) => a.year - b.year)) {
      if (!era || row.year > era.years.at(-1)! + 1) {
        era = { key: `${id}:${row.year}`, id, name: row.related_name, years: [], rows: [] };
        eras.push(era);
      }
      if (!era.years.includes(row.year)) era.years.push(row.year);
      era.rows.push(row);
    }
  }
  return eras.sort((a, b) => a.years[0] - b.years[0] ||
    a.rows[0].first_race.round - b.rows[0].first_race.round || a.id.localeCompare(b.id));
}

/** Keep every result from an exact API milestone; combine repeated race IDs. */
export function raceMoments(milestones: DriverCareer['milestones']) {
  const moments = new Map<string, RaceMoment & { labels: (keyof DriverCareer['milestones'])[] }>();
  for (const label of ['first_appearance', 'first_win', 'last_win', 'last_appearance'] as const) {
    const value = milestones[label];
    if (!value) continue;
    const previous = moments.get(value.race.id);
    if (previous) previous.labels.push(label);
    else moments.set(value.race.id, { ...value, labels: [label] });
  }
  return [...moments.values()].sort((a, b) => a.race.year - b.race.year || a.race.round - b.race.round);
}

/** Rank observed result entries, NOT championship standings or counted points. */
export function seasonMilestones(seasons: readonly DriverSeason[]) {
  return [...seasons].filter(s => s.wins > 0).sort((a, b) => b.wins - a.wins || a.year - b.year).slice(0, 3);
}

export function seasonPoints(season: DriverSeason, participation: readonly Participation[]) {
  const rows = participation.filter(row => row.year === season.year);
  return { value: rows.length && rows.every(row => row.recorded_points === null) ? null : season.points,
    partial: rows.some(row => row.points_missing > 0) };
}

export function timeMachinePath(id: string, years: readonly number[]) {
  const sorted = [...new Set(years)].sort((a, b) => a - b);
  return sorted.length > 1 ? `/time-machine?${new URLSearchParams({ kind: 'driver', id,
    from: String(sorted[0]), to: String(sorted.at(-1)) })}` : null;
}
