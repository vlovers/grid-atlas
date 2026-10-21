/** URL state contains canonical IDs, never names, API origins or return URLs. */
export type AtlasKind = "driver" | "constructor";
export type AtlasSelection = {
  kind: AtlasKind;
  id: string;
  year: number;
  selected?: string;
};
export const TRAIL_LIMIT = 6;
export const SEARCH_SIZE = 12;
export function atlasId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[1-9][0-9]{0,18}$/.test(value) &&
    BigInt(value) <= 9223372036854775807n
  );
}
export function atlasYear(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1950 &&
    value <= 2200
  );
}
export function encodeTrail(trail: readonly AtlasSelection[]) {
  return trail
    .slice(-TRAIL_LIMIT)
    .map((s) => `${s.kind}:${s.id}:${s.year}:${s.selected ?? ""}`)
    .join(",");
}
export function parseTrail(raw: unknown): AtlasSelection[] {
  if (typeof raw !== "string" || raw.length > 1000 || !raw) return [];
  const tokens = raw.split(",");
  if (tokens.length > TRAIL_LIMIT) return [];
  const trail: AtlasSelection[] = [];
  for (const token of tokens) {
    const [kind, id, year, selected, extra] = token.split(":");
    if (
      extra !== undefined ||
      (kind !== "driver" && kind !== "constructor") ||
      !atlasId(id) ||
      !/^\d{4}$/.test(year ?? "") ||
      !atlasYear(Number(year)) ||
      (selected !== "" && !atlasId(selected))
    )
      return [];
    trail.push({
      kind,
      id,
      year: Number(year),
      ...(selected ? { selected } : {}),
    });
  }
  return trail;
}
export function atlasHref(
  locale: "en" | "uk",
  selection: Partial<AtlasSelection> = {},
  trail: readonly AtlasSelection[] = [],
) {
  const q = new URLSearchParams();
  if (selection.kind) q.set("kind", selection.kind);
  if (selection.id) q.set("id", selection.id);
  if (selection.year !== undefined) q.set("year", String(selection.year));
  if (selection.selected) q.set("selected", selection.selected);
  if (trail.length) q.set("trail", encodeTrail(trail));
  return `/${locale}/atlas${q.size ? `?${q}` : ""}`;
}
export function pivotHref(
  locale: "en" | "uk",
  current: AtlasSelection,
  target: { type: AtlasKind; entity_id: string },
  trail: readonly AtlasSelection[],
) {
  return atlasHref(
    locale,
    {
      kind: target.type,
      id: target.entity_id,
      year: current.year,
      selected: current.id,
    },
    [...trail, current],
  );
}

export type AtlasCareer = {
  id: string;
  name: string;
  entity_type: AtlasKind;
  years: number[];
};
/** Project the existing career response on the server; never ship career tables to the map. */
export function parseAtlasCareer(
  rows: unknown[],
  kind: AtlasKind,
  id: string,
): AtlasCareer {
  const row = rows[0];
  if (
    !row ||
    typeof row !== "object" ||
    !("id" in row) ||
    row.id !== id ||
    !("name" in row) ||
    typeof row.name !== "string" ||
    !row.name.trim() ||
    !("entity_type" in row) ||
    row.entity_type !== kind ||
    !("participation" in row) ||
    !Array.isArray(row.participation)
  )
    throw new Error("Invalid Atlas career identity");
  const years = new Set<number>();
  for (const item of row.participation) {
    if (
      !item ||
      typeof item !== "object" ||
      !atlasYear(item.year) ||
      !atlasId(item.related_id)
    )
      throw new Error("Invalid Atlas participation");
    years.add(item.year);
  }
  return {
    id,
    name: row.name,
    entity_type: kind,
    years: [...years].sort((a, b) => a - b),
  };
}
/** Other profile routes still have a 32-bit API boundary. Do not emit a broken link. */
export function profileHref(locale: "en" | "uk", kind: AtlasKind, id: string) {
  return atlasId(id) && BigInt(id) <= 2147483647n
    ? `/${locale}/${kind === "driver" ? "drivers" : "constructors"}/${id}`
    : null;
}
