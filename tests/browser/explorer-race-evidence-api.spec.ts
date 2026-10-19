import { test, expect } from '@playwright/test';

// Owned synthetic PostgreSQL schema, not a real historical source.
const base = 'http://127.0.0.1:3339/api/explorer/drivers';
test('observed pair returns the exact imported race and distinct result entries', async ({ request }) => {
  const res = await request.get(`${base}/1/constructors/1/races?year=1950`);
  expect(res.ok()).toBe(true);
  const { data } = await res.json();
  expect(data.driver).toMatchObject({ id: '1', name: 'driver-a' });
  expect(data.constructor).toMatchObject({ id: '1', name: 'alpha' });
  expect(data.year).toBe(1950);
  expect(data.races).toHaveLength(1);
  expect(data.races[0]).toMatchObject({
    race_id: '1', round: 1, official_name: 'Synthetic shared-car race',
    result_entries: 1, winning_result_entries: 1,
  });
  expect(data.truncated).toBe(false);
  expect(data.limit).toBe(100);
  expect(data.provenance).toBe('imported-main-race-results');
  expect(data.limitations).toContain('result_association_not_official_starts');
});

test('evidence has honest empty season and disjoint pair', async ({ request }) => {
  for (const url of [
    `${base}/1/constructors/1/races?year=1951`,
    `${base}/1/constructors/2/races?year=1950`,
  ]) {
    const response = await request.get(url);
    expect(response.ok()).toBe(true);
    const { data } = await response.json();
    expect(data.races).toEqual([]);
  }
});
test('evidence rejects unknown identity, invalid bounds and malformed year', async ({ request }) => {
  expect((await request.get(`${base}/999999/constructors/1/races?year=1950`)).status()).toBe(404);
  expect((await request.get(`${base}/1/constructors/999999/races?year=1950`)).status()).toBe(404);
  expect((await request.get(`${base}/0/constructors/1/races?year=1950`)).status()).toBe(400);
  expect((await request.get(`${base}/1/constructors/1/races?year=1949`)).status()).toBe(400);
});
