import test from "node:test";
import assert from "node:assert/strict";
import {
  networkPositions,
  networkPage,
  NETWORK_PAGE_SIZE,
  fitZoom,
  nodeLines,
} from "../apps/web/src/components/explorer/network-model.ts";
import {
  comparisonRows,
  eraSummary,
  comparisonWindow,
} from "../apps/web/src/app/[locale]/time-machine/comparison-model.ts";
import { explorerCopy } from "../apps/web/src/components/explorer/copy.ts";
import { machineCopy } from "../apps/web/src/app/[locale]/time-machine/copy.ts";

test("network positions fit sparse, medium and capped dense windows without label overlap", () => {
  for (const count of [0, 1, 2, 5, 8, 25, 34]) {
    const points = networkPositions(count);
    assert.equal(points.length, Math.min(count, NETWORK_PAGE_SIZE));
    assert.deepEqual(points, networkPositions(count));
    for (let i = 0; i < points.length; i++) {
      assert.ok(points[i].x - 124 >= 0 && points[i].x + 124 <= 1120);
      assert.ok(points[i].y - 54 >= 0 && points[i].y + 54 <= 720);
      for (let j = i + 1; j < points.length; j++)
        assert.ok(
          Math.abs(points[i].x - points[j].x) >= 248 ||
            Math.abs(points[i].y - points[j].y) >= 108,
        );
    }
  }
});
test("visual pagination includes the final API edge and never claims to contain omitted edges", () => {
  assert.equal(networkPage(0), 0);
  assert.equal(networkPage(24), 3);
  const ids = Array.from({ length: 25 }, (_, i) => String(i + 1));
  const rendered = Array.from({ length: 4 }, (_, p) =>
    ids.slice(p * 8, (p + 1) * 8),
  ).flat();
  assert.deepEqual(rendered, ids);
});
test("zoom is bounded and label wrapping is deterministic without mutating full identities", () => {
  assert.equal(fitZoom(0.1), 1);
  assert.equal(fitZoom(8), 2.5);
  assert.equal(fitZoom(1.256), 1.26);
  const name =
    "A very long historical constructor identity with several independent words";
  assert.ok(nodeLines(name).length <= 3);
  assert.ok(nodeLines(name).every((line) => line.length <= 25));
  assert.equal(
    name,
    "A very long historical constructor identity with several independent words",
  );
});
const counts = (entries, races, wins) => ({
  result_entries: entries,
  races,
  winning_races: wins,
});
const comparison = {
  added: [
    {
      entity_id: "9007199254740993",
      name: "Later",
      from: null,
      to: counts(2, 1, 0),
    },
  ],
  removed: [
    { entity_id: "2", name: "Earlier", from: counts(3, 2, 1), to: null },
  ],
  unchanged: [
    {
      entity_id: "3",
      name: "Both",
      from: counts(1, 1, 0),
      to: counts(4, 2, 0),
    },
  ],
};
test("comparison rows preserve exact BIGINT identity, null vs zero and every supported difference", () => {
  const rows = comparisonRows(comparison);
  assert.deepEqual(
    rows.map((r) => r.status),
    ["added", "removed", "unchanged"],
  );
  assert.equal(rows[0].entity_id, "9007199254740993");
  assert.equal(rows[0].from, null);
  assert.equal(rows[0].to.winning_races, 0);
  assert.equal(comparison.added[0].status, undefined);
});
test("era summary adds entries and association counts, never double-counts distinct races or winning races", () => {
  const rows = comparisonRows(comparison);
  assert.deepEqual(eraSummary(rows, "from"), {
    associations: 2,
    resultEntries: 4,
  });
  assert.deepEqual(eraSummary(rows, "to"), {
    associations: 2,
    resultEntries: 6,
  });
  assert.deepEqual(eraSummary([], "to"), { associations: 0, resultEntries: 0 });
});
test("comparison visual window stays bounded and exposes every loaded identity", () => {
  const rows = Array.from({ length: 31 }, (_, i) => ({
    entity_id: String(i + 1),
  }));
  assert.equal(comparisonWindow(rows, "31").start, 30);
  assert.equal(comparisonWindow(rows, "31").rows.length, 1);
  assert.equal(comparisonWindow([], "1").rows.length, 0);
});
test("Explorer and Time Machine controls have complete UK/EN copy with explicit historical boundaries", () => {
  for (const copy of [explorerCopy, machineCopy]) {
    assert.deepEqual(Object.keys(copy.en).sort(), Object.keys(copy.uk).sort());
    assert.ok(Object.values(copy.uk).every((s) => s.trim()));
  }
  assert.match(machineCopy.en.unknownNote, /not a zero count/);
  assert.match(explorerCopy.en.slice, /pagination/);
});

test("no-script route mapping preserves exact queries and rejects foreign destinations; HTML output escapes metadata", async () => {
  const { textViewParams, htmlText } = await import(
    "../apps/web/src/components/explorer/text-model.ts"
  );
  const mapped = textViewParams(
    "/uk/explorer/constructors/9007199254740993?year=1950&selected=2",
  );
  assert.equal(mapped.locale, "uk");
  assert.equal(mapped.query.get("id"), "9007199254740993");
  assert.equal(mapped.query.get("selected"), "2");
  assert.equal(
    textViewParams("https://attacker.example/en/time-machine"),
    null,
  );
  assert.equal(textViewParams("/en/drivers/1"), null);
  assert.equal(
    textViewParams(
      "/en/time-machine?kind=driver&id=1&from=1950&to=1951",
    ).query.get("experience"),
    "machine",
  );
  assert.equal(htmlText('<script>"&'), "&lt;script&gt;&quot;&amp;");
});

test("visible network counts and accessible names use matching EN/UK plural forms", async () => {
  const { recordCountLabel } = await import(
    "../apps/web/src/components/explorer/copy.ts"
  );
  assert.equal(recordCountLabel(1, "en", "races"), "1 race with results");
  assert.equal(recordCountLabel(2, "en", "entries"), "2 result entries");
  assert.equal(recordCountLabel(1, "uk", "races"), "1 гонка із результатами");
  assert.equal(recordCountLabel(2, "uk", "entries"), "2 записи результатів");
  assert.equal(recordCountLabel(5, "uk", "entries"), "5 записів результатів");
});
