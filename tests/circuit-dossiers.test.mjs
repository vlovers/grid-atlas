// Research-lane circuit dossiers: structure, F1DB consistency, bilingual parity and fail-closed review state.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { isCircuitEditionApproved } from '../apps/web/src/components/editorial/circuit-release.ts';

const dir = new URL('../apps/web/src/components/editorial/circuit-dossiers/', import.meta.url);
const archive = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json', import.meta.url), 'utf8'));
const circuits = new Map(archive.circuits.map(c => [c.circuit_id, c]));
const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.json')).sort() : [];
const dossiers = files.map(f => ({ file: f, ...JSON.parse(readFileSync(new URL(f, dir), 'utf8')) }));
const KINDS = new Set(['origins', 'formula1_history', 'legacy_present_day', 'defining_moment', 'historical_fact']);
const CYRILLIC = /[А-Яа-яІіЇїЄєҐґ]/;
// English writes 100,000 and 2.65; Ukrainian writes 100 000 and 2,65. Compare the values, not the typography.
const enNumbers = s => s.replace(/(?<=\d),(?=\d{3}\b)/g, '').match(/\d+(?:\.\d+)?/g)?.sort() ?? [];
const ukNumbers = s => s.replace(/(?<=\d)[ \u00a0\u202f](?=\d{3}\b)/g, '').match(/\d+(?:[.,]\d+)?/g)?.map(n => n.replace(',', '.')).sort() ?? [];
const sourceOk = s => s && /^https:\/\//.test(s.url) && s.publisher && s.locator && !/wikipedia\.org/.test(s.url);

test('one dossier per known F1DB circuit, named after its circuit_id', () => {
  for (const d of dossiers) {
    assert.equal(d.file, `${d.circuit_id}.json`);
    assert.ok(circuits.has(d.circuit_id), d.circuit_id);
  }
});

test('dossier sections are bilingual, number-consistent, sourced and unapproved', () => {
  for (const d of dossiers) {
    const seasons = new Set(circuits.get(d.circuit_id).races.map(r => r.season));
    const ids = new Set();
    assert.equal(d.review_status, 'independent_review_pending');
    assert.equal(isCircuitEditionApproved(d.circuit_id), false);
    for (const s of d.sections) {
      assert.ok(!ids.has(s.id), s.id); ids.add(s.id);
      assert.ok(KINDS.has(s.kind), s.id);
      assert.equal(s.review_status, 'independent_review_pending', s.id);
      if (s.kind === 'defining_moment') assert.ok(seasons.has(s.year), `${s.id}: not an F1DB season`);
      else assert.equal(s.year, null, s.id);
      assert.ok(s.text.en.trim() && s.title.en.trim(), s.id);
      assert.match(s.text.uk, CYRILLIC, s.id);
      assert.match(s.title.uk, CYRILLIC, s.id);
      assert.deepEqual(ukNumbers(s.text.uk), enNumbers(s.text.en), `${s.id}: EN/UK numbers differ`);
      assert.ok(s.sources.length >= 1 && s.sources.every(sourceOk), `${s.id}: sources`);
    }
  }
});

test('layout timelines use F1DB layouts, lengths and turn counts', () => {
  for (const d of dossiers) {
    const layouts = new Map(circuits.get(d.circuit_id).layouts.map(l => [l.layout_id, l]));
    for (const t of d.layout_timeline) {
      const l = layouts.get(t.layout_id);
      assert.ok(l, `${d.circuit_id}: ${t.layout_id}`);
      assert.equal(t.length_km, l.length_km, t.layout_id);
      assert.equal(t.turns, l.turns, t.layout_id);
      assert.equal(t.seasons, `${l.seasons[0]}-${l.seasons.at(-1)}`, t.layout_id);
      assert.match(t.change.uk, CYRILLIC, t.layout_id);
      assert.deepEqual(ukNumbers(t.change.uk), enNumbers(t.change.en), `${t.layout_id}: EN/UK numbers differ`);
      assert.ok(t.sources.length >= 1 && t.sources.every(sourceOk), `${t.layout_id}: sources`);
    }
  }
});

test('corner names are bound to an F1DB layout, in-range turns, a period and a source', () => {
  for (const d of dossiers) {
    const layouts = new Map(circuits.get(d.circuit_id).layouts.map(l => [l.layout_id, l]));
    for (const n of d.corner_names) {
      const l = layouts.get(n.layout_id);
      assert.ok(l, `${d.circuit_id}: ${n.layout_id}`);
      assert.ok(n.turns.length && n.turns.every(t => Number.isInteger(t) && t >= 1 && t <= l.turns), `${n.layout_id} ${n.name}`);
      assert.ok(['official', 'historical', 'traditional'].includes(n.status), n.name);
      assert.ok(n.name.trim() && n.period.trim(), n.name);
      assert.ok(sourceOk(n.source), `${n.name}: source`);
      assert.equal(n.review_status, 'independent_review_pending');
    }
  }
});

test('limitations and inconsistencies are explicit records, never silently dropped', () => {
  for (const d of dossiers) {
    assert.ok(Array.isArray(d.limitations) && d.limitations.every(x => typeof x === 'string' && x.trim()), d.circuit_id);
    for (const i of d.inconsistencies) assert.ok(i.existing_text && i.problem && i.correct, d.circuit_id);
  }
});
