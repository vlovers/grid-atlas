import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { auditStaging } from '../scripts/audit-media-staging.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const data = () => [load('docs/media/cross-era-staging.json'), load('docs/media/candidates.json'), load('apps/web/src/components/media/publication.json'), load('docs/media/pilot-identities.json')];
test('staging passes integrity audit while unresolved pilot identities are reported', () => {
  const result = auditStaging(...data());
  assert.equal(result.ok, true, result.errors.join('; '));
  assert.equal(result.entries, 5);
  assert.equal(result.identity_matches_pilot.length, 1);
  assert.equal(result.unresolved_identities.length, 4);
});
test('rejects research candidate leakage into publication', () => {
  const [staging, candidates, publication, pilot] = data();
  publication.assets.push({ ...staging.entries[0] });
  assert.equal(auditStaging(staging, candidates, publication, pilot).ok, false);
});
test('rejects duplicate Commons file pages', () => {
  const args = data();
  args[0].entries[1].file_page_url = args[0].entries[0].file_page_url;
  assert.equal(auditStaging(...args).ok, false);
});
test('rejects accidental approval of research media', () => {
  const args = data();
  args[0].entries[0].status = 'verified';
  assert.equal(auditStaging(...args).ok, false);
});
test('rejects any staging header that permits publication', () => {
  const args = data();
  args[0].publication_allowed = true;
  assert.equal(auditStaging(...args).ok, false);
});
