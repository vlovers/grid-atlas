import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => JSON.parse(readFileSync(path, 'utf8'));

test('consolidation inventory preserves all research without treating it as publication', () => {
  const report = read('docs/editorial/CONTENT_CONSOLIDATION_V1_2026-10-26.json');
  const driverManifest = read('docs/editorial/batches/drivers-30-v1.json');
  const chapters = read('docs/editorial/batches/drivers-30-v1/narrative-chapters-v1.json');
  const longform = read('docs/editorial/biography-expansion-batch-2/manifest.json');
  const constructorManifest = read('docs/editorial/constructors/batch-01-founders/manifest.json');
  assert.equal(report.drivers.length, 30);
  assert.deepEqual(report.drivers.map(row => row.driver_id), driverManifest.drivers.map(row => row.driver_id));
  assert.equal(new Set(report.drivers.map(row => row.driver_id)).size, 30);
  assert.equal(report.drivers.filter(row => row.track === 'longform_277_canonical').length, 10);
  assert.equal(report.drivers.filter(row => row.track === 'research_274_only').length, 20);
  assert.equal(report.drivers.reduce((total, row) => total + row.research_chapters, 0),
    chapters.stories.reduce((total, row) => total + row.chapters.length, 0));
  for (const row of report.drivers) {
    assert.equal(row.track === 'longform_277_canonical', longform.drivers.includes(row.driver_id));
    assert.equal(row.publication, 'unpublished');
    assert.deepEqual(row.required_locales, ['en', 'uk']);
  }
  assert.deepEqual(report.constructors.map(row => row.name), constructorManifest.subjects.map(row => row.name));
  for (const team of report.constructors) assert.equal(team.publication, 'blocked');
});

test('fifteen distinct research-only careers have readable bilingual entry scenes', () => {
  const chapters = read('docs/editorial/batches/drivers-30-v1/narrative-chapters-v1.json');
  const bio = read('docs/editorial/biography-expansion-batch-2/manifest.json');
  let count = 0;
  for (const story of chapters.stories) {
    if (bio.drivers.includes(story.driver_id)) continue; // long-form canonical source takes precedence
    count++;
    const lead = story.chapters[0];
    for (const locale of ['en', 'uk']) {
      const [hook, ...body] = lead[locale].body.split(/\n\n/);
      assert.ok(hook.length >= 65, story.driver_id + '/' + locale + ' must have meaningful opening');
      assert.ok(body.join(' ').length >= 100, story.driver_id + '/' + locale + ' must preserve sourced research');
      assert.ok(!/^(In |У |Уже |The )?\d{4}\b/.test(hook), story.driver_id + '/' + locale + ' should open with a scene, not an encyclopedia year');
    }
    assert.ok(lead.claim_ids.length, story.driver_id + ' must retain source claim linkage');
  }
  assert.equal(count, 15);
  assert.equal(chapters.publication_status, 'unpublished');
});

test('fifteen independent careers have bilingual middle-act context and preserved research status', () => {
  const chapters = read('docs/editorial/batches/drivers-30-v1/narrative-chapters-v1.json');
  const longform = new Set(read('docs/editorial/biography-expansion-batch-2/manifest.json').drivers);
  const independent = chapters.stories.filter(story => !longform.has(story.driver_id));
  assert.equal(independent.length, 15);
  for (const story of independent) {
    assert.ok(story.chapters.length >= 2, story.driver_id + ' lacks a middle act');
    const middle = story.chapters[1];
    for (const locale of ['en', 'uk']) {
      const paragraphs = middle[locale].body.split(/\n\n/).filter(Boolean);
      assert.ok(paragraphs.length >= 2, story.driver_id + '/' + locale + ' needs distinct context');
      assert.ok(paragraphs.at(-1).length >= 200, story.driver_id + '/' + locale + ' needs substantial context');
    }
    assert.ok(middle.claim_ids.length, story.driver_id + ' loses research linkage');
  }
  assert.equal(chapters.publication_status, 'unpublished');
});

test('every thin biography has two concrete historical research scenes rather than filler', () => {
  const queue = read('docs/editorial/batches/drivers-30-v1/SUBSTANTIVE_SCENE_GAPS_2026-10-26.json');
  const manuscripts = read('docs/editorial/batches/drivers-30-v1/narrative-chapters-v1.json');
  assert.equal(queue.items.length, 15);
  assert.equal(new Set(queue.items.map(item => item.driver_id)).size, 15);
  for (const item of queue.items) {
    const story = manuscripts.stories.find(s => s.driver_id === item.driver_id);
    assert.ok(story, item.driver_id);
    assert.equal(item.missing_evidence_scenes.length, 2);
    assert.ok(item.missing_evidence_scenes.every(s => s.length > 40));
    assert.deepEqual(item.existing_claim_ids, [...new Set(story.chapters.flatMap(c => c.claim_ids))]);
    assert.equal(item.human_fact_review, 'pending');
    assert.equal(item.publication, 'unpublished');
  }
});

test('new detailed race scenes cite exact sources and retain human review gate', () => {
  const ledger = read('docs/editorial/batches/drivers-30-v1/SOURCE_CHECKED_SCENES_2026-10-26.json');
  const manuscripts = read('docs/editorial/batches/drivers-30-v1/narrative-chapters-v1.json');
  assert.equal(ledger.scenes.length, 15);
  for (const entry of ledger.scenes) {
    assert.ok(entry.source_urls.length >= 2);
    for (const url of entry.source_urls) assert.match(url, /^https:\/\//);
    assert.equal(entry.status, 'ai_source_checked_human_review_pending');
    const story = manuscripts.stories.find(s => s.driver_id === entry.driver_id);
    assert.ok(story && story.chapters.length >= 2);
    for (const locale of ['en', 'uk']) {
      assert.ok(story.chapters[1][locale].body.split(/\n\n/).at(-1).length > 400);
    }
  }
  assert.equal(ledger.publication, 'unpublished');
});
