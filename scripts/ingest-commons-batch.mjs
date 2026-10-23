import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { auditStaging } from './audit-media-staging.mjs';
import { ingestCommonsOriginal } from './ingest-commons-original.mjs';

const repoJson = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const idPattern = /^research-[a-z0-9-]+$/;

/**
 * Explicit, sequential research-only Commons ingestion. A failed candidate does
 * not silently prevent the remaining candidates from being inspected, and the
 * returned report never represents legal/editorial approval.
 */
export async function ingestCommonsBatch({
  researchIds, outputDir, staging, sourceEvidence, candidates, publication, pilot,
  ingestImpl = ingestCommonsOriginal
}) {
  const audit = auditStaging(staging, candidates, publication, pilot);
  if (!audit.ok) throw Error('Staging integrity failed: ' + audit.errors.join('; '));
  if (sourceEvidence?.schema_version !== 1 || sourceEvidence.lane !== 'research_only' ||
      sourceEvidence.publication_allowed !== false || !Array.isArray(sourceEvidence.entries)) {
    throw Error('Invalid research-only Commons evidence');
  }
  if (!Array.isArray(researchIds) || researchIds.length < 1 || researchIds.length > 20 ||
      researchIds.some(id => typeof id !== 'string' || !idPattern.test(id)) ||
      new Set(researchIds).size !== researchIds.length) {
    throw Error('Supply 1–20 distinct research IDs');
  }
  if (typeof outputDir !== 'string' || !outputDir) throw Error('Existing private output directory required');
  const directory = resolve(outputDir);
  const dirStat = lstatSync(directory);
  if (!dirStat.isDirectory() || dirStat.isSymbolicLink()) throw Error('Output directory must not be a symlink');
  const evidenceIds = new Set();
  for (const item of sourceEvidence.entries) {
    if (!idPattern.test(item?.research_id ?? '') || evidenceIds.has(item.research_id)) {
      throw Error('Duplicate or invalid Commons evidence ID');
    }
    evidenceIds.add(item.research_id);
  }
  const stagingIds = new Set(staging.entries.map(item => item.id));
  const results = [];
  for (const id of researchIds) {
    if (!stagingIds.has(id) || !evidenceIds.has(id)) {
      results.push({ research_id: id, status: 'blocked', reason: 'No matching research candidate and pinned Commons original evidence' });
      continue;
    }
    try {
      const inspection = await ingestImpl({ researchId: id, outputDir: directory, staging, sourceEvidence });
      if (inspection.publication_allowed !== false || inspection.research_id !== id ||
          !/^[a-f0-9]{64}$/.test(inspection.local_original?.sha256 ?? '') ||
          inspection.source_evidence?.matched !== true) {
        throw Error('Ingestion did not return a verified research-only original');
      }
      results.push({
        research_id: id, status: 'ingested', sha256: inspection.local_original.sha256,
        sha1: inspection.local_original.sha1, bytes: inspection.local_original.bytes,
        source_observation: inspection.source_observation ?? null
      });
    } catch (error) {
      results.push({ research_id: id, status: 'blocked', reason: error instanceof Error ? error.message : String(error) });
    }
  }
  return {
    schema_version: 1, kind: 'commons_batch_research_ingestion_not_rights_approval',
    publication_allowed: false, total: results.length,
    ingested: results.filter(item => item.status === 'ingested').length,
    blocked: results.filter(item => item.status === 'blocked').length,
    results
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { ids: { type: 'string' }, 'output-dir': { type: 'string' } } });
    if (!values.ids || !values['output-dir']) {
      throw Error('Usage: node scripts/ingest-commons-batch.mjs --ids research-id[,research-id] --output-dir /existing/private/directory');
    }
    const report = await ingestCommonsBatch({
      researchIds: values.ids.split(','), outputDir: values['output-dir'],
      staging: repoJson('docs/media/cross-era-staging.json'),
      sourceEvidence: repoJson('docs/media/commons-original-evidence.json'),
      candidates: repoJson('docs/media/candidates.json'),
      publication: repoJson('apps/web/src/components/media/publication.json'),
      pilot: repoJson('docs/media/pilot-identities.json')
    });
    console.log(JSON.stringify(report, null, 2));
    if (report.blocked) process.exitCode = 1;
  } catch (error) {
    console.error('Commons research batch ingestion failed: ' + error.message);
    process.exitCode = 1;
  }
}
