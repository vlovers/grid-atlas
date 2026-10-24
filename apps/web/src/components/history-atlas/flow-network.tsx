"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  ControlButton,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ExplorerGraph } from "@/lib/explorer-contract";
import { recordCountLabel } from "@/components/explorer/copy";
import { atlasLayout } from "./flow-layout";
import { historyAtlasCopy } from "./copy";
import styles from "./history-atlas.module.css";
type Identity = Node<{
  name: string;
  kind: string;
  core: boolean;
  year: number;
  entries?: number;
  entryLabel: string;
}>;
function IdentityNode({ data }: NodeProps<Identity>) {
  return (
    <div className={`${styles.identity} ${data.core ? styles.core : ""}`}>
      <Handle id="left-source" type="source" position={Position.Left} />
      <Handle id="right-source" type="source" position={Position.Right} />
      <Handle id="left-target" type="target" position={Position.Left} />
      <Handle id="right-target" type="target" position={Position.Right} />
      <Handle id="top-source" type="source" position={Position.Top} />
      <Handle id="bottom-source" type="source" position={Position.Bottom} />
      <Handle id="top-target" type="target" position={Position.Top} />
      <Handle id="bottom-target" type="target" position={Position.Bottom} />
      <span>{data.kind} </span>
      <strong>{data.name} </strong>
      {data.core ? <em>{data.year}</em> : <small>{data.entryLabel}</small>}
    </div>
  );
}
const nodeTypes = { identity: IdentityNode };
type Props = {
  graph: ExplorerGraph;
  locale: "en" | "uk";
  selected: string | undefined;
  onSelect: (id: string, inspect: boolean) => void;
};
function Canvas({ graph, locale, selected, onSelect }: Props) {
  const t = historyAtlasCopy[locale];
  const flow = useReactFlow();
  const [compact, setCompact] = useState(false);
  const [reduce, setReduce] = useState(true);
  const [page, setPage] = useState(0);
  const size = compact ? 2 : 8;
  const selectedIndex = graph.edges.findIndex(
    (e) => graph.nodes.find((n) => n.key === e.to)?.entity_id === selected,
  );
  useEffect(() => {
    const mq = matchMedia("(max-width: 650px)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setCompact(mq.matches);
      setReduce(motion.matches);
    };
    update();
    mq.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);
  useEffect(() => {
    setPage(Math.floor(Math.max(0, selectedIndex) / size));
  }, [selectedIndex, size]);
  const layout = useMemo(
    () => atlasLayout(graph, page * size, size, compact ? "TB" : "LR"),
    [graph, page, size, compact],
  );
  const nodes: Identity[] = layout.nodes.map((p) => {
    const entity = graph.nodes.find((n) => n.key === p.key)!;
    const edge = graph.edges.find((e) => e.to === p.key);
    const core = entity.key === graph.focus;
    return {
      id: entity.key,
      type: "identity",
      position: { x: p.x, y: p.y },
      width: p.width,
      height: p.height,
      data: {
        name: entity.name,
        kind: core ? t.focus : t[entity.type],
        core,
        year: graph.year,
        entries: edge?.result_entries,
        entryLabel: recordCountLabel(
          edge?.result_entries ?? 0,
          locale,
          "entries",
        ),
      },
      selected: !core && entity.entity_id === selected,
      draggable: false,
      selectable: !core,
      focusable: true,
      ariaRole: core ? "group" : "button",
      ariaLabel: core
        ? `${t.focus} ${entity.name} ${graph.year}`
        : `${t[entity.type]} ${entity.name} ${recordCountLabel(edge?.result_entries ?? 0, locale, "entries")}`,
      domAttributes: {
        "aria-roledescription": core ? t.focusNode : t.connectionNode,
        ...(core ? {} : { "aria-pressed": entity.entity_id === selected }),
      },
    };
  });
  const edges = layout.edges.map((e) => ({
    id: e.key,
    source: e.from,
    target: e.to,
    sourceHandle: `${compact ? (e.side === "left" ? "top" : "bottom") : e.side}-source`,
    targetHandle: `${compact ? (e.side === "left" ? "bottom" : "top") : e.side === "left" ? "right" : "left"}-target`,
    type: "default",
    animated:
      !reduce &&
      graph.nodes.find((n) => n.key === e.to)?.entity_id === selected,
    label: recordCountLabel(e.races, locale, "races"),
    ariaLabel: `${graph.nodes.find((n) => n.key === e.from)!.name} — ${graph.nodes.find((n) => n.key === e.to)!.name}. ${recordCountLabel(e.races, locale, "races")}`,
    domAttributes: { "aria-roledescription": t.connectionNode },
    style: {
      stroke:
        graph.nodes.find((n) => n.key === e.to)?.entity_id === selected
          ? "var(--accent-ink)"
          : "var(--muted)",
      strokeWidth: 1.6,
    },
    labelStyle: { fill: "var(--ink)", fontSize: 14 },
    labelBgStyle: { fill: "var(--surface)", fillOpacity: 1 },
    labelBgPadding: [7, 5] as [number, number],
    focusable: false,
    selectable: false,
  }));
  useEffect(() => {
    void flow.fitView({
      padding: 0.13,
      duration: reduce ? 0 : 250,
      maxZoom: 1,
    });
  }, [flow, layout, reduce]);
  function selectNode(id: string, inspect: boolean) {
    const node = graph.nodes.find((n) => n.key === id);
    if (node && node.key !== graph.focus) onSelect(node.entity_id, inspect);
  }
  return (
    <>
      <div className={styles.mapToolbar}>
        <span>
          {t.window} {page + 1} /{" "}
          {Math.max(1, Math.ceil(graph.edges.length / size))}
        </span>
        <div>
          <button
            aria-label={t.previousMap}
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            ←
          </button>
          <button
            aria-label={t.nextMap}
            disabled={(page + 1) * size >= graph.edges.length}
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
          <a href="#atlas-connections">{t.list} ↓</a>
        </div>
      </div>
      <div
        className={styles.canvas}
        data-testid="atlas-canvas"
        role="region"
        aria-label={t.map}
        aria-describedby="atlas-map-help"
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          colorMode="dark"
          fitView
          fitViewOptions={{ padding: 0.13, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          deleteKeyCode={null}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          zoomOnScroll={false}
          autoPanOnNodeFocus
          onNodeClick={(_, n) => selectNode(n.id, true)}
          onNodesChange={(changes) => {
            for (const change of changes)
              if (change.type === "select" && change.selected)
                selectNode(change.id, false);
          }}
          ariaLabelConfig={{
            "node.a11yDescription.default": t.help,
            "node.a11yDescription.keyboardDisabled": t.help,
            "controls.ariaLabel": t.map,
            "controls.zoomIn.ariaLabel": t.zoomIn,
            "controls.zoomOut.ariaLabel": t.zoomOut,
            "controls.fitView.ariaLabel": t.fit,
          }}
        >
          <Background color="var(--line)" gap={28} size={1} />
          <Controls
            showInteractive={false}
            fitViewOptions={{
              padding: 0.13,
              duration: reduce ? 0 : 250,
              maxZoom: 1,
            }}
          >
            <ControlButton
              title={t.reset}
              aria-label={t.reset}
              onClick={() =>
                flow.fitView({
                  padding: 0.13,
                  duration: reduce ? 0 : 250,
                  maxZoom: 1,
                })
              }
            >
              ↺
            </ControlButton>
          </Controls>
        </ReactFlow>
      </div>
      <p id="atlas-map-help" className={styles.help}>
        {t.help}
      </p>
    </>
  );
}
export default function FlowNetwork(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
