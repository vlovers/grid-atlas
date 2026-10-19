import test from 'node:test';
import assert from 'node:assert/strict';
import { parseExplorerGraph } from '../apps/web/src/lib/explorer-contract.ts';

const fixture = () => ({
  data: {
    focus: 'driver:123', year: 1988,
    nodes: [
      { key: 'driver:123', type: 'driver', entity_id: '123', name: 'Fixture Driver' },
      { key: 'constructor:456', type: 'constructor', entity_id: '456', name: 'Fixture Constructor' },
    ],
    edges: [{
      key: 'driver:123:constructor:456:year:1988',
      from: 'driver:123', to: 'constructor:456',
      relation_type: 'driver_recorded_result_for_constructor', year: 1988,
      result_entries: 4, races: 3, winning_races: 1, provenance: 'imported-result-association',
    }],
    truncated: false, limit: 25,
    source: { slug: 'fixture', homepage_url: 'https://example.org', attribution: 'Synthetic fixture' },
    limitations: ['result_association_not_official_starts'],
  },
});
const parse = value => parseExplorerGraph(value, '123', 1988);
const invalid = change => {
  const value = fixture(); change(value.data);
  assert.throws(() => parse(value), /Malformed HX-01/);
};

test('accepts bounded observed-result graph without coercing string IDs', () => {
  const result = parse(fixture());
  assert.equal(result.nodes[1].entity_id, '456');
  assert.equal(result.edges[0].result_entries, 4);
});
test('accepts empty season with a single focus node', () => {
  const value = fixture(); value.data.nodes.pop(); value.data.edges.pop();
  assert.equal(parse(value).edges.length, 0);
});
test('rejects list payload and mismatched focus or season', () => {
  assert.throws(() => parse({ data: [] }), /Malformed HX-01/);
  invalid(g => { g.focus = 'driver:124'; });
  invalid(g => { g.year = 1989; });
});
test('rejects incorrect observed relationship semantics or provenance', () => {
  invalid(g => { g.edges[0].relation_type = 'driver_competed_for_constructor'; });
  invalid(g => { g.edges[0].provenance = 'editorial-lineage'; });
});
test('rejects duplicate or dangling graph identities', () => {
  invalid(g => { g.nodes.push(g.nodes[1]); });
  invalid(g => { g.edges.push(g.edges[0]); });
  invalid(g => { g.edges[0].to = 'constructor:999'; });
});
test('rejects malformed counts and invented participation', () => {
  invalid(g => { g.edges[0].races = 5; });
  invalid(g => { g.edges[0].result_entries = -1; });
  invalid(g => { g.nodes[1].entity_id = 456; });
});
test('rejects invalid truncation and oversized graph', () => {
  invalid(g => { g.truncated = true; });
  invalid(g => { g.limit = 0; });
});
test('supports exact BIGINT strings larger than Number.MAX_SAFE_INTEGER', () => {
  const value = fixture(); const id = '9007199254740993';
  value.data.focus = `driver:${id}`;
  value.data.nodes[0].key = `driver:${id}`;
  value.data.nodes[0].entity_id = id;
  value.data.edges[0].from = `driver:${id}`;
  value.data.edges[0].key = `driver:${id}:constructor:456:year:1988`;
  assert.equal(parseExplorerGraph(value, id, 1988).focus, `driver:${id}`);
});
