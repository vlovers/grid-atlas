import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const paths = ['../apps/web/src/components/editorial/circuit-extra-stories.json', '../apps/web/src/components/editorial/circuit-final33-stories.json'];
const rows = paths.flatMap(path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')));
const ids = ["nurburgring","watkins-glen","kyalami","indianapolis","porto","jerez","sirius","mosport","madring","pedralbes","anderstorp","jacarepagua","mont-tremblant","clermont-ferrand"];
test('final 14 short histories preserve EN/UK, independent provenance and publication restrictions', () => {
  assert.equal(ids.length, 14);
  assert.equal(new Set(ids).size, 14);
  const byId = new Map(rows.map(row => [row.id, row]));
  for (const id of ids) {
    const row = byId.get(id);
    assert.ok(row, id);
    assert.ok(row.description.en.length >= 300, id + '/en');
    assert.ok(row.description.uk.length >= 280, id + '/uk');
    assert.match(row.description.uk, /[А-ЯІЇЄҐа-яіїєґ]/u, id);
    assert.equal(row.historical_review_status, 'pending_independent_claim_review', id);
    assert.ok(row.historical_sources.length >= 1, id);
    assert.equal(new Set(row.historical_sources).size, row.historical_sources.length, id + '/distinct sources');
    assert.ok(row.historical_source_locator.length >= 40, id);
    for (const source of row.historical_sources) {
      const narrative = new URL(source);
      assert.equal(narrative.protocol, 'https:', id);
      assert.notEqual(narrative.hostname, 'github.com', id);
      assert.notEqual(narrative.hostname, 'www.formula1.com', id);
      assert.notEqual(row.source, source, id);
    }
    assert.match(row.source, /^https:\/\//, id);
    assert.notEqual(row.human_approval, true, id);
    assert.notEqual(row.publication_allowed, true, id);
  }
});
