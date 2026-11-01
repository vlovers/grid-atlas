#!/usr/bin/env node
/**
 * Read-only, fail-closed circuit completeness audit.
 *
 * Usage: node scripts/audit-circuit-completion.mjs [--batch=1|2|3|4] [--strict]
 * --strict exits with code 1 unless every selected circuit clears every gate.
 * This audit never grants publication approval or changes editorial status.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const load = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const worklist = load('docs/editorial/circuit-experience-v3/F1DB_78_RELEASE_WORKLIST.json');
const model = load('apps/web/src/components/editorial/circuit-corners-v3.json');
const shortGuides = load('apps/web/src/components/editorial/circuit-corner-guides.json');
const layouts = load('apps/web/src/components/circuit-layout-manifest.json');
const release = load('apps/web/src/components/editorial/circuit-release.json');

const args = process.argv.slice(2);
const unknown = args.filter(x => x !== '--strict' && !/^--batch=[1-4]$/.test(x));
if (unknown.length) {
  console.error('Unknown arguments:', unknown.join(', '));
  process.exit(2);
}
const batchOption = args.find(x => x.startsWith('--batch='));
const batch = batchOption ? Number(batchOption.slice(8)) : null;
const ordered = [...worklist.circuits].sort((a, b) => a.circuit_id.localeCompare(b.circuit_id, 'en'));
const expected = [20, 20, 20, 18];
const offset = batch === null ? 0 : expected.slice(0, batch - 1).reduce((a, b) => a + b, 0);
const selected = batch === null ? ordered : ordered.slice(offset, offset + expected[batch - 1]);
const guideMap = new Map(model.guides.map(x => [x.circuit_id, x]));
const shortMap = new Map(shortGuides.map(x => [x.id, x]));
const assetIds = new Set(layouts.map(x => x.layout_id));
const approved = new Set((release.editions ?? []).filter(x => x.publication_allowed === true && x.human_approval === true).map(x => x.circuit_id));

const rows = selected.map(circuit => {
  const id = circuit.circuit_id;
  const guide = guideMap.get(id);
  const short = shortMap.get(id);
  const issues = [];
  if (!short || !short.sections?.length) issues.push('short_corner_guides_absent');
  if (!guide) {
    issues.push('individual_numbered_corners_absent');
  } else {
    if (!assetIds.has(guide.layout_id)) issues.push('layout_asset_unmapped');
    const numbers = guide.sections.flatMap(s => s.numbers ?? []);
    const unique = new Set(numbers);
    if (numbers.length !== unique.size || numbers.length !== guide.numbered_turns ||
      Array.from({ length: guide.numbered_turns }, (_, i) => i + 1).some(n => !unique.has(n))) {
      issues.push('corner_number_coverage_invalid');
    }
    if (guide.sections.some(s => s.numbers.length !== 1)) issues.push('grouped_corners_not_individual');
    if (guide.sections.some(s => !s.explanation?.en?.trim() || !s.explanation?.uk?.trim())) issues.push('corner_bilingual_explanation_missing');
    if (guide.sections.some(s => !s.sources?.length || s.sources.some(key => !model.sources[key]))) issues.push('corner_source_missing');
    if (guide.review_status !== 'approved') issues.push('independent_corner_review_pending');
  }
  if (circuit.independent_claim_check !== 'approved') issues.push('independent_claim_review_pending');
  if (circuit.historical_layout_check !== 'approved') issues.push('historical_layout_review_pending');
  if (circuit.turn_names_and_numbers_check !== 'approved') issues.push('corner_historical_names_review_pending');
  if (circuit.photo_rights_check !== 'approved') issues.push('media_rights_review_pending');
  if (circuit.bilingual_line_edit !== 'approved') issues.push('bilingual_editorial_review_pending');
  if (!approved.has(id) || circuit.publication !== 'approved') issues.push('publication_approval_absent');
  // Browser/mobile E2E is a runtime gate: this static script cannot certify it.
  issues.push('runtime_browser_mobile_validation_not_evidenced');
  return { circuit_id: id, status: issues.length ? 'IN_PROGRESS' : 'COMPLETE',
    numbered_turns: guide?.numbered_turns ?? null,
    individually_authored_sections: guide?.sections.filter(s => s.numbers.length === 1).length ?? 0,
    issues };
});
if (ordered.length !== 78 || new Set(ordered.map(x => x.circuit_id)).size !== 78) {
  console.error('Expected exactly 78 distinct F1DB circuit IDs in canonical worklist.');
  process.exit(2);
}
const counts = {};
for (const row of rows) for (const issue of row.issues) counts[issue] = (counts[issue] ?? 0) + 1;
const output = {
  audit: 'circuit-completion-static-gates-v1',
  base: 'current checkout; review CI evidence separately',
  batch, circuits_checked: rows.length,
  complete: rows.filter(x => x.status === 'COMPLETE').length,
  issues_by_type: counts, circuits: rows,
  limitations: [
    'Source URLs are not independently fetched or claim-verified.',
    'Media licensing is not audited by this script.',
    'Historical configuration and race-specific corner numbering need independent evidence.',
    'Human review and actual browser/mobile execution are separate release gates.',
    'A grouped section or bilingual placeholder is not a complete individual corner dossier.'
  ]
};
console.log(JSON.stringify(output, null, 2));
if (args.includes('--strict') && output.complete !== rows.length) process.exitCode = 1;
