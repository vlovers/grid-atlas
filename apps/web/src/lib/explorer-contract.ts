/**
 * Strict HX-01 response boundary. Do not infer official starts, employment or lineage
 * from imported result associations. Numeric database IDs stay decimal strings.
 */
export type ExplorerNode = {
  key: string; type: 'driver' | 'constructor'; entity_id: string; name: string;
};
export type ExplorerEdge = {
  key: string; from: string; to: string;
  relation_type: 'driver_recorded_result_for_constructor';
  year: number; result_entries: number; races: number; winning_races: number;
  provenance: 'imported-result-association';
};
export type ExplorerGraph = {
  focus: string; year: number; nodes: ExplorerNode[]; edges: ExplorerEdge[];
  truncated: boolean; limit: number;
  source: { slug: string; homepage_url: string; attribution: string };
  limitations: string[];
};
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const id = (value: unknown): value is string =>
  typeof value === 'string' && /^[1-9][0-9]{0,18}$/.test(value) &&
  BigInt(value) <= 9223372036854775807n;
const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const count = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const fail = (): never => { throw new Error('Malformed HX-01 Explorer response'); };

export function parseExplorerGraph(payload: unknown, driverId: string, year: number): ExplorerGraph {
  if (!id(driverId) || !Number.isInteger(year) || year < 1950 || year > 2200 || !record(payload) || !record(payload.data)) fail();
  const graph = payload.data;
  const focus = `driver:${driverId}`;
  if (graph.focus !== focus || graph.year !== year || !Array.isArray(graph.nodes) ||
      !Array.isArray(graph.edges) || typeof graph.truncated !== 'boolean' ||
      !count(graph.limit) || graph.limit < 1 || graph.limit > 25 ||
      !record(graph.source) || !nonempty(graph.source.slug) ||
      !nonempty(graph.source.homepage_url) || !nonempty(graph.source.attribution) ||
      !Array.isArray(graph.limitations) || !graph.limitations.every(nonempty)) fail();

  const nodes = new Map<string, ExplorerNode>();
  for (const item of graph.nodes) {
    if (!record(item) || (item.type !== 'driver' && item.type !== 'constructor') ||
        !id(item.entity_id) || item.key !== `${item.type}:${item.entity_id}` ||
        !nonempty(item.name) || nodes.has(item.key)) fail();
    nodes.set(item.key as string, item as ExplorerNode);
  }
  if (nodes.size === 0 || !nodes.has(focus) || nodes.get(focus)?.type !== 'driver' ||
      [...nodes.values()].filter(node => node.type === 'driver').length !== 1) fail();

  const edges = new Set<string>();
  for (const item of graph.edges) {
    if (!record(item) || !nonempty(item.key) || edges.has(item.key) ||
        item.from !== focus || typeof item.to !== 'string' ||
        nodes.get(item.to)?.type !== 'constructor' ||
        item.key !== `${focus}:${item.to}:year:${year}` ||
        item.relation_type !== 'driver_recorded_result_for_constructor' ||
        item.provenance !== 'imported-result-association' || item.year !== year ||
        !count(item.result_entries) || !count(item.races) || !count(item.winning_races) ||
        item.races > item.result_entries || item.winning_races > item.races) fail();
    edges.add(item.key);
  }
  if (edges.size > graph.limit || nodes.size !== edges.size + 1 ||
      (graph.truncated && edges.size !== graph.limit)) fail();
  return graph as ExplorerGraph;
}
