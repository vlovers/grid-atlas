import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guides = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-corner-guides.json', import.meta.url), 'utf8'));
const ids = [
  'aida', 'dallas', 'aintree', 'avus', 'caesars-palace', 'ain-diab', 'anderstorp',
  'buenos-aires', 'bugatti', 'clermont-ferrand', 'dijon', 'jacarepagua',
  'monsanto', 'mont-tremblant', 'mosport', 'montjuic', 'east-london', 'jarama',
  'jerez', 'madring', 'nivelles', 'pedralbes', 'pescara', 'porto', 'reims',
  'riverside', 'rouen', 'sebring', 'zeltweg', 'zolder',
];
const byId = new Map(guides.map((g) => [g.id, g]));

test('all 78 source guides survive 30 historical EN/UK rewrites', () => {
  assert.equal(guides.length, 78);
  assert.equal(new Set(guides.map((g) => g.id)).size, 78);
  assert.equal(guides.reduce((sum, g) => sum + g.sections.length, 0), 166);
  assert.equal(ids.length, 30);
  assert.equal(new Set(ids).size, 30);
  for (const id of ids) {
    const section = byId.get(id)?.sections[1];
    assert.ok(section, id);
    assert.ok(section.label.length >= 15, id);
    assert.ok(section.en.trim().split(/\s+/).length >= 30, id + ':en');
    assert.ok(section.uk.trim().split(/\s+/).length >= 28, id + ':uk');
    assert.match(section.source, /^https:\/\//, id);
    assert.doesNotMatch(section.label, /^(Start with the race record|Where to start watching|How to explore this historic venue)$/, id);
    assert.doesNotMatch(section.en, /Start with the cited race|Start with the race classification|A single Grand Prix result becomes/, id);
    assert.doesNotMatch(section.en, /[А-Яа-яІіЇїЄєҐґ]/, id + ':mixed en');
    assert.match(section.uk, /[А-Яа-яІіЇїЄєҐґ]/, id + ':uk script');
  }
});

test('Buenos Aires 1995 retains both incompatible published classifications', () => {
  const s = byId.get('buenos-aires').sections[1];
  assert.match(s.en, /71 laps.*7\.136.*72 laps.*6\.407/);
  assert.match(s.uk, /71 коло.*7,136.*72 кола.*6,407/);
  assert.match(s.source, /motorsportmagazine\.com/);
  assert.match(s.comparison_source, /formula1\.com\/en\/results\/1995/);
});

test('Madring 2026 distinguishes winner gap from second-to-third gap', () => {
  const s = byId.get('madring').sections[1];
  assert.match(s.en, /4\.351.*0\.738/);
  assert.match(s.uk, /4,351.*0,738/);
  assert.match(s.source, /reuters\.com/);
  assert.match(s.comparison_source, /formula1\.com\/en\/results\/2026/);
  assert.match(s.en, /not a 0\.738-second winning margin/);
});

test('sensitive source conflicts are not silently collapsed into confident numbers', () => {
  assert.match(byId.get('montjuic').sections[1].en, /accounts differ on the early death toll/);
  assert.match(byId.get('porto').sections[1].en, /disagree on whether the liquid was fuel or oil/);
  assert.match(byId.get('anderstorp').sections[1].en, /rather than claiming.*formally banned/);
});
