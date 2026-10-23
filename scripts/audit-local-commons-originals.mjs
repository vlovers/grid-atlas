import { lstatSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { inspectOriginal } from './inspect-media-original.mjs';
import { assertPrivateOriginalDirectory } from './private-original-directory.mjs';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const hex40 = /^[a-f0-9]{40}$/;
const hex64 = /^[a-f0-9]{64}$/;

/**
 * Re-inspect locally retained originals against pinned Commons evidence and
 * previously observed binary SHA-256 receipts. Never reads from the network,
 * copies images into the repo, or grants publication rights.
 */
export function auditLocalCommonsOriginals({
  outputDir, staging, sourceEvidence, observations,
  inspectImpl = inspectOriginal
}) {
  const directory = assertPrivateOriginalDirectory(outputDir);
  if (staging?.schema_version !== 1 || staging.lane !== 'research_only' ||
      staging.publication_allowed !== false || !Array.isArray(staging.entries) ||
      sourceEvidence?.schema_version !== 1 || sourceEvidence.lane !== 'research_only' ||
      sourceEvidence.publication_allowed !== false || !Array.isArray(sourceEvidence.entries) ||
      observations?.schema_version !== 1 || observations.lane !== 'research_only' ||
      observations.publication_allowed !== false || !Array.isArray(observations.entries)) {
    throw Error('Invalid research-only manifests');
  }
  const byId = new Map(), observed = new Map();
  for (const source of sourceEvidence.entries) {
    if (!/^research-[a-z0-9-]+$/.test(source?.research_id ?? '') ||
        byId.has(source.research_id) || !hex40.test(source.sha1 ?? '') ||
        !Number.isSafeInteger(source.bytes) || source.bytes < 16 ||
        !Number.isSafeInteger(source.width) || source.width < 1 ||
        !Number.isSafeInteger(source.height) || source.height < 1) {
      throw Error('Invalid or duplicate pinned Commons source evidence');
    }
    byId.set(source.research_id, source);
  }
  for (const receipt of observations.entries) {
    const source = byId.get(receipt?.research_id);
    if (!source || observed.has(receipt.research_id) ||
        !hex64.test(receipt.sha256 ?? '') ||
        receipt.sha1 !== source.sha1 || receipt.bytes !== source.bytes) {
      throw Error('Invalid, duplicate or unpinned observed original SHA-256');
    }
    observed.set(receipt.research_id, receipt);
  }
  const ids = new Set(), results = [];
  for (const entry of staging.entries) {
    if (!/^research-[a-z0-9-]+$/.test(entry?.id ?? '') || ids.has(entry.id)) {
      throw Error('Invalid or duplicate staged research ID');
    }
    ids.add(entry.id);
    const source = byId.get(entry.id);
    if (!source || source.file_page_url !== entry.file_page_url ||
        entry.status !== 'candidate' || entry.review !== null ||
        entry.delivery?.local_path !== null || entry.delivery?.remote_url !== null ||
        !['image/jpeg', 'image/png'].includes(entry.image?.mime)) {
      throw Error('Staging or source evidence mismatch for ' + entry.id);
    }
    const extension = entry.image.mime === 'image/png' ? '.png' : '.jpg';
    const filePath = join(directory, entry.id + extension);
    try {
      lstatSync(filePath);
    } catch (error) {
      if (error?.code === 'ENOENT') {
        results.push({ research_id: entry.id, status: 'pending_original', previously_observed_sha256: observed.has(entry.id) });
        continue;
      }
      throw error;
    }
    try {
      const inspection = inspectImpl({ filePath, researchId: entry.id, staging, sourceEvidence });
      const original = inspection?.local_original;
      if (inspection?.research_id !== entry.id || inspection.publication_allowed !== false ||
          inspection.source_evidence?.matched !== true ||
          inspection.source_file_page !== source.file_page_url ||
          !hex64.test(original?.sha256 ?? '') || original.sha1 !== source.sha1 ||
          original.bytes !== source.bytes || original.width !== source.width ||
          original.height !== source.height || original.mime !== entry.image.mime) {
        throw Error('Original inspection differs from pinned Commons source');
      }
      const previous = observed.get(entry.id);
      if (previous && previous.sha256 !== original.sha256) {
        throw Error('Original SHA-256 differs from prior verified observation');
      }
      results.push({
        research_id: entry.id,
        status: previous ? 'matched_prior_sha256' : 'inspected_new_sha256',
        sha256: original.sha256, sha1: original.sha1, bytes: original.bytes,
        rights_review: 'pending', subject_review: 'pending'
      });
    } catch (error) {
      results.push({ research_id: entry.id, status: 'blocked', reason: error instanceof Error ? error.message : String(error) });
    }
  }
  if (ids.size !== byId.size) throw Error('Pinned Commons evidence contains unstaged candidates');
  const blocked = results.filter(item => item.status === 'blocked').length;
  const inspected = results.filter(item => item.status === 'matched_prior_sha256' || item.status === 'inspected_new_sha256').length;
  return {
    schema_version: 1, kind: 'offline_original_audit_not_publication',
    publication_allowed: false, rights_review: 'pending', subject_review: 'pending',
    complete: blocked === 0 && inspected === results.length,
    ok: blocked === 0, total: results.length, inspected, blocked,
    pending: results.length - inspected - blocked, results
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { 'output-dir': { type: 'string' } } });
    if (!values['output-dir']) throw Error('Usage: node scripts/audit-local-commons-originals.mjs --output-dir /existing/private/directory');
    const report = auditLocalCommonsOriginals({
      outputDir: values['output-dir'],
      staging: load('docs/media/cross-era-staging.json'),
      sourceEvidence: load('docs/media/commons-original-evidence.json'),
      observations: load('docs/media/verified-original-observations.json')
    });
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } catch (error) {
    console.error('Offline Commons originals audit failed: ' + error.message);
    process.exitCode = 1;
  }
}
