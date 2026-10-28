import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const body = readFileSync(new URL('../docs/editorial/circuit-experience-v3/33_CIRCUIT_READING_JOURNEYS_20261028.md', import.meta.url), 'utf8');
const worklist = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/F1DB_78_CONTENT_COVERAGE_20261027.json', import.meta.url), 'utf8'));
const expected = worklist.circuits.filter(item => !item.five_story_research_batch).map(item => item.circuit_id);

test('33-circuit manuscript covers the precise expansion cohort once', () => {
  const actual = [...body.matchAll(/^### ([a-z][a-z0-9-]+)(?: · \d{4})?$/gm)].map(match => match[1]);
  assert.equal(actual.length, 33);
  assert.deepEqual([...actual].sort(), [...expected].sort());
  assert.equal(new Set(actual).size, 33);
});

test('every chapter has distinct bilingual reading direction and stays research-only', () => {
  const chapters = body.split(/^### [a-z][a-z0-9-]+(?: · \d{4})?$/m).slice(1);
  assert.equal(chapters.length, 33);
  for (const chapter of chapters) {
    assert.match(chapter, /Reader question \/ Запитання:/);
    assert.match(chapter, /Gate:\*\* research draft/);
  }
  assert.equal((body.match(/\*\*Research gap:/g) ?? []).length, 2);
  assert.equal((body.match(/\*\*Recorded source:/g) ?? []).length, 31);
});
