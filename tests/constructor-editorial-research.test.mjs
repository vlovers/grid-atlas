import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const base = join(process.cwd(), 'docs/editorial/constructors/batch-01-founders');
const manifest = JSON.parse(readFileSync(join(base, 'manifest.json'), 'utf8'));
const drafts = readFileSync(join(base, 'RESEARCH_DRAFTS.md'), 'utf8');
const initial = new Set(['Ferrari', 'McLaren', 'Williams']);

test('constructor research batch has twelve distinct, blocked bilingual draft identities', () => {
  assert.equal(manifest.schema_version, 1);
  assert.equal(manifest.publication_status, 'research_only');
  assert.equal(manifest.subjects.length, 12);
  assert.equal(new Set(manifest.subjects.map((subject) => subject.name)).size, 12);
  assert.equal(manifest.boundaries.not_public, true);

  for (const subject of manifest.subjects) {
    assert.equal(subject.english_draft_status, 'research_only');
    assert.equal(subject.ukrainian_draft_status, 'research_only');
    assert.equal(subject.independent_claim_review, 'pending');
    assert.equal(subject.human_review, 'pending');
    assert.equal(subject.publication, 'blocked');
    assert.ok(subject.f1db_external_id === null || typeof subject.f1db_external_id === 'string');
    if (!subject.f1db_external_id) {
      assert.equal(subject.source_record_sha256, null);
      assert.equal(subject.identity_status, 'pending_pinned_archive_preflight');
    }
    const header = initial.has(subject.name) ? `## ${subject.name}` : `### ${subject.name}`;
    assert.ok(drafts.includes(header), `Missing draft section: ${subject.name}`);
    // All original draft sections require visible EN and UK text.
    const start = drafts.indexOf(header);
    const end = drafts.indexOf('\n## ', start + header.length);
    const fragment = drafts.slice(start, end === -1 ? undefined : end);
    assert.match(fragment, initial.has(subject.name) ? /### English/ : /\*\*EN — research draft/);
    assert.match(fragment, initial.has(subject.name) ? /### Українська/ : /\*\*UK — редакційний чернетковий текст/);
    assert.match(fragment, /https:\/\//);
  }
});

test('known exact identities are tied to pinned media subject records without invented approvals', () => {
  const source = JSON.parse(readFileSync('docs/media/pilot-identities.json', 'utf8'));
  assert.equal(source.source.release, manifest.source.release);
  for (const subject of manifest.subjects.filter((item) => item.f1db_external_id !== null)) {
    const recorded = source.subjects.find(
      (item) => item.type === 'constructor' && item.id === subject.f1db_external_id,
    );
    assert.ok(recorded, `No pinned manifest source identity: ${subject.name}`);
    assert.equal(subject.source_record_sha256, recorded.record_sha256);
    assert.equal(subject.identity_status, 'pinned_manifest_recorded_not_rechecked');
  }
});
