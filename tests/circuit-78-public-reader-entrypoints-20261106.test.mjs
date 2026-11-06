import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

/** Public short stories already exist; this test prevents the circuit landing
 * page from falling back to an empty biography while hiding that content. */
test('all 78 circuit identities have a distinct public bilingual story', () => {
  const sources = ['circuit-extra-stories.json', 'circuit-next20-stories.json', 'circuit-final33-stories.json'];
  const stories = sources.flatMap(name => JSON.parse(read('apps/web/src/components/editorial/' + name)));
  const ids = stories.map(story => story.id);
  assert.equal(stories.length, 73);
  assert.equal(new Set(ids).size, 73);
  const legacy = ['monaco', 'silverstone', 'monza', 'suzuka', 'spa-francorchamps'];
  assert.equal(new Set([...ids, ...legacy]).size, 78);
  for (const story of stories) {
    for (const locale of ['en', 'uk']) {
      assert.ok(story.title[locale]?.trim(), story.id + ': ' + locale + ' title');
      assert.ok(story.description[locale]?.trim(), story.id + ': ' + locale + ' description');
    }
    assert.match(story.source, /^https:\/\//, story.id + ': source');
  }
});

test('all circuit pages show source-linked story entry without duplicate archive overview', () => {
  const page = read('apps/web/src/app/[locale]/circuits/[id]/page.tsx');
  const biography = read('apps/web/src/components/editorial/circuit-narrative.tsx');
  assert.match(page, /<CircuitBiography circuitId=\{circuit\.external_id\}/);
  assert.match(biography, /const previous = getPublicCircuitStory\(circuitId\)/);
  assert.match(biography, /<h3>\{previous\.title\[locale\]\}<\/h3>/);
  assert.match(biography, /href="#circuit-moments"/);
  assert.doesNotMatch(page, /CircuitArchiveBrief/);
  assert.match(biography, /isCircuitEditionApproved\(circuitId\)/);
});
