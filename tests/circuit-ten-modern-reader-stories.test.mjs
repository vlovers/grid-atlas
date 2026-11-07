import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const doc = JSON.parse(readFileSync(
  new URL('../docs/editorial/circuit-experience-v3/next25-research-leads.json', import.meta.url),
  'utf8',
));
const chapters = new Map(doc.circuits.map((circuit) => [circuit.candidate_slug, circuit]));
const independentSources = new Map([
  ['baku', ['motorsportmagazine.com', 0]],
  ['jeddah', ['motorsportmagazine.com', 0]],
  ['lusail', ['motorsportmagazine.com', 2]],
  ['miami', ['bbc.co.uk', 0]],
  ['las-vegas-strip', ['theguardian.com', 0]],
  ['portimao', ['motorsportmagazine.com', 0]],
  ['mugello', ['motorsportmagazine.com', 0]],
  ['valencia-street', ['motorsportmagazine.com', 0]],
  ['korea-international', ['the-independent.com', 0]],
  ['sochi', ['motorsportmagazine.com', 0]],
]);
const translatedTitles = new Map([
  ['miami', [3]], ['watkins-glen', [2, 3]], ['kyalami', [3]],
  ['paul-ricard', [2, 3]], ['magny-cours', [2, 3]],
  ['estoril', [2, 3, 4]], ['portimao', [2]], ['mugello', [2]],
  ['donington-park', [4]], ['valencia-street', [2, 4]],
  ['korea-international', [1, 3]], ['buddh', [2, 4]],
  ['sochi', [2]], ['phoenix-street', [2, 3]], ['detroit-street', [2]],
]);

test('ten modern circuit scenes have substantial EN/UK narratives with independent period coverage', () => {
  assert.equal(independentSources.size, 10);
  for (const [slug, [domain, index]] of independentSources) {
    const circuit = chapters.get(slug);
    assert.ok(circuit, `Missing circuit ${slug}`);
    const story = circuit.story_leads[index];
    assert.ok(story, `Missing story ${slug}/${index}`);
    for (const lang of ['en', 'uk']) {
      const paragraphs = story.narrative[lang].split(/\n\s*\n/).filter(Boolean);
      assert.equal(paragraphs.length, 2, `${slug}/${lang}: two complete narrative paragraphs`);
      assert.ok(story.narrative[lang].trim().split(/\s+/).length >= 70,
        `${slug}/${lang}: narrative must not collapse to a results caption`);
    }
    assert.match(story.narrative.uk, /[А-ЯІЇЄҐа-яіїєґ]/u, `${slug}: missing Ukrainian prose`);
    assert.ok(story.sources.some((url) => new URL(url).hostname.endsWith(domain)),
      `${slug}: missing independent historical report`);
    assert.ok(story.sources.some((url) => new URL(url).hostname.endsWith('formula1.com')),
      `${slug}: preserve official classification provenance`);
    assert.notEqual(story.status, 'approved', `${slug}: no self-granted human approval`);
    assert.equal(circuit.publication, 'unpublished', `${slug}: no automatic publication`);
  }
  assert.equal(doc.publication, 'blocked');
  assert.equal(doc.status, 'research_only');
});

test('24 previously untranslated headings are now Ukrainian', () => {
  let checked = 0;
  for (const [slug, indices] of translatedTitles) {
    const circuit = chapters.get(slug);
    assert.ok(circuit, `Missing circuit ${slug}`);
    for (const index of indices) {
      const title = circuit.story_leads[index].title;
      assert.notEqual(title.uk, title.en, `${slug}/${index}: untranslated title`);
      assert.match(title.uk, /[А-ЯІЇЄҐа-яіїєґ]/u, `${slug}/${index}: missing Cyrillic title`);
      checked++;
    }
  }
  assert.equal(checked, 24);
});
