import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const body = readFileSync(new URL('../docs/editorial/circuit-experience-v3/EXPANSION_TEN_BILINGUAL_CHAPTERS_20261028.md', import.meta.url), 'utf8');
const ids = ['bremgarten','buenos-aires','bugatti','clermont-ferrand','jacarepagua','monsanto','mont-tremblant','mosport','nivelles','pescara'];
test('ten new bilingual circuit chapters are present and review-gated', () => {
  const parts = body.split(/^## \d+\. /m).slice(1);
  assert.equal(parts.length, ids.length);
  for (const [index, part] of parts.entries()) {
    assert.ok(part.startsWith(ids[index]+' ('));
    assert.match(part, /^### EN — /m);
    assert.match(part, /^### UK — /m);
    assert.match(part, /\*\*Existing archive source:\*\* https:\/\//);
    assert.match(part, /independent fact-check, language edit, layout and image-rights review pending/);
    assert.ok(part.length > 700);
  }
});
