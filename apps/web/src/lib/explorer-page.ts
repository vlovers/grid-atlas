import { notFound } from "next/navigation";
export type ConnectionPage = {
  focus: { entity_id: string; name: string; entity_type: string };
  neighbor_type: string;
  year: number;
  offset: number;
  limit: number;
  total: number;
  next_offset: number | null;
  neighbors: {
    entity_id: string;
    name: string;
    races: number;
    result_entries: number;
    winning_races: number;
  }[];
};
const id = (s: string) =>
  /^[1-9][0-9]{0,18}$/.test(s) && BigInt(s) <= 9223372036854775807n;
export async function getConnectionPage(
  kind: "drivers" | "constructors",
  focusId: string,
  year: number,
  offset: number,
): Promise<ConnectionPage> {
  if (
    !id(focusId) ||
    !Number.isInteger(year) ||
    year < 1950 ||
    year > 2200 ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > 100000
  )
    throw new Error("Invalid connection page request");
  const url = new URL(
    `/api/explorer/${kind}/${focusId}/connections/page`,
    process.env.API_BASE_URL || "http://127.0.0.1:3001",
  );
  url.searchParams.set("year", String(year));
  url.searchParams.set("offset", String(offset));
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Connection page temporarily unavailable");
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("data" in payload))
    throw new Error("Bad connection page");
  const data = (payload as { data: ConnectionPage }).data;
  if (
    !data ||
    !Array.isArray(data.neighbors) ||
    data.focus?.entity_id !== focusId ||
    typeof data.focus.name !== "string" ||
    data.focus.entity_type !==
      (kind === "drivers" ? "driver" : "constructor") ||
    data.neighbor_type !== (kind === "drivers" ? "constructor" : "driver") ||
    data.year !== year ||
    data.offset !== offset ||
    data.limit !== 25 ||
    !Number.isSafeInteger(data.total) ||
    data.total < 0 ||
    (data.next_offset !== null &&
      (!Number.isSafeInteger(data.next_offset) ||
        data.next_offset !== offset + 25)) ||
    data.neighbors.length > 25 ||
    data.neighbors.some(
      (n) =>
        !id(n.entity_id) ||
        typeof n.name !== "string" ||
        ![n.races, n.result_entries, n.winning_races].every(
          (v) => Number.isSafeInteger(v) && v >= 0,
        ) ||
        n.races > n.result_entries ||
        n.winning_races > n.races,
    )
  )
    throw new Error("Bad connection page");
  return data;
}
