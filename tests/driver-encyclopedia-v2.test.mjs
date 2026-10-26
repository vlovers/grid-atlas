import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const manuscripts = read('docs/editorial/batches/drivers-30-v1/narrative-chapters-v1.json');
const audit = read('docs/editorial/batches/drivers-30-v1/READER_QUALITY_AUDIT_2026-10-26.json');

test('six V2 bilingual longreads are traceable, editorial-only, and follow the research chapters', () => {
  const IDs = ['nelson-piquet', 'nico-rosberg', 'jochen-rindt', 'jacques-villeneuve', 'alan-jones', 'nino-farina'];
  for (const id of IDs) {
    const story = manuscripts.stories.find(s => s.driver_id === id);
    assert.ok(story, id);
    const chapters = story.chapters.filter(ch => ch.chapter_id === 'v2-career-perspective');
    assert.equal(chapters.length, 1, id);
    const added = chapters[0];
    assert.ok(added.claim_ids.length >= 1, id);
    for (const locale of ['en', 'uk']) {
      assert.ok(added[locale].heading.length >= 5, id);
      assert.ok(added[locale].body.trim().split(/\s+/).length >= 80, id + '/' + locale);
    }
    assert.equal(audit.stories.find(row => row.driver_id === id).research_chapters, story.chapters.length);
  }
  assert.equal(manuscripts.publication_status, 'unpublished');
  assert.equal(audit.result, 'not_publication_ready');
});
