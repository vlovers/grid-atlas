const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const { join } = require('node:path');

const root = join(__dirname, '../../..');
const migrationPath = 'packages/database/migrations/0013_circuit_editorial_boundary.sql';
const migration = readFileSync(join(root, migrationPath), 'utf8');
const api = readFileSync(join(root, 'apps/api/src/circuit-editorial.controller.ts'), 'utf8');
const contract = require('../src/schema-contract.json');

test('new circuit migration is immutable and covered by API readiness', () => {
  const digest = createHash('sha256').update(migration).digest('hex');
  assert.equal(contract['0013_circuit_editorial_boundary.sql'], digest);
  assert.match(migration, /REFERENCES historical_circuits\(id\)/);
  assert.doesNotMatch(migration, /subject_driver_id|content_articles\s*\(/);
  for (const table of [
    'circuit_editorial_articles', 'circuit_editorial_claims',
    'circuit_editorial_evidence', 'circuit_editorial_article_claims',
  ]) assert.ok(migration.includes('CREATE TABLE ' + table), table);
});

test('approval cannot be created by AI, self-review or unsupported claims', () => {
  assert.match(migration, /review_method = 'human'/);
  assert.match(migration, /lower\(btrim\(author\)\) <> lower\(btrim\(reviewer\)\)/);
  assert.match(migration, /lower\(btrim\(c\.reviewer\)\) = lower\(btrim\(NEW\.author\)\)/);
  assert.match(migration, /circuit publication requires linked, independently reviewed/);
  assert.match(migration, /cross-circuit claim link rejected/);
  assert.match(migration, /circuit_source_invalidate/);
  assert.match(migration, /circuit_evidence_invalidate/);
  assert.match(migration, /circuit_links_invalidate/);
  assert.match(migration, /OLD.status = 'published'/);
  assert.match(migration, /NEW.reviewer, NEW.reviewed_at, NEW.published_at/);
});

test('public endpoint is off by default, read-only and enforces structural evidence gate', () => {
  assert.match(api, /CIRCUIT_EDITORIAL_READ_ENABLED !== '1'/);
  assert.match(api, /@Get\('circuits\/:id\/article'\)/);
  assert.doesNotMatch(api, /@Post|@Put|@Patch|@Delete|media_assets/);
  assert.match(api, /c\.status <> 'verified'/);
  assert.match(api, /c\.review_method <> 'human'/);
  assert.match(api, /lower\(btrim\(c\.reviewer\)\) = lower\(btrim\(a\.author\)\)/);
  assert.match(api, /articleSections/);
  assert.match(api, /createHash\('sha256'\)/);
  assert.match(api, /delete rows\[0\]\.review_revision_sha256/);
  assert.match(api, /NotFoundException/);
});

test('reviewed body must be an exact rendering of approved claim statements', () => {
  const { articleSections } = require('../scripts/editorial-body.cjs');
  const claims = [{ id: '1', statement: 'Synthetic circuit claim.' }];
  assert.deepEqual(articleSections('## Weekend\n\nSynthetic circuit claim.', claims), [
    { heading: 'Weekend', claims },
  ]);
  assert.throws(() => articleSections('## Weekend\n\nUnreviewed prose.', claims), /not covered/);
  assert.throws(() => articleSections('Synthetic circuit claim.\n\nSynthetic circuit claim.', claims), /not covered/);
});
