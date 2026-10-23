import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { commonsFileTitle } from './ingest-commons-original.mjs';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));

/** Offline source-evidence consistency only: does not download, clear rights or publish. */
export function auditCommonsEvidence(staging, evidence) {
  const errors = [];
  if (staging?.schema_version !== 1 || staging?.lane !== 'research_only' || staging?.publication_allowed !== false || !Array.isArray(staging?.entries)) {
    return { ok: false, errors: ['Invalid research-only staging manifest'] };
  }
  if (evidence?.schema_version !== 1 || evidence?.lane !== 'research_only' || evidence?.publication_allowed !== false || !Array.isArray(evidence?.entries)) {
    return { ok: false, errors: ['Invalid research-only Commons source evidence'] };
  }
  const candidates = new Map(), stagedPages = new Set();
  for (const item of staging.entries) {
    if (typeof item?.id !== 'string' || !/^research-[a-z0-9-]+$/.test(item.id) || candidates.has(item.id)) {
      errors.push('Invalid or duplicate staging ID');
      continue;
    }
    candidates.set(item.id, item);
    if (item.status !== 'candidate' || item.review !== null || item.content_sha256 !== null ||
        item.delivery?.local_path !== null || item.delivery?.remote_url !== null ||
        item.alt?.uk !== null || item.alt?.en !== null ||
        item.caption?.uk !== null || item.caption?.en !== null) {
      errors.push(item.id + ': staged candidate contains publication data');
    }
    if (item.source_url !== item.file_page_url || stagedPages.has(item.file_page_url)) {
      errors.push(item.id + ': source URL mismatch or duplicate staging page');
    }
    stagedPages.add(item.file_page_url);
    try { commonsFileTitle(item.file_page_url); } catch { errors.push(item.id + ': noncanonical staged Commons file page'); }
  }
  const ids = new Set(), pages = new Set();
  for (const entry of evidence.entries) {
    const id = entry?.research_id;
    if (typeof id !== 'string' || ids.has(id)) { errors.push('Duplicate or invalid source evidence ID'); continue; }
    ids.add(id);
    const candidate = candidates.get(id);
    if (!candidate) { errors.push(id + ': source evidence without staging candidate'); continue; }
    if (candidate.status !== 'candidate' || candidate.review !== null || candidate.content_sha256 !== null || candidate.delivery?.local_path !== null || candidate.delivery?.remote_url !== null) errors.push(id + ': candidate has publication or approval data');
    if (candidate.file_page_url !== entry.file_page_url || pages.has(entry.file_page_url)) errors.push(id + ': file page mismatch or duplicate');
    pages.add(entry.file_page_url);
    try { commonsFileTitle(entry.file_page_url); } catch { errors.push(id + ': noncanonical Commons file page'); }
    if (!/^[a-f0-9]{40}$/.test(entry.sha1 ?? '') || !Number.isSafeInteger(entry.bytes) || entry.bytes < 16 || entry.bytes > 40 * 1024 * 1024) errors.push(id + ': invalid source original SHA-1 or byte count');
    if (!Number.isSafeInteger(entry.width) || !Number.isSafeInteger(entry.height) || entry.width < 1 || entry.height < 1 || entry.width * entry.height > 80_000_000) errors.push(id + ': invalid original dimensions');
    if (!Number.isSafeInteger(entry.description_oldid) || entry.description_oldid < 1) errors.push(id + ': missing Commons description revision');
    if (entry.source_author !== candidate.creator || entry.source_license !== candidate.license?.identifier) errors.push(id + ': author or license differs from staged observation');
    if (candidate.image?.mime !== 'image/jpeg' && candidate.image?.mime !== 'image/png') errors.push(id + ': unsupported staged MIME');
  }
  const missing = [...candidates.keys()].filter(id => !ids.has(id));
  for (const id of missing) errors.push(id + ': missing pinned Commons source evidence');
  return {
    ok: errors.length === 0,
    source_evidenced: ids.size,
    staged: staging.entries.length,
    missing_source_evidence: missing,
    pending_independent_review: [...ids],
    publication_allowed: false,
    errors
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = auditCommonsEvidence(read('docs/media/cross-era-staging.json'), read('docs/media/commons-original-evidence.json'));
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } catch (error) { console.error('Commons evidence audit failed: ' + error.message); process.exitCode = 1; }
}
