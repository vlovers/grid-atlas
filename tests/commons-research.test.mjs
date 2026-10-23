import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditResearchIndex, parseCsv } from '../scripts/audit-commons-research.mjs';

const source = readFileSync(new URL('../docs/research/commons-photo-research-index.csv', import.meta.url), 'utf8');
const mutate = (rowIndex, columnIndex, value) => {
  const rows = parseCsv(source);
  rows[rowIndex][columnIndex] = value;
  return rows.map(row => row.map(field => '"' + field.replaceAll('"', '""') + '"').join(',')).join('\n') + '\n';
};
test('research CSV has exact columns, unique Commons files and no fake approvals', () => {
  const result = auditResearchIndex(source);
  assert.equal(result.total, 16);
  assert.equal(result.approved, 0);
  assert.equal(Object.values(result.byType).reduce((a,b)=>a+b,0), 16);
});
test('CSV handles escaped quotes, commas and CRLF', () => {
  assert.deepEqual(parseCsv('"a","b,b"\r\n"say ""hi""","x"\r\n'), [['a','b,b'],['say "hi"','x']]);
});
test('research refuses published and rights-cleared flags', () => {
  assert.throws(() => auditResearchIndex(mutate(1,9,'approved')), /rights approval/);
  assert.throws(() => auditResearchIndex(mutate(1,8,'verified')), /rights approval/);
});
test('research refuses duplicate IDs and duplicate file URLs', () => {
  const rows = parseCsv(source);
  assert.throws(() => auditResearchIndex(mutate(2,0,rows[1][0])), /duplicate candidate ID/);
  assert.throws(() => auditResearchIndex(mutate(2,3,rows[1][3])), /duplicate file URL/);
});
test('research refuses non-Commons URLs and malformed CSV', () => {
  assert.throws(() => auditResearchIndex(mutate(1,3,'https://example.com/wiki/File:fake.jpg')), /non-Commons/);
  assert.throws(() => parseCsv('"unterminated'), /Unterminated/);
});
