import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const key = subject => subject.type + ':' + subject.id;
const isText = value => typeof value === 'string' && value.trim().length > 0;

export function auditStaging(staging, strictCandidates, publication, pilot) {
  const errors = [];
  if (staging?.schema_version !== 1 || staging?.lane !== 'research_only' || staging?.publication_allowed !== false || !Array.isArray(staging.entries)) {
    return { ok: false, errors: ['staging header must explicitly disable publication'] };
  }
  const known = new Set(pilot.subjects.map(key));
  const strictIds = new Set([...strictCandidates.assets, ...publication.assets].map(a => a.id));
  const strictPages = new Set([...strictCandidates.assets, ...publication.assets].map(a => a.file_page_url));
  const ids = new Set(), pages = new Set();
  for (const [index, asset] of staging.entries.entries()) {
    const label = 'entries[' + index + ']';
    if (!isText(asset?.id) || !asset.id.startsWith('research-') || ids.has(asset.id) || strictIds.has(asset.id)) errors.push(label + ': invalid, duplicate or already registered ID');
    if (isText(asset?.id)) ids.add(asset.id);
    let url;
    try { url = new URL(asset.file_page_url); } catch { url = undefined; }
    if (!url || url.protocol !== 'https:' || url.hostname !== 'commons.wikimedia.org' || !url.pathname.startsWith('/wiki/File:') || url.search || url.hash || pages.has(url.href) || strictPages.has(url.href)) {
      errors.push(label + ': invalid, duplicate or already registered Commons file page');
    }
    if (url) pages.add(url.href);
    if (asset.status !== 'candidate' || asset.review !== null || asset.content_sha256 !== null || asset.delivery?.local_path !== null || asset.delivery?.remote_url !== null) {
      errors.push(label + ': research record must not be approved, ingested or delivered');
    }
    if (asset.source_revision !== null) errors.push(label + ': source revision must remain unset until verified');
    if (!asset.subject || !['driver', 'constructor', 'circuit', 'race'].includes(asset.subject.type) || !isText(asset.subject.id)) {
      errors.push(label + ': invalid subject');
    }
    if (!isText(asset.rights_note) || !asset.rights_note.includes('independent human approval')) errors.push(label + ': explicit human approval blocker required');
  }
  return { ok: errors.length === 0, entries: staging.entries.length, identity_matches_pilot: staging.entries.filter(a => known.has(key(a.subject))).map(a => a.id), unresolved_identities: staging.entries.filter(a => !known.has(key(a.subject))).map(a => ({ id: a.id, subject: a.subject })), errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = auditStaging(load('docs/media/cross-era-staging.json'), load('docs/media/candidates.json'), load('apps/web/src/components/media/publication.json'), load('docs/media/pilot-identities.json'));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
