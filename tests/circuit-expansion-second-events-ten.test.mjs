import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const text = readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_SECOND_EVENTS_TEN_20261028.md', import.meta.url), 'utf8');
const expected = ['aida','anderstorp','buenos-aires','dijon','jarama','jerez','mont-tremblant','nivelles','porto','reims'];
test('ten second-event drafts keep UK/EN content, source and review gate', () => {
  const chapters = text.split(/^## \d+\. /m).slice(1);
  assert.equal(chapters.length, expected.length);
  for (let i=0; i<chapters.length; i++) {
    assert.ok(chapters[i].startsWith(expected[i] + ' ('));
    assert.match(chapters[i], /^### EN — /m);
    assert.match(chapters[i], /^### UK — /m);
    assert.match(chapters[i], /https:\/\/github\.com\/f1db\/f1db\/blob\/v2026\.17\.0\//);
    assert.match(chapters[i], /independent source check, language edit and publication approval pending/);
    assert.ok(chapters[i].length > 850);
  }
  assert.doesNotMatch(text, /Ferrari's first American winner|Перший американський переможець/);
});
