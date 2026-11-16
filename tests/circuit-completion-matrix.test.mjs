import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const DIR = 'docs/editorial/circuit-completion';
const { summary, circuits } = read(`${DIR}/circuits.json`);
const layouts = read(`${DIR}/layouts.json`);
const archive = read(`${DIR}/archive/f1db-v2026.17.0-circuit-facts.json`);
const corners = readFileSync(`${DIR}/corners.csv`, 'utf8').trim().split('\n').slice(1);

test('committed matrices are reproducible from committed inputs', () => {
  execFileSync(process.execPath, ['scripts/circuit-content-gap-matrix.mjs', '--check'], { stdio: 'pipe' });
});

test('every pinned circuit, layout and numbered turn has exactly one row', () => {
  assert.equal(archive.source.release, 'v2026.17.0');
  assert.equal(new Set(circuits.map(c => c.circuit_id)).size, 78);
  assert.deepEqual(circuits.map(c => c.circuit_id).sort(), archive.circuits.map(c => c.circuit_id).sort());
  assert.equal(new Set(layouts.map(l => l.layout_id)).size, 160);
  const turns = archive.circuits.flatMap(c => c.layouts).reduce((sum, l) => sum + l.turns, 0);
  assert.equal(corners.length, turns);
  assert.equal(summary.numbered_turns, turns);
});

test('the six circuits outside the 72-reader subset are included', () => {
  const legacy = circuits.filter(c => c.renderer === 'legacy').map(c => c.circuit_id).sort();
  assert.deepEqual(legacy, ['jeddah', 'las-vegas', 'lusail', 'madring', 'miami', 'portimao']);
});

test('completion states are separate and none is claimed without evidence', () => {
  for (const c of circuits) {
    if (c.content_complete) {
      assert.equal(c.independent_review_status, 'passed', c.circuit_id);
      assert.notEqual(c.en_quality_status, 'not_assessed', c.circuit_id);
      assert.notEqual(c.uk_quality_status, 'not_assessed', c.circuit_id);
      assert.equal(c.corners_not_researched, 0, c.circuit_id);
    }
    if (c.publication_eligible) assert.ok(c.content_complete, c.circuit_id);
    if (c.production_verified) assert.ok(c.publication_eligible, c.circuit_id);
    // Media readiness never decides content completeness, and an HTTP 200 is not a status here at all.
    assert.ok(!('http_status' in c));
  }
  assert.equal(summary.corners_verified, 0, 'no corner may be marked verified until claim-level evidence exists');
});

test('season-level layout dates are never presented as exact revision dates', () => {
  for (const l of layouts) {
    assert.equal(l.revision_dates, 'season_level_only');
    assert.ok(['single_source_dataset', 'conflicting_evidence'].includes(l.turns_status));
    if (l.sequence === 1) assert.equal(l.change_reason, 'not_applicable');
    else assert.equal(l.change_reason, 'unknown', `${l.layout_id}: a reason needs evidence before it appears here`);
  }
});

test('no existing content block passes the publication policy without claims, evidence and independent review', () => {
  const blocks = read(`${DIR}/content-blocks.json`);
  assert.ok(blocks.length > 300);
  assert.ok(blocks.every(b => b.policy_outcome !== 'PASS'));
  assert.ok(blocks.every(b => b.triage !== 'KEEP'), 'KEEP requires evidence-backed independent review');
});
