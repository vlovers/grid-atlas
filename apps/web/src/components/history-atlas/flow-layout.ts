import dagre from "@dagrejs/dagre";
import type { ExplorerGraph } from "../../lib/explorer-contract";
export const MAP_SIZE = 8;

/** Dagre owns geometry. Layout edges are ranks only, not historical direction. */
export function atlasLayout(
  graph: ExplorerGraph,
  start = 0,
  size = MAP_SIZE,
  direction: "LR" | "TB" = "LR",
) {
  const visible = graph.edges.slice(
    start,
    start + Math.max(1, Math.min(MAP_SIZE, size)),
  );
  const layout = new dagre.graphlib.Graph().setGraph({
    rankdir: direction,
    ranksep: direction === "TB" ? 58 : 135,
    nodesep: 34,
    marginx: 24,
    marginy: 24,
  });
  layout.setDefaultEdgeLabel(() => ({}));
  layout.setNode(graph.focus, { width: 256, height: 200 });
  for (const [index, edge] of visible.entries()) {
    layout.setNode(edge.to, { width: 220, height: 112 });
    // Two ranks around the focus give Dagre a central relationship hub.
    if (index % 2 === 0) layout.setEdge(edge.to, graph.focus);
    else layout.setEdge(graph.focus, edge.to);
  }
  dagre.layout(layout);
  return {
    nodes: [graph.focus, ...visible.map((e) => e.to)].map((key) => {
      const node = layout.node(key);
      return {
        key,
        x: node.x! - node.width / 2,
        y: node.y! - node.height / 2,
        width: node.width,
        height: node.height,
      };
    }),
    edges: visible.map((edge, index) => ({
      ...edge,
      side: index % 2 === 0 ? ("left" as const) : ("right" as const),
    })),
  };
}
