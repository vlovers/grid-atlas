import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const audit = (...args) => spawnSync(process.execPath, ['scripts/audit-content-media-coverage.mjs', ...args], { encoding: 'utf8' });
test('coverage inventory reports all ten paired EN/UK dossiers and distinguishes draft from published', () => {
  const run = audit('--json');
  assert.equal(run.status, 0, run.stderr);
  const data = JSON.parse(run.stdout);
  assert.equal(data.schema_version, 1);
  assert.equal(data.biographies.complete_pairs, 10);
  assert.equal(data.biographies.published_locale_dossiers, 0);
  assert.equal(data.biographies.rows.length, 10);
  assert.ok(data.biographies.rows.every(row => row.locales.en.claims > 0 && row.locales.uk.claims > 0));
});
test('unapproved research candidates are not counted as published media', () => {
  const run = audit('--json');
  const data = JSON.parse(run.stdout);
  assert.equal(data.media.publication_assets, 0);
  assert.ok(data.media.candidate_assets >= 5);
  assert.equal(data.media.by_subject.driver.approved, 0);
  assert.equal(audit('--require-public-media').status, 1);
});
