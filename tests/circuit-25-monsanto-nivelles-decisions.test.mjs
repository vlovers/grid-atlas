import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const md=readFileSync(new URL('../docs/editorial/circuit-experience-v3/TWENTY_FIVE_MONSANTO_NIVELLES_DECISIONS_20261029.md',import.meta.url),'utf8');
const ids=['monsanto','mont-tremblant','montjuic','mosport','nivelles'];
test('25 explicit circuit decisions stay unpublished and require evidence',()=>{
 const matches=[...md.matchAll(/^### ([a-z-]+):([1-5]) — /gm)];
 assert.equal(matches.length,25);
 for(const id of ids) assert.deepEqual(matches.filter(m=>m[1]===id).map(m=>Number(m[2])),[1,2,3,4,5]);
 for(const section of md.split(/^### [a-z-]+:[1-5] — .+$/m).slice(1)){
  assert.match(section,/\*\*Disposition:\*\* `[A-Z_]+`/);
  assert.match(section,/Specific next verification:/);
  assert.match(section,/Editorial guardrail:/);
  assert.match(section,/EN\/UK equivalence:/);
  assert.match(section,/Historical approval:\*\* false; \*\*publication:\*\* blocked/);
 }
 assert.match(md,/independent_approval=false/);
 assert.match(md,/publication_allowed=false/);
});

const researched = JSON.parse(readFileSync(
 new URL('../docs/editorial/circuit-experience-v3/EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json', import.meta.url),
 'utf8'
));
const periodEvidence = new Map([
 ['jacarepagua', ['lap 15', 'Лише', 'gearbox']],
 ['monsanto', ['telegraph pole', 'телеграфний стовп', 'motorsportmagazine.com']],
 ['mont-tremblant', ['clutch', 'зчеплення', 'grandprix.com']],
 ['mosport', ['ignition', 'запалювання', 'motorsportmagazine.com']],
]);

test('20 classic circuit scenes preserve period evidence, EN/UK substance and unpublished review status', () => {
 let count = 0;
 for (const [id, [enAnchor, ukAnchor, sourceDomain]] of periodEvidence) {
  const circuit = researched.circuits.find((item) => item.circuit_id === id);
  assert.ok(circuit, id);
  assert.deepEqual(circuit.stories.map((story) => story.story_index), [1,2,3,4,5], id);
  const en = new Set();
  const uk = new Set();
  for (const story of circuit.stories) {
   count++;
   assert.ok(story.narrative.en.length >= 220, id + '/en');
   assert.ok(story.narrative.uk.length >= 200, id + '/uk');
   en.add(story.narrative.en);
   uk.add(story.narrative.uk);
   assert.ok(story.source_urls.every((url) => url.includes('formula1.com/en/results/')), id + '/classification');
   assert.ok(story.historical_sources.some((url) => url.includes(sourceDomain)), id + '/period source');
   assert.ok(story.historical_sources.every((url) => !story.source_urls.includes(url)), id + '/separate source');
   assert.match(story.historical_source_locator, /Classification URL records race results only; independent claim-level review pending\./, id + '/review');
   assert.equal(story.historical_review_status, 'pending_independent_claim_review');
   assert.equal(story.independent_approval, false);
   assert.equal(story.publication, 'blocked');
  }
  assert.equal(en.size, 5, id + '/distinct EN');
  assert.equal(uk.size, 5, id + '/distinct UK');
  assert.ok(circuit.stories.some((story) => story.narrative.en.includes(enAnchor)), id + '/English chronology');
  assert.ok(circuit.stories.some((story) => story.narrative.uk.includes(ukAnchor)), id + '/Ukrainian chronology');
 }
 assert.equal(count, 20);
 assert.equal(researched.publication, 'blocked');
});
