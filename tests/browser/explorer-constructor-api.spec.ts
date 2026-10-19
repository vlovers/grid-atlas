import { test, expect } from '@playwright/test';

// Synthetic PostgreSQL fixtures: independent constructor and driver identities.
test('constructor one-hop results have distinct canonical driver edges and accurate counts', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:3339/api/explorer/constructors/1/connections?year=1950');
  expect(response.ok()).toBe(true);
  const { data } = await response.json();
  expect(data.focus).toBe('constructor:1');
  expect(data.year).toBe(1950);
  expect(data.nodes[0]).toMatchObject({ key: 'constructor:1', type: 'constructor', entity_id: '1' });
  expect(data.nodes.filter(node => node.type === 'driver')).toHaveLength(2);
  expect(data.edges).toHaveLength(2);
  expect(data.edges.map(edge => edge.to)).toEqual(['driver:1', 'driver:2']);
  for (const edge of data.edges) {
    expect(edge).toMatchObject({
      from: 'constructor:1',
      relation_type: 'constructor_recorded_result_with_driver',
      year: 1950, result_entries: 1, races: 1, winning_races: 1,
      provenance: 'imported-result-association',
    });
  }
  expect(data.truncated).toBe(false);
  expect(data.limit).toBe(25);
  expect(data.source.attribution).toContain('Synthetic');
  expect(data.limitations).toContain('result_association_not_official_starts');
});

test('constructor zero-result season returns identity focus with no inferred drivers', async ({ request }) => {
  const response = await request.get('http://127.0.0.1:3339/api/explorer/constructors/1/connections?year=1951');
  expect(response.ok()).toBe(true);
  const { data } = await response.json();
  expect(data.focus).toBe('constructor:1');
  expect(data.nodes).toHaveLength(1);
  expect(data.edges).toEqual([]);
});

test('constructor connections reject invalid season and missing identity', async ({ request }) => {
  expect((await request.get('http://127.0.0.1:3339/api/explorer/constructors/1/connections?year=1949')).status()).toBe(400);
  expect((await request.get('http://127.0.0.1:3339/api/explorer/constructors/0/connections?year=1950')).status()).toBe(400);
  expect((await request.get('http://127.0.0.1:3339/api/explorer/constructors/999999/connections?year=1950')).status()).toBe(404);
});
