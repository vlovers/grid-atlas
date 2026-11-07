import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { candidateCornerGuides, candidateCornerSources, candidateUnnumberedHistoricalRoutes, candidateHistoricalCornerReviewQueue } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { publicCircuitStories } from '../apps/web/src/components/editorial/circuit-public-moments.ts';
import { isCircuitEditionApproved } from '../apps/web/src/components/editorial/circuit-release.ts';
import { renderCircuitReview } from '../scripts/preview-circuit-v3.mjs';

const load = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const worklist = load('docs/editorial/circuit-experience-v3/F1DB_78_RELEASE_WORKLIST.json');
const manifest = load('apps/web/src/components/circuit-layout-manifest.json');
const editorial = 'apps/web/src/components/editorial/';
const snapshots = {
  'circuit-extra-stories.json': '16e34833cf0ce2731be3e2aa76839aab079a8301b53060350886bc67961fe55d',
  'circuit-next20-stories.json': '5d5b6985f293bcd45c9ed3652f72d6aa9a8284fef35d72b9421ebe7a12e07f2b',
  'circuit-final33-stories.json': '823e597129f73ef271aa8130de42f8ba5597f2690a2ff226ec32845180cb63e5',
  'circuit-corner-guides.json': '3554a88c2a8d4c265efbe0d9def0f1c4cb19afb7d85aa905e04432b6cd4babd3',
};

test('public fallbacks preserve exact main bytes while research revisions remain separate', () => {
  for (const [file, digest] of Object.entries(snapshots)) {
    const bytes = readFileSync(new URL(`../${editorial}archive-summaries/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), digest, file);
  }
  const expected = ['extra', 'next20', 'final33'].flatMap(name => load(`${editorial}archive-summaries/circuit-${name}-stories.json`));
  assert.deepEqual(publicCircuitStories, expected);
  const research = ['extra', 'next20', 'final33'].flatMap(name => load(`${editorial}circuit-${name}-stories.json`));
  assert.ok(research.some(story => story.description.en !== publicCircuitStories.find(item => item.id === story.id).description.en));
});

test('all 78 identities retain bilingual, source-linked research and fail-closed publication', () => {
  const records = [...candidateCornerGuides, ...candidateUnnumberedHistoricalRoutes];
  assert.equal(records.length, 78);
  assert.equal(new Set(records.map(x => x.circuit_id)).size, 78);
  assert.deepEqual(records.map(x => x.circuit_id).sort(), worklist.circuits.map(x => x.circuit_id).sort());
  const anchors = new Set();
  for (const record of records) {
    assert.ok(manifest.some(asset => asset.layout_id === record.layout_id), record.circuit_id);
    assert.equal(isCircuitEditionApproved(record.circuit_id), false);
    for (const section of record.sections) {
      assert.ok(section.explanation.en.trim());
      assert.match(section.explanation.uk, /[А-Яа-яІіЇїЄєҐґ]/);
      const sources = section.source_urls ?? section.sources.map(key => candidateCornerSources[key]);
      assert.ok(sources.length);
      for (const source of sources) assert.equal(new URL(source).protocol, 'https:');
      if (section.id) {
        assert.ok(!anchors.has(section.id), section.id);
        anchors.add(section.id);
      } else assert.equal(section.official_turn_numbers, null);
    }
  }
  assert.equal(anchors.size, 1015, 'positions are research inventory, not independently authenticated turns');
  assert.equal(candidateUnnumberedHistoricalRoutes.reduce((n, route) => n + route.sections.length, 0), 68);
  assert.equal(candidateHistoricalCornerReviewQueue.filter(x => x.research_kind === 'period_bend').length, 53);
  assert.equal(candidateHistoricalCornerReviewQueue.filter(x => x.research_kind === 'named_feature').length, 13);
});

test('both private locales render every circuit and every research anchor without certifying provisional numbers', () => {
  for (const locale of ['en', 'uk']) {
    const html = renderCircuitReview(locale, '/review/test');
    assert.equal([...html.matchAll(/data-circuit-review="/g)].length, 78);
    assert.equal([...html.matchAll(/data-candidate-position/g)].length, 1015);
    assert.equal([...html.matchAll(/data-route-section/g)].length, 68);
    assert.equal([...html.matchAll(/data-historical-study=/g)].length, 66);
    for (const guide of candidateCornerGuides) {
      assert.ok(html.includes(`href="#${guide.circuit_id}"`), guide.circuit_id);
      for (const section of guide.sections) assert.ok(html.includes(`id="${section.id}"`), section.id);
      if (guide.sections.some(section => !['source_checked_ai', 'independently_verified'].includes(section.confirmation_status))) {
        const content = html.split(`data-circuit-review="${guide.circuit_id}"`)[1].split('</section>')[0];
        assert.doesNotMatch(content, />T\d/);
      }
    }
    assert.match(html, locale === 'uk' ? /у записі гонки 1967 року — 8/ : /1967 race record has 8/);
    assert.match(html, locale === 'uk' ? /Лише сучасне порівняння 2001/ : /Modern 2001 comparison only/);
  }
});

test('completion audit includes inherited Monaco and Spa while reporting zero complete circuits', () => {
  const report = JSON.parse(execFileSync(process.execPath, ['scripts/audit-circuit-completion.mjs'], { cwd: new URL('../', import.meta.url), encoding: 'utf8' }));
  assert.equal(report.circuits_checked, 78);
  assert.equal(report.complete, 0);
  assert.equal(report.circuits.filter(x => x.numbered_turns !== null).length, 71);
  for (const id of ['monaco', 'spa-francorchamps']) {
    assert.equal(report.circuits.find(x => x.circuit_id === id).numbered_turns, 19);
    assert.ok(!report.circuits.find(x => x.circuit_id === id).issues.includes('individual_numbered_corners_absent'));
  }
});
