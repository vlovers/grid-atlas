import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const candidate = JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-corners-v3.json', import.meta.url), 'utf8'));

test('official Formula 1 evidence URLs use one canonical article ID, not duplicated slugs', () => {
  for (const [key, url] of Object.entries(candidate.sources)) {
    assert.match(url, /^https:\/\//, key + ': HTTPS evidence link');
    assert.doesNotMatch(url, /\.([A-Za-z0-9]{15,})\.\1$/, key + ': repeated F1 article ID');
  }
  for (const key of ['baku-names','melbourne-names','istanbul-names','sirius-race','magny-cours-race']) {
    assert.match(candidate.sources[key], /^https:\/\/www\.formula1\.com\/en\/latest\/article\//, key);
  }
});

test('every candidate turn points to existing source keys; source links do not grant image rights', () => {
  for (const guide of candidate.guides) {
    assert.equal(guide.review_status, 'independent_review_pending');
    for (const section of guide.sections) {
      assert.ok(section.sources.length >= 2, section.id);
      assert.ok(section.sources.every(key => Object.hasOwn(candidate.sources, key)), section.id);
    }
  }
});
