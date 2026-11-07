import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));
const editorial = 'apps/web/src/components/editorial/';
const publicPath = editorial + 'archive-summaries/';
const collections = [
  ['circuit-extra-stories.json', 20],
  ['circuit-next20-stories.json', 20],
  ['circuit-final33-stories.json', 33],
];
const publicStories = collections.flatMap(([file]) => json(publicPath + file));
const legacyIds = ['monaco', 'silverstone', 'monza', 'suzuka', 'spa-francorchamps'];
const page = read('apps/web/src/app/[locale]/circuits/[id]/page.tsx');
const biography = read(editorial + 'circuit-narrative.tsx');
const publicModel = read(editorial + 'circuit-public-moments.ts');
const release = read(editorial + 'circuit-release.ts');

test('public archive summaries cover 78 distinct circuits without importing draft editions', () => {
  for (const [file, count] of collections) {
    assert.equal(json(publicPath + file).length, count, file);
  }
  assert.equal(publicStories.length, 73);
  const ids = [...publicStories.map(story => story.id), ...legacyIds];
  assert.equal(new Set(ids).size, 78);
  assert.deepEqual(json(editorial + 'circuit-release.json').editions, []);
  assert.match(publicModel, /archive-summaries\/circuit-extra-stories\.json/);
  assert.match(publicModel, /archive-summaries\/circuit-next20-stories\.json/);
  assert.match(publicModel, /archive-summaries\/circuit-final33-stories\.json/);
  assert.doesNotMatch(publicModel, /from ['"].*circuit-candidates/);
});

test('each existing public short story has independently populated EN and UK fields and an HTTPS source', () => {
  for (const story of publicStories) {
    assert.match(story.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, story.id);
    assert.match(story.source, /^https:\/\//, story.id);
    for (const locale of ['en', 'uk']) {
      assert.ok(typeof story.title?.[locale] === 'string' && story.title[locale].trim(), story.id + ' title/' + locale);
      assert.ok(typeof story.description?.[locale] === 'string' && story.description[locale].trim(), story.id + ' description/' + locale);
    }
  }
});

test('circuit pages keep a public history and race links but gate unapproved longform editions', () => {
  assert.match(page, /<CircuitBiography circuitId=\{circuit\.external_id\}/);
  assert.match(page, /<CircuitMoments circuitId=\{circuit\.external_id\}/);
  assert.match(page, /id="circuit-biography"/);
  assert.match(page, /id="circuit-moments"/);
  assert.match(biography, /getPublicCircuitStory\(circuitId\)/);
  assert.match(biography, /isCircuitEditionApproved\(circuitId\)/);
  assert.match(biography, /const biography = approved \? candidate\?\.biography/);
  assert.match(biography, /const moments = approved/);
  assert.match(biography, /uniqueRaceInYear\(history, moment\.raceYear\)/);
  assert.match(biography, /<ReviewDetails locale=\{locale\}/);
  assert.match(release, /hasPublicationReadyCornerGuide\(circuitId\)/);
  assert.match(release, /edition\.reviewer !== edition\.author/);
  assert.match(release, /edition\.content_sha256 === circuitEditionDigest\(circuitId\)/);
});

test('unapproved history is not accidentally presented as independently verified geometry', () => {
  assert.match(biography, /Independent editorial approval remains pending/);
  assert.match(publicModel, /not independently approved longform editions/);
  assert.match(publicModel, /A range or multi-year label is not an archive race identifier/);
  assert.match(publicModel, /Never guess which race a historical moment refers to/);
  assert.match(release, /dated_numbered_circuit_map/);
  assert.match(release, /apex_crosswalk_verified !== true/);
});

test('seven unresolved period routes remain research-only even when bilingual sections exist', () => {
  const routes = json('docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json');
  assert.equal(routes.release_authorized, false);
  assert.equal(routes.image_rights_approved, false);
  assert.match(routes.status, /research_pending/);
  const pending = routes.circuits.filter(circuit => circuit.independent_numbering_verified === false);
  assert.ok(pending.length >= 7);
  for (const circuit of pending) {
    assert.ok(circuit.circuit_id && circuit.layout_id && circuit.period);
    for (const section of circuit.sections) {
      for (const locale of ['en', 'uk']) {
        assert.ok(section.label?.[locale]?.trim(), circuit.circuit_id + ' label/' + locale);
        assert.ok(section.description?.[locale]?.trim(), circuit.circuit_id + ' description/' + locale);
      }
    }
  }
});
