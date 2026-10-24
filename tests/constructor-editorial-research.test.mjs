import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();
const base = join(root, 'docs/editorial/constructors/batch-01-founders');
const manifest = JSON.parse(readFileSync(join(base, 'manifest.json'), 'utf8'));
const drafts = readFileSync(join(base, 'RESEARCH_DRAFTS.md'), 'utf8');
const verification = readFileSync(join(base, 'SOURCE_VERIFICATION.md'), 'utf8');
const firstBatch = new Set(['Ferrari', 'McLaren', 'Williams']);

function extractSection(name) {
  const heading = firstBatch.has(name) ? `## ${name}` : `### ${name}`;
  // Match the whole heading, never a prefix such as "Lotus" within "Lotus 79".
  const lines = drafts.split('\n');
  const start = lines.findIndex((line) => line === heading);
  assert.notEqual(start, -1, `Missing heading: ${heading}`);
  const level = firstBatch.has(name) ? 2 : 3;
  const next = lines.findIndex((line, index) =>
    index > start && /^#{2,3} /.test(line) && line.match(/^#+/)[0].length <= level,
  );
  return lines.slice(start + 1, next < 0 ? undefined : next).join('\n');
}

test('twelve distinct research-only subjects with bilingual text and source URLs', () => {
  assert.equal(manifest.schema_version, 1);
  assert.equal(manifest.source.release, 'v2026.17.0');
  assert.equal(manifest.publication_status, 'research_only');
  assert.equal(manifest.subjects.length, 12);
  assert.equal(new Set(manifest.subjects.map((item) => item.name)).size, 12);
  assert.equal(manifest.boundaries.not_public, true);
  assert.equal(manifest.boundaries.source_urls_are_not_approval, true);
  assert.equal(manifest.boundaries.constructor_is_not_entrant, true);

  for (const subject of manifest.subjects) {
    assert.equal(subject.english_draft_status, 'research_only');
    assert.equal(subject.ukrainian_draft_status, 'research_only');
    assert.equal(subject.independent_claim_review, 'pending');
    assert.equal(subject.human_review, 'pending');
    assert.equal(subject.publication, 'blocked');

    const section = extractSection(subject.name);
    if (firstBatch.has(subject.name)) {
      assert.match(section, /^### English/m, subject.name);
      assert.match(section, /^### Українська/m, subject.name);
    } else {
      assert.match(section, /\*\*EN — research draft\.\*\*/, subject.name);
      assert.match(section, /\*\*UK — редакційний чернетковий текст\.\*\*/, subject.name);
    }
    assert.match(section, /https:\/\/[^\s)]+/, subject.name);

    if (subject.f1db_external_id === null) {
      assert.equal(subject.source_record_sha256, null);
      assert.equal(subject.identity_status, 'pending_pinned_archive_preflight');
    } else {
      assert.match(subject.f1db_external_id, /^[a-z0-9-]+$/);
      assert.match(subject.source_record_sha256, /^[a-f0-9]{64}$/);
      assert.equal(subject.identity_status, 'pinned_manifest_recorded_not_rechecked');
    }
  }
});

test('pinned-known identities come from the repository source registry', () => {
  const identities = JSON.parse(readFileSync(join(root, 'docs/media/pilot-identities.json'), 'utf8'));
  assert.equal(identities.source.release, manifest.source.release);
  for (const subject of manifest.subjects.filter((item) => item.f1db_external_id !== null)) {
    const record = identities.subjects.find(
      (item) => item.type === 'constructor' && item.id === subject.f1db_external_id,
    );
    assert.ok(record, `Missing registry identity for ${subject.name}`);
    assert.equal(record.record_sha256, subject.source_record_sha256);
  }
});

test('verification notes cannot be mistaken for independent editorial approval', () => {
  assert.match(verification, /editorial research/);
  assert.match(verification, /not an independent human approval/);
  assert.match(verification, /one publisher group, Formula 1/);
  for (const claim of ['F-01', 'F-02', 'J-01', 'J-02', 'J-03']) {
    assert.match(verification, new RegExp('\\| ' + claim + ' \\|'));
  }
});
