import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const research = load('../docs/editorial/circuit-experience-v3/NUMBERED_CORNER_GUIDES_JEDDAH_LUSAIL_YAS_20261102.json');
const candidate = load('../apps/web/src/components/editorial/circuit-corners-v3.json');
const manifest = load('../apps/web/src/components/circuit-layout-manifest.json');
const expected = new Map([['jeddah', ['jeddah-1', 27]], ['lusail', ['lusail-1', 16]], ['yas-marina', ['yas-marina-2', 16]]]);

test('59 individual bilingual corners are integrated with period-correct 2025 FIA maps', () => {
  assert.equal(research.guides.length, 3);
  assert.equal(research.guides.reduce((sum, guide) => sum + guide.numbered_turns, 0), 59);
  assert.ok(candidate.guides.length >= 17);
  assert.ok(candidate.guides.reduce((sum, guide) => sum + guide.numbered_turns, 0) >= 282);
  for (const [id, [layout, count]] of expected) {
    const draft = research.guides.find(g => g.circuit_id === id);
    const integrated = candidate.guides.find(g => g.circuit_id === id);
    assert.ok(draft && integrated, id);
    assert.equal(integrated.layout_id, layout);
    assert.ok(manifest.some(entry => entry.layout_id === layout), id + ': F1DB SVG missing');
    assert.equal(integrated.numbering_year, 2025);
    assert.equal(integrated.numbered_turns, count);
    assert.equal(integrated.sections.length, count);
    assert.equal(integrated.review_status, 'independent_review_pending');
    assert.deepEqual(integrated.sections.flatMap(s => s.numbers), Array.from({length: count}, (_, i) => i+1));
    assert.deepEqual(integrated.sections, draft.sections, id + ': source manuscript / candidate mismatch');
    assert.equal(candidate.sources[id+'-map'], draft.sources.map);
    assert.equal(candidate.sources[id+'-names'], draft.sources.names);
    assert.match(candidate.sources[id+'-map'], /^https:\/\/www\.fia\.com\/system\/files\/decision-document\/2025_/);
    assert.match(candidate.sources[id+'-names'], /^https:\/\/www\.formula1\.com\/en\//);
    const en = new Set(), uk = new Set();
    for (const section of integrated.sections) {
      assert.equal(section.name, null, id + ': unverified proper name');
      assert.equal(section.numbers.length, 1);
      assert.equal(section.confirmation_status, 'source_checked_ai');
      assert.deepEqual(section.sources, [id+'-map', id+'-names']);
      assert.ok(section.explanation.en.trim().split(/\s+/).length >= 25, section.id+':en');
      assert.ok(section.explanation.uk.trim().split(/\s+/).length >= 18, section.id+':uk');
      assert.match(section.explanation.uk, /[ІіЇїЄєҐґА-Яа-я]/);
      assert.doesNotMatch(section.explanation.en, /[ІіЇїЄєҐґА-Яа-я]/);
      en.add(section.explanation.en); uk.add(section.explanation.uk);
    }
    assert.equal(en.size, count, id + ': duplicated English corner prose');
    assert.equal(uk.size, count, id + ': duplicated Ukrainian corner prose');
  }
});

test('named landmarks, DRS details and pre-2021 Yas geometry remain period-scoped', () => {
  const jeddah = candidate.guides.find(g => g.circuit_id === 'jeddah');
  assert.match(jeddah.sections[12].explanation.en, /banked/);
  assert.match(jeddah.sections[26].explanation.en, /DRS/);
  const lusail = candidate.guides.find(g => g.circuit_id === 'lusail');
  assert.match(lusail.sections[15].explanation.en, /305 metres/);
  const yas = candidate.guides.find(g => g.circuit_id === 'yas-marina');
  assert.match(yas.sections[4].explanation.en, /2021/);
  assert.match(yas.sections[8].explanation.en, /2021/);
  assert.equal(yas.layout_id, 'yas-marina-2');
});

test('research is never publication or image-reuse approval', () => {
  assert.equal(research.publication_authorized, false);
  assert.equal(research.review_status, 'independent_review_pending');
  assert.match(research.media_policy, /no image republication/);
  const release = load('../apps/web/src/components/editorial/circuit-release.json');
  for (const id of expected.keys()) assert.ok(!release.editions.some(e => e.circuit_id === id), id + ': cannot auto-publish');
});
