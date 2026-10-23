const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const migration = readFileSync(
  join(__dirname, '../../../packages/database/migrations/0012_editorial_review_provenance.sql'),
  'utf8',
);

test('review method is explicit and the revision is a lowercase SHA-256', () => {
  assert.match(migration, /ADD COLUMN review_method TEXT NOT NULL DEFAULT 'human'/);
  assert.match(migration, /review_method IN \('human', 'ai'\)/);
  assert.match(migration, /ADD COLUMN review_revision_sha256 TEXT/);
  assert.ok(migration.includes("review_revision_sha256 ~ '^[a-f0-9]{64}$'"));
});

test('AI publication cannot bypass the dedicated publication workflow', () => {
  assert.match(migration, /ADD CONSTRAINT content_ai_publication_requires_dedicated_gate/);
  assert.match(migration, /CHECK \(review_method <> 'ai' OR status <> 'published'\)/);
});

test('review provenance changes invalidate approval and publication', () => {
  assert.match(migration, /NEW\.review_method, NEW\.review_revision_sha256/);
  assert.match(migration, /OLD\.review_method, OLD\.review_revision_sha256/);
  for (const assignment of [
    'NEW.reviewer := NULL;',
    'NEW.reviewed_at := NULL;',
    'NEW.published_at := NULL;',
    "NEW.status := 'draft';",
  ]) {
    assert.ok(migration.includes(assignment), assignment);
  }
});
