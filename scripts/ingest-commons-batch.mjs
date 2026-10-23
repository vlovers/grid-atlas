import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { auditStaging } from './audit-media-staging.mjs';
import { ingestCommonsOriginal } from './ingest-commons-original.mjs';
import { assertPrivateOriginalDirectory } from './private-original-directory.mjs';
import { expectedObservedSha256 } from './commons-original-observation-guard.mjs';

const repoJson = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const idPattern = /^research-[a-z0-9-]+$/;

/**
 * Explicit, sequential research-only Commons ingestion. A failed candidate does
 * not silently prevent the remaining candidates from being inspected, and the
 * returned report never represents legal/editorial approval.
 */
export async function ingestCommonsBatch({
  researchIds, outputDir, staging, sourceEvidence, originalObservations, candidates, publication, pilot,
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
  const directory = assertPrivateOriginalDirectory(outputDir);
  const evidenceIds = new Set();
  for (const item of sourceEvidence.entries) {
    if (!idPattern.test(item?.research_id ?? '') || evidenceIds.has(item.research_id)) {
      throw Error('Duplicate or invalid Commons evidence ID');
    }
    evidenceIds.add(item.research_id);
  }
  // Validate the complete register before any network call or output file write.
  for (const item of sourceEvidence.entries) {
    expectedObservedSha256({ researchId: item.research_id, originalObservations, sourceEvidence });
  }
  const stagingIds = new Set(staging.entries.map(item => item.id));
  const results = [];
  for (const id of researchIds) {
    if (!stagingIds.has(id) || !evidenceIds.has(id)) {
      results.push({ research_id: id, status: 'blocked', reason: 'No matching research candidate and pinned Commons original evidence' });
      continue;
    }
    try {
      const inspection = await ingestImpl({ researchId: id, outputDir: directory, staging, sourceEvidence, originalObservations });
      const original = inspection?.local_original;
      const entry = staging.entries.find(item => item.id === id);
      const source = sourceEvidence.entries.find(item => item.research_id === id);
      if (inspection?.publication_allowed !== false || inspection.research_id !== id ||
          !/^[a-f0-9]{64}$/.test(original?.sha256 ?? '') ||
          inspection.source_evidence?.matched !== true ||
          inspection.source_file_page !== source.file_page_url ||
          original.sha1 !== source.sha1 || original.bytes !== source.bytes ||
          original.mime !== entry.image?.mime ||
          original.width !== source.width || original.height !== source.height ||
          inspection.source_observation?.commons_file_page !== source.file_page_url) {
        throw Error('Ingestion did not return a verified research-only original');
      }
      const observedSha256 = expectedObservedSha256({ researchId: id, originalObservations, sourceEvidence });
      if (observedSha256 && original.sha256 !== observedSha256) {
        throw Error('Ingested SHA-256 differs from pinned original observation');
      }
      results.push({
        research_id: id, status: 'ingested', sha256: original.sha256,
        sha1: original.sha1, bytes: original.bytes,
        mime: original.mime, width: original.width, height: original.height,
        source_observation: inspection.source_observation
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
      originalObservations: repoJson('docs/media/verified-original-observations.json'),
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
