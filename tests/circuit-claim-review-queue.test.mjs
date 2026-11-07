import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = new URL('../', import.meta.url);
function run(format) {
  const result = spawnSync(process.execPath, ['scripts/circuit-claim-review-queue.mjs', '--format=' + format], {
    cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return result.stdout;
}
const queue = JSON.parse(run('json'));
const original = JSON.parse(spawnSync(process.execPath,
  ['scripts/export-circuit-expansion-review.mjs', '--format=json'], {
    cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  }).stdout);
const originals = new Map(original.circuits.flatMap(circuit =>
  circuit.stories.map(story => [circuit.circuit_id + ':' + story.story_index, story])));

test('all 165 research stories receive deterministic review tasks, without approvals', () => {
  assert.equal(queue.kind, 'offline_claim_review_queue');
  assert.equal(queue.publication_allowed, false);
  assert.equal(queue.independent_approval, false);
  assert.equal(queue.summary.circuits, 33);
  assert.equal(queue.summary.stories, 165);
  assert.equal(queue.summary.single_source_dossiers, original.summary.single_source_circuits);
  assert.equal(queue.summary.publication_ready, 0);
  assert.equal(queue.summary.independently_verified, 0);
  assert.equal(queue.entries.length, 165);
  assert.equal(new Set(queue.entries.map(entry => entry.key)).size, 165);
  assert.deepEqual(new Set(queue.entries.map(entry => entry.circuit_id)),
    new Set(original.circuits.map(circuit => circuit.circuit_id)));
  for (const item of queue.entries) {
    const story = originals.get(item.key);
    assert.ok(story, item.key);
    assert.equal(item.draft_fingerprint_sha256, story.fingerprint_sha256);
    assert.deepEqual(item.source_urls, story.sources.map(source => source.url));
    assert.deepEqual(item.title, story.title);
    assert.deepEqual(item.narrative, story.narrative);
    assert.equal(item.reviewer_decision, 'not_recorded');
    assert.equal(item.independently_verified, false);
    assert.equal(item.publication_allowed, false);
    assert.equal(item.checks.length, 5);
    assert.ok(item.checks.every(check => check.status === 'pending' && check.evidence_locator === null));
    assert.ok(item.sentence_candidates.en.length > 0);
    assert.ok(item.sentence_candidates.uk.length > 0);
  }
});

test('priority queue ranks source concentration and contextual evidence without claiming fact checks', () => {
  for (let i = 1; i < queue.entries.length; i++) {
    assert.ok(queue.entries[i - 1].risk_score >= queue.entries[i].risk_score);
  }
  const singleSource = queue.entries.filter(item => item.flags.includes('single_source_dossier'));
  assert.equal(singleSource.length, original.summary.single_source_circuits * 5);
  assert.ok(singleSource.every(item => item.risk_score >= 5));
  assert.equal(queue.summary.classification_only_stories,
    queue.entries.filter(item => item.flags.includes('classification_only_sources')).length);
  assert.equal(queue.summary.bilingual_numeral_review_candidates,
    queue.entries.filter(item => item.flags.includes('bilingual_numeral_difference')).length);
  assert.equal(queue.summary.race_year_review_candidates,
    queue.entries.filter(item => item.flags.includes('race_source_year_mismatch')).length);
  assert.equal(queue.summary.cross_year_source_review_candidates,
    queue.entries.filter(item => item.flags.includes('cross_year_result_source_requires_context')).length);
  for (const item of queue.entries) {
    const resultYears = item.source_urls.flatMap(url => [...url.matchAll(/\/en\/results\/(\d{4})\/races\/\d+\//g)].map(match => Number(match[1])));
    assert.equal(item.flags.includes('cross_year_result_source_requires_context'),
      resultYears.some(year => year !== item.year), item.key);
  }
  const nivelles = queue.entries.find(item => item.key === 'nivelles:2');
  assert.ok(nivelles);
  assert.deepEqual(nivelles.numerical_comparison, { only_en: [], only_uk: [] },
    '26.6 and 26,6 should compare equal across locales');
  assert.ok(queue.limitations.some(note => note.includes('heuristics')));
});

test('markdown is a complete bilingual, source-linked worksheet with no approval signature', () => {
  const md = run('markdown');
  assert.match(md, /^# Grid Atlas — 165 circuit stories/);
  assert.equal((md.match(/^## .+ · [1-5]\/5 · \d{4}$/gm) ?? []).length, 165);
  assert.equal((md.match(/^- \[ \] /gm) ?? []).length, 165 * 5);
  assert.equal((md.match(/^\*\*Exact draft SHA-256:\*\*/gm) ?? []).length, 165);
  assert.match(md, /Human review checklist \(all pending\)/);
  assert.match(md, /Sentence candidates for claim extraction \(not validated claims\)/);
  assert.doesNotMatch(md, /independently approved|publication approved/i);
  assert.equal(md, run('markdown'), 'repeated export must be deterministic');
});

test('CLI is read-only, rejects publication flags, and never changes public release manifest', () => {
  const before = readFileSync(new URL('apps/web/src/components/editorial/circuit-release.json', root), 'utf8');
  for (const flag of ['--publish', '--approve', '--format=html']) {
    const result = spawnSync(process.execPath, ['scripts/circuit-claim-review-queue.mjs', flag], {
      cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage: node scripts\/circuit-claim-review-queue/);
  }
  assert.equal(readFileSync(new URL('apps/web/src/components/editorial/circuit-release.json', root), 'utf8'), before);
  assert.deepEqual(JSON.parse(before).editions, []);
});
