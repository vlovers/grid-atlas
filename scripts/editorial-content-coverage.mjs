#!/usr/bin/env node
// Offline editorial coverage audit. Never signs, approves or publishes content.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const load = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const batch = load('docs/editorial/batches/drivers-30-v1.json');
const release = load('docs/editorial/releases/v1/manifest.json');
const existing = new Map(release.drivers.map(row => [row.driver_id, row]));
const ids = batch.drivers.map(row => row.driver_id);
if (ids.length !== 30 || new Set(ids).size !== ids.length) throw new Error('Batch must contain 30 unique candidates');
const results = batch.drivers.map(candidate => {
  const record = existing.get(candidate.driver_id);
  const locales = {};
  for (const locale of ['en', 'uk']) {
    const refs = record?.locales?.[locale];
    if (!refs) { locales[locale] = { state: 'missing', claims: 0, sources: 0, reviewed: 0 }; continue; }
    for (const path of [refs.dossier, refs.review]) if (!existsSync(resolve(root, path))) throw new Error('Missing release file: ' + path);
    const dossier = load(refs.dossier), review = load(refs.review);
    const claims = dossier.claims ?? [];
    const decisions = review.claim_reviews ?? {};
    const reviewed = claims.filter(claim => decisions[claim.claim_id] != null).length;
    locales[locale] = { state: 'research_draft', claims: claims.length, sources: (dossier.sources ?? []).length, reviewed, published: false };
  }
  const en = record ? load(record.locales.en.dossier) : null;
  const uk = record ? load(record.locales.uk.dossier) : null;
  const enIds = (en?.claims ?? []).map(x => x.claim_id).sort();
  const ukIds = (uk?.claims ?? []).map(x => x.claim_id).sort();
  const parity = JSON.stringify(enIds) === JSON.stringify(ukIds);
  return { driver_id: candidate.driver_id, identity_verified: false, locales, claim_id_parity: record ? parity : null, ready_for_publication: false };
});
const totals = { candidates: results.length, existing_bilingual_drafts: results.filter(x => x.locales.en.state !== 'missing' && x.locales.uk.state !== 'missing').length, new_candidates: results.filter(x => x.locales.en.state === 'missing').length, english_claims: results.reduce((n,x)=>n+x.locales.en.claims,0), ukrainian_claims: results.reduce((n,x)=>n+x.locales.uk.claims,0), approved_for_publication: 0 };
if (results.some(x => x.claim_id_parity === false)) { console.error('Bilingual claim ID mismatch'); process.exitCode = 1; }
process.stdout.write(JSON.stringify({ batch_id: batch.batch_id, totals, drivers: results }, null, 2) + '\n');
