import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const run = format => {
  const result = spawnSync(process.execPath, ['scripts/export-circuit-expansion-review.mjs', '--format=' + format], {
    cwd: new URL('.', root), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return result.stdout;
};
const packet = JSON.parse(run('json'));
const triage = JSON.parse(readFileSync(new URL('docs/editorial/circuit-experience-v3/F1DB_33_EXPANSION_SOURCE_TRIAGE_20261028.json', root), 'utf8'));
const release = JSON.parse(readFileSync(new URL('apps/web/src/components/editorial/circuit-release.json', root), 'utf8'));

test('offline packet integrates all 165 bilingual drafts from 33 dossiers without publishing', () => {
  assert.equal(packet.kind, 'offline_editorial_review_only');
  assert.equal(packet.f1db_release, 'v2026.17.0');
  assert.equal(packet.publication_allowed, false);
  assert.equal(packet.independent_approval, false);
  assert.deepEqual(packet.summary, {
    circuits: 33, stories: 165,
    source_references: triage.summary.total_story_source_references,
    distinct_source_urls: triage.summary.distinct_source_urls,
    single_source_circuits: triage.summary.single_source_circuits, published: 0,
  });
  assert.equal(packet.circuits.length, 33);
  assert.deepEqual(packet.circuits.map(circuit => circuit.circuit_id), triage.circuits.map(circuit => circuit.circuit_id).sort());
  assert.deepEqual(release.editions, [], 'the review packet must not create approvals');
  for (const circuit of packet.circuits) {
    assert.equal(circuit.stories.length, 5, circuit.circuit_id);
    assert.equal(circuit.publication_allowed, false);
    assert.equal(circuit.independent_approval, false);
    assert.equal(circuit.editorial_status, 'unreviewed');
    assert.deepEqual(circuit.stories.map(story => story.story_index), [1, 2, 3, 4, 5]);
    const triageEntry = triage.circuits.find(item => item.circuit_id === circuit.circuit_id);
    assert.equal(circuit.unique_source_urls, triageEntry.unique_source_urls);
    for (const story of circuit.stories) {
      assert.equal(story.publication_allowed, false);
      assert.equal(story.independent_approval, false);
      assert.equal(story.editorial_status, 'unreviewed');
      assert.match(story.fingerprint_sha256, /^[a-f0-9]{64}$/);
      for (const locale of ['en', 'uk']) {
        assert.ok(story.title[locale].length > 8);
        assert.ok(story.narrative[locale].length > 80);
      }
      assert.ok(story.sources.length > 0);
      assert.ok(story.sources.every(source => source.url.startsWith('https://')));
      if (circuit.unique_source_urls === 1) {
        assert.ok(story.review_warnings.some(warning => warning.includes('same URL')));
      }
    }
  }
});

test('exact manuscript fingerprints identify copy changes but do not grant approval', () => {
  const first = packet.circuits.find(circuit => circuit.circuit_id === 'aida').stories[0];
  const fingerprint = createHash('sha256').update(JSON.stringify({
    circuit_id: 'aida', story_index: first.story_index, year: first.year,
    title: first.title, narrative: first.narrative,
    source_urls: first.sources.map(source => source.url),
  })).digest('hex');
  assert.equal(first.fingerprint_sha256, fingerprint);
  assert.equal(first.publication_allowed, false);
});

test('offline HTML presents all 165 paired stories, source links, and review warnings accessibly', () => {
  const html = run('html');
  assert.match(html, /^<!doctype html><html lang="en">/);
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  assert.equal((html.match(/<details class="circuit">/g) ?? []).length, 33);
  assert.equal((html.match(/<article class="story">/g) ?? []).length, 165);
  assert.equal((html.match(/<section lang="en">/g) ?? []).length, 165);
  assert.equal((html.match(/<section lang="uk">/g) ?? []).length, 165);
  assert.match(html, /Not independently verified\. Not approved for publication/);
  assert.match(html, new RegExp(triage.summary.single_source_circuits + '/33 dossiers rely on a single URL'));
  assert.match(html, /rel="noopener noreferrer" target="_blank"/);
  assert.match(html, /Senna&#39;s pole, zero racing laps/);
  assert.match(html, /@media\(max-width:700px\)/);
  assert.doesNotMatch(html, /<script\b|<img\b|<iframe\b|data:image/i);
});

test('CLI rejects unknown flags and never modifies public release gates', () => {
  const result = spawnSync(process.execPath, ['scripts/export-circuit-expansion-review.mjs', '--publish'], {
    cwd: new URL('.', root), encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage: node scripts\/export-circuit-expansion-review/);
  assert.deepEqual(JSON.parse(readFileSync(new URL('apps/web/src/components/editorial/circuit-release.json', root), 'utf8')).editions, []);
  assert.doesNotMatch(readFileSync(new URL('apps/web/src/components/editorial/circuit-narrative.tsx', root), 'utf8'), /export-circuit-expansion-review|EXPANSION_3_ALL_ELEVEN_RESEARCH_DRAFTS/);
});
