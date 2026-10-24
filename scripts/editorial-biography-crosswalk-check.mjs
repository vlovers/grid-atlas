#!/usr/bin/env node
// Validates editorial claim-to-biography candidates without granting review approval.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const batch = 'docs/editorial/batches/drivers-30-v1';
const dossierRoot = process.env.BIOGRAPHY_BATCH2_DOSSIERS || 'docs/editorial/biography-expansion-batch-2/dossiers';
const read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const crosswalk = read(`${batch}/biography-batch2-claim-crosswalk.json`);
const errors = [];
const fail = (message) => errors.push(message);
const validAlignments = new Set(['direct', 'partial', 'unmapped']);
const expectedDrivers = new Set(['niki-lauda','jackie-stewart','sebastian-vettel','mika-hakkinen','jim-clark','juan-manuel-fangio','graham-hill','jack-brabham','emerson-fittipaldi','nigel-mansell']);
const rows = crosswalk.rows ?? [];
const seen = new Set();
const perDriver = new Map();

if (crosswalk.schema_version !== 1 || crosswalk.publication_status !== 'unpublished' || crosswalk.review_status !== 'research_mapping_only') fail('Crosswalk must remain unpublished research-only schema v1');
if (!Array.isArray(rows) || rows.length !== 45) fail('Expected 45 explicit research claim rows');
for (const row of rows) {
  const id = row.driver_id;
  if (!expectedDrivers.has(id)) fail(`Unexpected driver ${id}`);
  if (!row.content_factory_claim_id?.startsWith(`${id}-`)) fail(`Malformed claim ID: ${row.content_factory_claim_id}`);
  if (seen.has(row.content_factory_claim_id)) fail(`Duplicate claim mapping: ${row.content_factory_claim_id}`);
  seen.add(row.content_factory_claim_id);
  if (!validAlignments.has(row.alignment)) fail(`Invalid alignment for ${row.content_factory_claim_id}`);
  if (row.review_status !== 'pending' || row.human_verified !== false) fail(`Crosswalk cannot pre-approve ${row.content_factory_claim_id}`);
  if (!Array.isArray(row.biography_paragraph_ids)) fail(`Missing paragraph ID array for ${row.content_factory_claim_id}`);
  else {
    if ((row.alignment === 'unmapped') !== (row.biography_paragraph_ids.length === 0)) fail(`Unmapped/paragraph mismatch: ${row.content_factory_claim_id}`);
    if (new Set(row.biography_paragraph_ids).size !== row.biography_paragraph_ids.length) fail(`Duplicate paragraph links for ${row.content_factory_claim_id}`);
    for (const paragraph of row.biography_paragraph_ids) if (!paragraph.startsWith(`${id}-b2-`)) fail(`Cross-driver paragraph: ${paragraph}`);
  }
  if (!perDriver.has(id)) perDriver.set(id, []);
  perDriver.get(id).push(row);
}
for (const id of expectedDrivers) {
  const card = read(`${batch}/research/${id}.json`);
  const claimIds = new Set(card.claims.map(c => c.claim_id));
  const mapped = new Set((perDriver.get(id) ?? []).map(r => r.content_factory_claim_id));
  for (const claim of claimIds) if (!mapped.has(claim)) fail(`Research claim omitted: ${claim}`);
  for (const claim of mapped) if (!claimIds.has(claim)) fail(`Research claim missing in card: ${claim}`);
  const dossierPath = `${dossierRoot}/${id}.en.json`;
  if (existsSync(resolve(root, dossierPath))) {
    const dossier = read(dossierPath);
    if (dossier.driver_id !== id || dossier.locale !== 'en') fail(`Wrong dossier identity/locale: ${id}`);
    const paragraphIds = new Set(dossier.claims.map(c => c.claim_id));
    for (const row of perDriver.get(id) ?? []) for (const paragraph of row.biography_paragraph_ids) if (!paragraphIds.has(paragraph)) fail(`Missing dossier paragraph: ${paragraph}`);
  } else if (process.env.REQUIRE_BIOGRAPHY_BATCH2 === '1') fail(`Required dossier not found: ${dossierPath}`);
}
const partial = rows.filter(r => r.alignment === 'partial').length;
const unmapped = rows.filter(r => r.alignment === 'unmapped').length;
if (partial !== 7 || unmapped !== 2) fail(`Unexpected review queue: partial=${partial}, unmapped=${unmapped}`);
if (errors.length) {
  for (const error of errors) console.error(`FAIL: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${rows.length} mappings / ${perDriver.size} drivers / ${partial} partial / ${unmapped} unmapped; no approvals`);
  if (!existsSync(resolve(root, `${dossierRoot}/niki-lauda.en.json`))) console.log('NOTE: #277 dossiers absent; run with REQUIRE_BIOGRAPHY_BATCH2=1 on combined tree for paragraph validation');
}
