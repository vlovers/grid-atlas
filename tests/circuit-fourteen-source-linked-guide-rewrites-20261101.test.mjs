import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guides = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-corner-guides.json', import.meta.url), 'utf8'));
const byId = new Map(guides.map((guide) => [guide.id, guide]));
const ids = [
  'fuji', 'miami', 'sepang', 'kyalami', 'adelaide', 'melbourne', 'las-vegas',
  'sirius', 'lusail', 'yeongam', 'detroit', 'phoenix', 'valencia', 'buddh',
  'long-beach', 'bremgarten', 'watkins-glen', 'magny-cours', 'estoril',
];

test('all 78 guides and 166 sections remain present after 19 bilingual history rewrites', () => {
  assert.equal(guides.length, 78);
  assert.equal(byId.size, 78);
  assert.equal(guides.reduce((count, guide) => count + guide.sections.length, 0), 166);
  assert.equal(new Set(ids).size, 19);
  for (const guide of guides) {
    assert.ok(guide.sections.length >= 2, guide.id);
    for (const section of guide.sections) {
      assert.ok(section.en?.trim() && section.uk?.trim(), guide.id);
      assert.match(section.source, /^https:\/\//, guide.id);
    }
  }
});

test('19 formerly generic sections now tell specific EN/UK race stories with historical reports', () => {
  const oldLabels = /^(Start with the race record|Start with the debut result|Why a debut can be memorable|Street circuit versus permanent track|Follow the race beyond the winner|One city, one different layout|Connect the race to the season|Decode the venue's identity)$/;
  for (const id of ids) {
    const section = byId.get(id)?.sections[1];
    assert.ok(section, id);
    assert.doesNotMatch(section.label, oldLabels, id);
    assert.ok(section.en.trim().split(/\s+/).length >= 45, id + ':en');
    assert.ok(section.uk.trim().split(/\s+/).length >= 40, id + ':uk');
    assert.match(section.uk, /[А-Яа-яІіЇїЄєҐґ]/, id + ':uk');
    assert.doesNotMatch(section.en, /[А-Яа-яІіЇїЄєҐґ]/, id + ':en');
    assert.doesNotMatch(section.source, /github\.com\/f1db\/f1db/, id + ':historical-source');
  }
});

test('distinctive evidence boundaries remain visible in sensitive circuits', () => {
  const argentina = byId.get('buenos-aires').sections[1];
  assert.match(argentina.en, /71 laps.*7\.136.*72 laps.*6\.407/);
  assert.match(argentina.uk, /71 коло.*7,136.*72 кола.*6,407/);
  const madrid = byId.get('madring').sections[1];
  assert.match(madrid.en, /4\.351.*0\.738/);
  assert.match(madrid.uk, /4,351.*0,738/);
  assert.match(byId.get('melbourne').sections[0].source, /1996\/races\/638\/australia\/race-result/);
});
