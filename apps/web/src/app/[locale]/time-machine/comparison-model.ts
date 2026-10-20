import type {
  TimeMachineAssociation,
  TimeMachineComparison,
} from "@/lib/time-machine-contract";
export type ComparisonRow = TimeMachineAssociation & {
  status: "added" | "removed" | "unchanged";
};
export function comparisonRows(data: TimeMachineComparison): ComparisonRow[] {
  return (["added", "removed", "unchanged"] as const).flatMap((status) =>
    data[status].map((row) => ({ ...row, status })),
  );
}
/** Entries are additive. Distinct races/winning races across partners are NOT. */
export function eraSummary(
  rows: readonly ComparisonRow[],
  side: "from" | "to",
) {
  return {
    associations: rows.filter((row) => row[side] !== null).length,
    resultEntries: rows.reduce(
      (total, row) => total + (row[side]?.result_entries ?? 0),
      0,
    ),
  };
}
export function comparisonWindow(
  rows: readonly ComparisonRow[],
  selectedId: string,
  size = 6,
) {
  const index = Math.max(
    0,
    rows.findIndex((row) => row.entity_id === selectedId),
  );
  const start = Math.floor(index / size) * size;
  return { start, rows: rows.slice(start, start + size) };
}
