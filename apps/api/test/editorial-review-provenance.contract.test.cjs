const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const migration = readFileSync(
  join(__dirname, '../../packages/database/migrations/0012_editorial_review_provenance.sql'),
  'utf8',
);

test('AI review provenance is explicitly distinct from legacy human review', () => {
  assert.match(migration, /ADD COLUMN review_method TEXT NOT NULL DEFAULT 'human'/);
  assert.match(migration, /review_method IN \('human', 'ai'\)/);
  assert.match(migration, /ADD COLUMN review_revision_sha256 TEXT/);
  assert.ok(migration.includes("review_revision_sha256 ~ '^[a-f0-9]{64}
});

test('AI publication stays blocked until a dedicated reviewed release workflow exists', () => {
  assert.match(migration, /ADD CONSTRAINT content_ai_publication_requires_dedicated_gate/);
  assert.match(migration, /CHECK \(review_method <> 'ai' OR status <> 'published'\)/);
});

test('changing provenance or revision invalidates earlier approval', () => {
  assert.match(migration, /NEW\.review_method, NEW\.review_revision_sha256/);
  assert.match(migration, /OLD\.review_method, OLD\.review_revision_sha256/);
  assert.match(migration, /NEW\.reviewer := NULL;/);
  assert.match(migration, /NEW\.reviewed_at := NULL;/);
  assert.match(migration, /NEW\.published_at := NULL;/);
  assert.match(migration, /NEW\.status := 'draft';/);
});
"));
});

test('AI publication stays blocked until a dedicated reviewed release workflow exists', () => {
  assert.match(migration, /ADD CONSTRAINT content_ai_publication_requires_dedicated_gate/);
  assert.match(migration, /CHECK \(review_method <> 'ai' OR status <> 'published'\)/);
});

test('changing provenance or revision invalidates earlier approval', () => {
  assert.match(migration, /NEW\.review_method, NEW\.review_revision_sha256/);
  assert.match(migration, /OLD\.review_method, OLD\.review_revision_sha256/);
  assert.match(migration, /NEW\.reviewer := NULL;/);
  assert.match(migration, /NEW\.reviewed_at := NULL;/);
  assert.match(migration, /NEW\.published_at := NULL;/);
  assert.match(migration, /NEW\.status := 'draft';/);
});
