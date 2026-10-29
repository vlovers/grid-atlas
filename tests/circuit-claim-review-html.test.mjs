import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
function run(script, args = []) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return result.stdout;
}
const html = run('scripts/render-circuit-claim-review-html.mjs');
const queue = JSON.parse(run('scripts/circuit-claim-review-queue.mjs', ['--format=json']));

test('offline claim desk covers all 165 exact bilingual draft editions', () => {
  assert.match(html, /^<!doctype html><html lang="en">/);
  assert.equal((html.match(/<section class="circuit" id="circuit-/g) ?? []).length, 33);
  assert.equal((html.match(/<article class="story" id="story-/g) ?? []).length, 165);
  assert.equal((html.match(/<li><strong>Pending:/g) ?? []).length, 825);
  assert.equal((html.match(/Exact research draft SHA-256:/g) ?? []).length, 165);
  assert.equal((html.match(/Not an approval signature/g) ?? []).length, 165);
  assert.equal((html.match(/<section lang="en">/g) ?? []).length, 330);
  assert.equal((html.match(/<section lang="uk">/g) ?? []).length, 330);
  for (const entry of queue.entries) {
    assert.ok(html.includes('id="story-' + entry.circuit_id + '-' + entry.story_index + '"'), entry.key);
    assert.ok(html.includes(entry.draft_fingerprint_sha256), entry.key);
  }
});

test('risk-ranked circuit index and source links are accessible and bounded', () => {
  assert.match(html, /<nav aria-label="Circuit review index" id="circuit-index">/);
  assert.match(html, /<main>/);
  assert.match(html, /@media\(max-width:720px\)/);
  assert.match(html, /@media print/);
  assert.match(html, /:focus-visible/);
  assert.equal((html.match(/<a href="#circuit-/g) ?? []).length, 33);
  assert.equal((html.match(/rel="noopener noreferrer"/g) ?? []).length, 177);
  const headings = [...html.matchAll(/<section class="circuit" id="circuit-([a-z0-9-]+)"/g)]
    .map(match => match[1]);
  const expected = [...new Set(queue.entries.map(item => item.circuit_id))];
  assert.deepEqual(headings, expected, 'circuit order follows highest-risk story priority');
  for (const id of headings) {
    assert.ok(html.includes('href="#circuit-' + id + '"'), id);
  }
  assert.match(html, /27 single-source dossiers/);
  assert.match(html, /Sentence candidates \(not independently verified claims\)/);
});

test('HTML is a self-contained non-executable research worksheet, not publication', () => {
  assert.match(html, /Not independently verified\. Not approved for publication/);
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(html, /Content-Security-Policy/);
  assert.doesNotMatch(html, /<script\b|<img\b|<iframe\b|<form\b|data:image/i);
  assert.doesNotMatch(html, /<link[^>]+href="https?:/i);
  assert.equal(html, run('scripts/render-circuit-claim-review-html.mjs'), 'render is deterministic');
  const release = JSON.parse(readFileSync(new URL(
    'apps/web/src/components/editorial/circuit-release.json', root), 'utf8'));
  assert.deepEqual(release.editions, [], 'human approval gate stays empty');
  assert.equal(queue.summary.publication_ready, 0);
  assert.equal(queue.summary.independently_verified, 0);
});

test('offline renderer refuses approval, publish and unexpected arguments', () => {
  for (const flag of ['--publish', '--approve', '--format=json']) {
    const result = spawnSync(process.execPath,
      ['scripts/render-circuit-claim-review-html.mjs', flag], {
        cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
      });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage: node scripts\/render-circuit-claim-review-html/);
    assert.equal(result.stdout, '');
  }
});
