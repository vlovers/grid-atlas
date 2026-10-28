import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const base = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, base), 'utf8');
const ledger = JSON.parse(read('docs/editorial/circuit-experience-v3/CIRCUIT_33_CANONICAL_STORY_INDEX.json'));
const coverage = JSON.parse(read('docs/editorial/circuit-experience-v3/F1DB_78_CONTENT_COVERAGE_20261027.json'));
const expected = coverage.circuits.filter(x=>!x.five_story_research_batch).map(x=>x.circuit_id).sort();

test('canonical ledger records precisely the expansion cohort and unique dated episodes', () => {
  assert.deepEqual([...new Set(ledger.entries.map(x=>x.circuit_id))].sort(), expected);
  assert.equal(ledger.entries.length, ledger.summary.unique_story_keys);
  const keys = ledger.entries.map(x=>x.circuit_id+':'+(x.event_year??'gap'));
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(ledger.entries.filter(x=>x.event_year!==null).length, ledger.summary.dated_unique_events);
  assert.equal(ledger.entries.filter(x=>x.event_year===null).length, 2);
  assert.equal(ledger.entries.reduce((sum,x)=>sum+x.alternate_manuscripts.length,0),ledger.summary.alternate_duplicate_manuscripts);
});

test('chosen chapters exist, keep UK/EN versions, and never claim approval', () => {
 for (const entry of ledger.entries) {
  const body = read(entry.preferred_manuscript);
  const headings = body.split(/^## \\d+\\. /m).slice(1);
  assert.ok(headings.some(h => h.startsWith(entry.circuit_id + ' ') && (entry.event_year === null ? h.includes('source gap') : h.includes(String(entry.event_year)))));
  assert.match(body,/### EN —/);
  assert.match(body,/### UK —/);
  assert.equal(entry.status,'research_draft');
  assert.equal(entry.publication,'blocked');
  for(const alternate of entry.alternate_manuscripts) assert.ok(read(alternate).includes(entry.circuit_id));
 }
});
