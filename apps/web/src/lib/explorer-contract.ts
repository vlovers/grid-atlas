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
  if (!id(driverId) || !Number.isInteger(year) || year < 1950 || year > 2200) fail();
  if (!record(payload)) fail();
  const envelope = payload as Record<string, unknown>;
  if (!record(envelope.data)) fail();
  const graph = envelope.data as Record<string, unknown>;
  const focus = `driver:${driverId}`;
  const graphNodes: unknown[] = Array.isArray(graph.nodes) ? graph.nodes : fail();
  const graphEdges: unknown[] = Array.isArray(graph.edges) ? graph.edges : fail();
  const graphLimit: number = count(graph.limit) ? graph.limit as number : fail();
  if (graph.focus !== focus || graph.year !== year ||
      typeof graph.truncated !== 'boolean' ||
      graphLimit < 1 || graphLimit > 25 ||
      !record(graph.source) || !nonempty(graph.source.slug) ||
      !nonempty(graph.source.homepage_url) || !nonempty(graph.source.attribution) ||
      !Array.isArray(graph.limitations) || !graph.limitations.every(nonempty)) fail();

  const nodes = new Map<string, ExplorerNode>();
  for (const item of graphNodes) {
    if (!record(item)) fail();
    const node = item as Record<string, unknown>;
    if ((node.type !== 'driver' && node.type !== 'constructor') ||
        !id(node.entity_id) || node.key !== `${node.type}:${node.entity_id}` ||
        !nonempty(node.name) || nodes.has(node.key)) fail();
    nodes.set(node.key as string, node as unknown as ExplorerNode);
  }
  if (nodes.size === 0 || !nodes.has(focus) || nodes.get(focus)?.type !== 'driver' ||
      [...nodes.values()].filter(node => node.type === 'driver').length !== 1) fail();

  const edges = new Set<string>();
  for (const item of graphEdges) {
    if (!record(item)) fail();
    const edge = item as Record<string, unknown>;
    if (!nonempty(edge.key) || edges.has(edge.key) ||
        edge.from !== focus || typeof edge.to !== 'string' ||
        nodes.get(edge.to)?.type !== 'constructor' ||
        edge.key !== `${focus}:${edge.to}:year:${year}` ||
        edge.relation_type !== 'driver_recorded_result_for_constructor' ||
        edge.provenance !== 'imported-result-association' || edge.year !== year ||
        !count(edge.result_entries) || !count(edge.races) || !count(edge.winning_races) ||
        edge.races > edge.result_entries || edge.winning_races > edge.races) fail();
    edges.add(edge.key as string);
  }
  if (edges.size > graphLimit || nodes.size !== edges.size + 1 ||
      (graph.truncated && edges.size !== graphLimit)) fail();
  return graph as unknown as ExplorerGraph;
}
