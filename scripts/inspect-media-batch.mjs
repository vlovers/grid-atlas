import { lstatSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { inspectOriginal } from './inspect-media-original.mjs';
import { auditStaging } from './audit-media-staging.mjs';

const load = path => JSON.parse(readFileSync(path, 'utf8'));
const repoJson = path => load(new URL('../' + path, import.meta.url));
const fileName = value => typeof value === 'string' &&
  /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:jpg|jpeg|png)$/.test(value) && !value.includes('..');
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);

/**
 * Offline, read-only batch inspection. Every accepted file must match pinned
 * Commons SHA-1, byte count and dimensions. No download or rights approval.
 */
export function inspectOriginalBatch({ manifest, originalsDir, staging, sourceEvidence, candidates, publication, pilot }) {
  const stagingAudit = auditStaging(staging, candidates, publication, pilot);
  if (!stagingAudit.ok) throw Error('Staging integrity failed: ' + stagingAudit.errors.join('; '));
  if (!manifest || manifest.schema_version !== 1 || manifest.lane !== 'offline_originals' ||
      manifest.publication_allowed !== false || !Array.isArray(manifest.entries) || manifest.entries.length === 0) {
    throw Error('Invalid offline-only batch manifest');
  }
  if (!sourceEvidence || sourceEvidence.schema_version !== 1 || sourceEvidence.lane !== 'research_only' ||
      sourceEvidence.publication_allowed !== false || !Array.isArray(sourceEvidence.entries)) {
    throw Error('Invalid Commons source evidence manifest');
  }
  if (typeof originalsDir !== 'string' || !originalsDir) throw Error('Missing originals directory');
  const dir = resolve(originalsDir);
  const dirStat = lstatSync(dir);
  if (!dirStat.isDirectory() || dirStat.isSymbolicLink()) throw Error('Originals directory must be a real directory');

  const seenIds = new Set(), seenFiles = new Set(), seenSha256 = new Set();
  const seenEvidenceIds = new Set();
  for (const evidence of sourceEvidence.entries) {
    if (typeof evidence?.research_id !== 'string' || seenEvidenceIds.has(evidence.research_id)) {
      throw Error('Duplicate or invalid Commons source evidence ID');
    }
    seenEvidenceIds.add(evidence.research_id);
  }
  const results = [];
  for (const [index, request] of manifest.entries.entries()) {
    const label = 'entries[' + index + ']';
    if (!request || Object.keys(request).sort().join(',') !== 'expected_sha256,file,research_id' ||
        typeof request.research_id !== 'string' || !request.research_id.startsWith('research-') ||
        !fileName(request.file) || !(request.expected_sha256 === null || hash(request.expected_sha256))) {
      throw Error(label + ': invalid request fields, filename or expected SHA-256');
    }
    if (seenIds.has(request.research_id) || seenFiles.has(request.file)) {
      throw Error(label + ': duplicate research ID or filename');
    }
    seenIds.add(request.research_id); seenFiles.add(request.file);
    const evidence = sourceEvidence.entries.find(e => e.research_id === request.research_id);
    if (!evidence) {
      results.push({ research_id: request.research_id, file: request.file, status: 'blocked',
        reason: 'No pinned Commons original evidence: SHA-1, bytes and dimensions required' });
      continue;
    }
    try {
      const inspection = inspectOriginal({
        filePath: join(dir, request.file), researchId: request.research_id, staging,
        sourceEvidence, expectedSha256: request.expected_sha256 ?? undefined
      });
      if (seenSha256.has(inspection.local_original.sha256)) {
        results.push({ research_id: request.research_id, file: request.file, status: 'blocked',
          reason: 'Duplicate original SHA-256 across research IDs' });
        continue;
      }
      seenSha256.add(inspection.local_original.sha256);
      results.push({ research_id: request.research_id, file: request.file, status: 'inspected',
        inspection });
    } catch (error) {
      results.push({ research_id: request.research_id, file: request.file, status: 'blocked',
        reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return {
    schema_version: 1, kind: 'offline_batch_inspection_not_rights_approval',
    publication_allowed: false, total: results.length,
    inspected: results.filter(r => r.status === 'inspected').length,
    blocked: results.filter(r => r.status === 'blocked').length,
    results
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: {
      manifest: { type: 'string' }, originals: { type: 'string' }
    } });
    if (!values.manifest || !values.originals) {
      throw Error('Usage: node scripts/inspect-media-batch.mjs --manifest /path/to/batch.json --originals /path/to/originals');
    }
    const report = inspectOriginalBatch({
      manifest: load(values.manifest), originalsDir: values.originals,
      staging: repoJson('docs/media/cross-era-staging.json'),
      sourceEvidence: repoJson('docs/media/commons-original-evidence.json'),
      candidates: repoJson('docs/media/candidates.json'),
      publication: repoJson('apps/web/src/components/media/publication.json'),
      pilot: repoJson('docs/media/pilot-identities.json')
    });
    console.log(JSON.stringify(report, null, 2));
    if (report.blocked) process.exitCode = 1;
  } catch (error) {
    console.error('Offline media batch inspection failed: ' + error.message);
    process.exitCode = 1;
  }
}
