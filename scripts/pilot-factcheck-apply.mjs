#!/usr/bin/env node
/**
 * Re-check independent fact-check verdicts with the editorial policy and write the durable record.
 *
 * A checker's VERIFIED counts only if the policy also accepts the resulting claim: every excerpt must
 * occur in the stored snapshot, numbers and names must be evidenced, dataset values must match the
 * pinned release, critical claims need two independent publishers (or a canonical dataset statement),
 * and the checker must be independent of the text's writer.
 *
 * Committed output stores no third-party text: excerpts become (source, sha256, offset, length) locators
 * in the whitespace-normalised snapshot. The checker's own assertion and notes are kept.
 *
 * Usage: node scripts/pilot-factcheck-apply.mjs <results-dir> <packages-dir>
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  F1dbIndex, datasetConflicts, extractClaims, legacyWriter, loadCorpus, normalizeWhitespace, ukNameMap, verdictToClaim,
} from '../packages/editorial-evidence/src/index.ts';
import { checkClaim, normalizeText, registrableDomain, sha256 } from '../packages/editorial-policy/src/index.ts';

const root = resolve(import.meta.dirname, '..');
const [resultsDir, packagesDir] = process.argv.slice(2).map(p => resolve(p));
const OUT = join(root, 'docs/editorial/circuit-evidence/pilot-factcheck');
mkdirSync(OUT, { recursive: true });
const archive = JSON.parse(readFileSync(join(root, 'docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json'), 'utf8'));
const table = JSON.parse(readFileSync(join(root, 'docs/editorial/names/uk-name-table.json'), 'utf8'));
const index = new F1dbIndex(archive, ukNameMap(table.entries));
const status = JSON.parse(readFileSync(join(root, 'docs/editorial/circuit-evidence/source-status.json'), 'utf8'));
const candidates = new Map(loadCorpus(root).blocks.flatMap(extractClaims).map(c => [c.claim_id, c]));
const fetcher = { id: 'source-fetch', role: 'research', run_id: 'source-fetch-2026-11' };
const ctx = { pinned_dataset_release: archive.source.release, dataset: index.lookup, entities: index.entities,
  renderStructured: index.renderStructured, datasetConflicts: datasetConflicts(index), evaluated_at: new Date().toISOString() };

const MAP = { VERIFIED: 'supported', DISPUTED: 'disputed', UNSUPPORTED: 'insufficient', UNVERIFIABLE: 'insufficient' };
const summary = {};
for (const file of readdirSync(resultsDir).filter(f => f.endsWith('.json'))) {
  const result = JSON.parse(readFileSync(join(resultsDir, file), 'utf8'));
  const pkg = JSON.parse(readFileSync(join(packagesDir, `${result.circuit_id}.json`), 'utf8'));
  // Checkers sometimes copy the brief's placeholder timestamp; the run's real completion time is when it
  // wrote the result file. That is what the record uses; the declared value is kept for transparency.
  const declaredAt = result.checked_at;
  result.checked_at = statSync(join(resultsDir, file)).mtime.toISOString();
  const checker = { id: result.checker, role: 'fact_check', run_id: `${result.checker}@${result.checked_at}` };
  const records = [];
  for (const v of result.verdicts) {
    const candidate = candidates.get(v.claim_id);
    const pkgClaim = pkg.claims.find(c => c.claim_id === v.claim_id);
    if (!candidate || !pkgClaim) { records.push({ claim_id: v.claim_id, final: 'unknown_claim' }); continue; }
    // Snapshots for every source the checker cited, rebuilt from the local store and verified by hash.
    const snapshots = [];
    for (const id of new Set((v.evidence ?? []).map(e => e.source_id))) {
      const row = status[id];
      const path = row?.text_sha256 ? join(root, '.grid-atlas/source-snapshots', `${row.text_sha256}.txt`) : null;
      if (!path || !existsSync(path)) continue;
      const text = readFileSync(path, 'utf8');
      if (sha256(text) !== row.text_sha256) continue;
      snapshots.push({ source_id: id, url: row.url, title: id, publisher: registrableDomain(new URL(row.url).hostname), kind: 'publication', published_on: null,
        retrieved_at: row.checked_at, retrieved_by: fetcher, content_sha256: row.text_sha256, text });
    }
    // The checker names the record; the value comes from the pinned dataset itself (checkers sometimes
    // annotate values in prose). Whether the checker's own reading agreed is recorded separately.
    const datasetRows = (v.dataset ?? []).map(d => {
      const dataset_ref = { dataset: 'f1db', release: archive.source.release, record: /^(layout|circuit|race):/.test(String(d.race_id)) ? String(d.race_id) : `race:${d.race_id}`, field: d.field };
      const actual = index.lookup(dataset_ref);
      const claimed = String(d.value ?? '').split(/[\s(]/)[0];
      return { dataset_ref, actual, checker_value_agrees: actual ? String(actual.value) === claimed || String(actual.value).split(' / ').includes(claimed) : false };
    });
    const dataset = datasetRows.filter(r => r.actual).map(r => ({ dataset_ref: r.dataset_ref, value: r.actual.value }));
    const checkerDatasetDisagreements = datasetRows.filter(r => !r.checker_value_agrees).map(r => `${r.dataset_ref.record}.${r.dataset_ref.field}`);
    const verdict = { claim_id: v.claim_id, verdict: v.contradicted ? 'contradicted' : MAP[v.verdict] ?? 'insufficient',
      evidence: (v.evidence ?? []).map(e => ({ source_id: e.source_id, excerpt: e.excerpt, locator: e.locator })), dataset_evidence: dataset,
      checker, checked_at: result.checked_at, notes: v.notes };
    let policy;
    try {
      const claim = verdictToClaim(candidate, verdict, snapshots, index.isDriverNameWord);
      policy = checkClaim(claim, { sources: snapshots, authorship: { writer: legacyWriter(candidate.provenance.file), fact_checker: checker, localizer: null } }, ctx);
    } catch (error) { policy = { failures: [{ code: 'verdict_rejected', message: String(error.message ?? error) }], unverifiable: [] }; }
    const policyCodes = [...new Set([...policy.failures, ...policy.unverifiable].map(f => f.code))];
    const final = v.verdict === 'VERIFIED' ? (policyCodes.length ? 'checker_verified_policy_rejected' : 'verified')
      : v.verdict === 'DISPUTED' ? 'disputed' : v.verdict === 'UNSUPPORTED' ? (v.contradicted ? 'contradicted' : 'unsupported') : 'unverifiable';
    // Locators instead of third-party text.
    const evidence = (v.evidence ?? []).map(e => {
      const snap = snapshots.find(s => s.source_id === e.source_id);
      const hay = snap ? normalizeWhitespace(snap.text) : '';
      const at = hay ? normalizeText(hay).indexOf(normalizeText(e.excerpt)) : -1;
      return { source_id: e.source_id, excerpt_sha256: sha256(normalizeWhitespace(e.excerpt)), offset: at, length: normalizeWhitespace(e.excerpt).length, locator: e.locator, found_in_snapshot: at >= 0 };
    });
    records.push({ claim_id: v.claim_id, block_kind: pkgClaim.block_kind, assertion: v.assertion, checker_verdict: v.verdict, contradicted: Boolean(v.contradicted),
      final, policy_findings: policyCodes, checker_dataset_disagreements: checkerDatasetDisagreements, evidence, dataset: v.dataset ?? [], uk_matches_en: v.uk_matches_en, uk_issue: v.uk_issue ?? null,
      issues: v.issues ?? [], notes: v.notes ?? null });
  }
  const counts = {};
  for (const r of records) counts[r.final] = (counts[r.final] ?? 0) + 1;
  const covered = new Set(records.map(r => r.claim_id));
  const missing = pkg.claims.filter(c => !covered.has(c.claim_id)).map(c => c.claim_id);
  writeFileSync(join(OUT, `${result.circuit_id}.json`), `${JSON.stringify({ circuit_id: result.circuit_id, checker: result.checker, checked_at: result.checked_at, checker_declared_at: declaredAt,
    policy_version: 'grid-atlas-editorial-policy/1.8.0', claims_in_package: pkg.claims.length, claims_checked: records.length, missing_claims: missing, counts, records }, null, 1)}\n`);
  summary[result.circuit_id] = { checked: records.length, of: pkg.claims.length, missing: missing.length, ...counts };
}
console.log(JSON.stringify(summary, null, 1));
