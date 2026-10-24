import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const path = 'docs/editorial/batches/drivers-30-v1/biography-batch2-claim-crosswalk.json';
const crosswalk = JSON.parse(readFileSync(path, 'utf8'));

test('crosswalk preserves research-only approval boundary and checks source claim IDs', () => {
  const run = spawnSync(process.execPath, ['scripts/editorial-biography-crosswalk-check.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /PASS: 45 mappings/);
  assert.equal(crosswalk.publication_status, 'unpublished');
  assert.ok(crosswalk.rows.every(row => row.review_status === 'pending' && row.human_verified === false));
});

test('crosswalk explicitly identifies unresolved editorial gaps', () => {
  const gaps = crosswalk.rows.filter(row => row.alignment === 'unmapped');
  assert.deepEqual(gaps.map(row => row.content_factory_claim_id).sort(), [
    'graham-hill-family',
    'jackie-stewart-broadcast'
  ]);
  assert.equal(crosswalk.rows.filter(row => row.alignment === 'partial').length, 7);
});
