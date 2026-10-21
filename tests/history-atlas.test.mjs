import test from "node:test";
import assert from "node:assert/strict";
import {
  atlasId,
  atlasYear,
  atlasHref,
  encodeTrail,
  parseTrail,
  pivotHref,
  parseAtlasCareer,
  profileHref,
} from "../apps/web/src/components/history-atlas/model.ts";
import { atlasLayout } from "../apps/web/src/components/history-atlas/flow-layout.ts";
import {
  parseExplorerGraph,
  parseConstructorExplorerGraph,
} from "../apps/web/src/lib/explorer-contract.ts";
import { historyAtlasCopy } from "../apps/web/src/components/history-atlas/copy.ts";
import { textViewParams } from "../apps/web/src/components/explorer/text-model.ts";

function graph(count, kind = "driver") {
  const other = kind === "driver" ? "constructor" : "driver";
  const focus = `${kind}:9007199254740993`;
  return {
    focus,
    year: 1988,
    nodes: [
      {
        key: focus,
        entity_id: "9007199254740993",
        name: "Synthetic focus",
        type: kind,
      },
      ...Array.from({ length: count }, (_, i) => ({
        key: `${other}:${i + 1}`,
        entity_id: String(i + 1),
        name: `Synthetic connection ${i}`,
        type: other,
      })),
    ],
    edges: Array.from({ length: count }, (_, i) => ({
      key: `${focus}:${other}:${i + 1}:year:1988`,
      from: focus,
      to: `${other}:${i + 1}`,
      year: 1988,
      relation_type:
        kind === "driver"
          ? "driver_recorded_result_for_constructor"
          : "constructor_recorded_result_with_driver",
      result_entries: 3,
      races: 2,
      winning_races: 0,
      provenance: "imported-result-association",
    })),
    source: {
      slug: "synthetic",
      homepage_url: "https://example.org",
      attribution: "Synthetic only",
    },
    truncated: count === 25,
    limit: 25,
    limitations: ["imported_race_results_only"],
  };
}
test("Atlas preserves exact BIGINT IDs and rejects unsafe IDs and years", () => {
  for (const id of ["1", "9007199254740993", "9223372036854775807"])
    assert.equal(atlasId(id), true);
  for (const id of ["0", "-1", "01", "9223372036854775808", "1/2", 1])
    assert.equal(atlasId(id), false);
  for (const year of [1950, 2200]) assert.equal(atlasYear(year), true);
  for (const year of [1949, 2201, 1988.1, "1988", NaN])
    assert.equal(atlasYear(year), false);
});
test("bounded shareable trail retains season and selected association in both directions", () => {
  const prior = {
    kind: "driver",
    id: "9007199254740993",
    year: 1988,
    selected: "2",
  };
  const url = new URL(
    pivotHref("uk", prior, { type: "constructor", entity_id: "2" }, []),
    "https://example.org",
  );
  assert.equal(url.searchParams.get("selected"), prior.id);
  assert.deepEqual(parseTrail(url.searchParams.get("trail")), [prior]);
  assert.equal(
    atlasHref("en", parseTrail(url.searchParams.get("trail"))[0]),
    "/en/atlas?kind=driver&id=9007199254740993&year=1988&selected=2",
  );
  const many = Array.from({ length: 12 }, (_, i) => ({
    ...prior,
    year: 1950 + i,
  }));
  assert.deepEqual(
    parseTrail(encodeTrail(many)).map((s) => s.year),
    [1956, 1957, 1958, 1959, 1960, 1961],
  );
});
test("malformed, overlong and foreign trail destinations fail closed", () => {
  for (const raw of [
    undefined,
    ["driver:1:1950:2"],
    "https://evil.example",
    "driver:1:1950:2:extra",
    "entrant:1:1950:2",
    "driver:01:1950:2",
    "driver:1:1949:2",
    "driver:1:1950:NaN",
    Array(7).fill("driver:1:1950:2").join(","),
    "x".repeat(1001),
  ])
    assert.deepEqual(parseTrail(raw), []);
});
test("career projection preserves observed gaps, deduplicates years and ships no archival result rows", () => {
  const source = {
    id: "2",
    name: "Synthetic",
    entity_type: "constructor",
    participation: [
      { year: 1955, related_id: "1", result_entries: 2 },
      { year: 1950, related_id: "2" },
      { year: 1955, related_id: "3" },
    ],
    editorial: { biography: "Must never reach the Atlas client" },
  };
  assert.deepEqual(parseAtlasCareer([source], "constructor", "2"), {
    id: "2",
    name: "Synthetic",
    entity_type: "constructor",
    years: [1950, 1955],
  });
  assert.deepEqual(
    parseAtlasCareer([{ ...source, participation: [] }], "constructor", "2")
      .years,
    [],
  );
  for (const change of [
    { id: 2 },
    { entity_type: "entrant" },
    { name: "" },
    { participation: [{ year: "1950", related_id: "1" }] },
    { participation: [{ year: 1950, related_id: 1 }] },
  ])
    assert.throws(() =>
      parseAtlasCareer([{ ...source, ...change }], "constructor", "2"),
    );
});
test("Dagre lays out bounded sparse and dense windows without overlapping nodes or changing API semantics", () => {
  for (const kind of ["driver", "constructor"])
    for (const count of [0, 1, 2, 8, 25]) {
      const original = graph(count, kind);
      const api = (
        kind === "driver" ? parseExplorerGraph : parseConstructorExplorerGraph
      )({ data: original }, "9007199254740993", 1988);
      const before = structuredClone(api);
      for (const size of [4, 8])
        for (let start = 0; start < Math.max(1, count); start += size) {
          const layout = atlasLayout(api, start, size);
          assert.ok(layout.nodes.length <= size + 1);
          assert.equal(
            layout.edges.length,
            Math.min(size, Math.max(0, count - start)),
          );
          assert.deepEqual(layout, atlasLayout(api, start, size));
          for (const a of layout.nodes) {
            assert.ok(Number.isFinite(a.x) && Number.isFinite(a.y));
            for (const b of layout.nodes)
              if (a.key !== b.key)
                assert.ok(
                  a.x + a.width <= b.x ||
                    b.x + b.width <= a.x ||
                    a.y + a.height <= b.y ||
                    b.y + b.height <= a.y,
                );
          }
          assert.ok(
            layout.edges.every(
              (e) =>
                e.from === api.focus &&
                e.provenance === "imported-result-association",
            ),
          );
        }
      assert.deepEqual(api, before);
    }
});
test("profile links honor the existing smaller legacy boundary without coercing graph identity", () => {
  assert.equal(
    profileHref("uk", "constructor", "2147483647"),
    "/uk/constructors/2147483647",
  );
  assert.equal(profileHref("en", "driver", "9007199254740993"), null);
});
test("Dagre mobile windows remain vertical, bounded and include the final loaded identity", () => {
  const g = graph(25);
  for (let start = 0; start < 25; start += 2) {
    const result = atlasLayout(g, start, 2, "TB");
    assert.ok(result.nodes.length <= 3);
    for (const node of result.nodes) {
      assert.ok(node.x >= 0 && node.y >= 0);
      for (const other of result.nodes)
        if (node.key !== other.key)
          assert.ok(
            node.y + node.height <= other.y || other.y + other.height <= node.y,
          );
    }
  }
  assert.equal(atlasLayout(g, 24, 2, "TB").edges[0].to, "constructor:25");
});
test("Atlas text fallback reuses bounded public Explorer readers and preserves pair selection", () => {
  const route = textViewParams(
    "/uk/atlas?kind=constructor&id=2&year=1950&selected=1",
  );
  assert.equal(route.locale, "uk");
  assert.equal(route.query.get("experience"), "network");
  assert.equal(route.query.get("selected"), "1");
  assert.equal(textViewParams("/en/atlas"), null);
});
test("complete UK/EN Atlas copy distinguishes claims, starts and missing evidence", () => {
  assert.deepEqual(
    Object.keys(historyAtlasCopy.en).sort(),
    Object.keys(historyAtlasCopy.uk).sort(),
  );
  assert.ok(Object.values(historyAtlasCopy.uk).every((s) => s.trim().length));
  assert.match(historyAtlasCopy.en.limitations, /not proof of official starts/);
  assert.match(historyAtlasCopy.en.lineageNote, /separate, reviewed claim/);
});
