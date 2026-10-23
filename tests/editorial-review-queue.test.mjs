import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildEditorialReviewQueue, renderEditorialReviewQueue } from '../scripts/build-editorial-review-queue.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const manifest = () => load('docs/editorial/releases/v1/manifest.json');

test('lists ten bilingual dossiers without granting approval', () => {
  const report = buildEditorialReviewQueue(manifest());
  assert.equal(report.dossiers, 10);
  assert.equal(report.publication_allowed, false);
  assert.ok(report.claims > 0);
  assert.ok(report.pending_claim_reviews > 0);
  assert.ok(report.entries.every(e => e.publication_ready === false));
  assert.match(renderEditorialReviewQueue(report), /michael-schumacher/);
});

test('rejects duplicate identities and unsafe dossier paths', () => {
  const duplicate = manifest();
  duplicate.drivers.push(structuredClone(duplicate.drivers[0]));
  assert.throws(() => buildEditorialReviewQueue(duplicate), /duplicate driver/);
  const unsafe = manifest();
  unsafe.drivers[0].locales.en.dossier = '../secrets.json';
  assert.throws(() => buildEditorialReviewQueue(unsafe), /Invalid dossier\/review path/);
});

test('fails on claim/review mismatches without manufacturing decisions', () => {
  const m = manifest();
  const read = path => {
    const data = load(path);
    if (path === m.drivers[0].locales.en.review) data.claim_reviews['not-a-real-claim'] = null;
    return data;
  };
  assert.throws(() => buildEditorialReviewQueue(m, read), /Claim\/review mismatch/);
});
