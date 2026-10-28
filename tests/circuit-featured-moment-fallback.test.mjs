import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const component = readFileSync(new URL('../apps/web/src/components/editorial/circuit-narrative.tsx', import.meta.url), 'utf8');
const facts = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-final33-stories.json', import.meta.url), 'utf8'));
const release = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-release.json', import.meta.url), 'utf8'));

test('unapproved circuits gain only existing public, sourced featured moments', () => {
  assert.match(component, /const featured = legacy\.find\(entry => entry\.id === circuitId\)/);
  assert.match(component, /existing\?\.moments\.map/);
  assert.match(component, /featured \? \[\{ id:/);
  assert.match(component, /isCircuitEditionApproved\(circuitId\)/);
  assert.deepEqual(release.editions, [], 'a page enhancement does not approve research editions');
  for (const story of facts) {
    assert.ok(/^\d{4}$/.test(story.year), story.id);
    assert.ok(story.title.en && story.title.uk, story.id);
    assert.ok(story.description.en && story.description.uk, story.id);
    assert.ok(/^https:\/\//.test(story.source), story.id);
  }
});
