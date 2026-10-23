import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { auditStaging } from './audit-media-staging.mjs';
const load = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));

export function buildReviewPacket(staging, candidates, publication, pilot) {
  const audit = auditStaging(staging, candidates, publication, pilot);
  if (!audit.ok) throw new Error('Staging integrity failed: ' + audit.errors.join('; '));
  const pilotKeys = new Set(pilot.subjects.map(s => s.type + ':' + s.id));
  const tasks = staging.entries.map(a => ({
    research_id: a.id,
    subject: a.subject,
    source_file_page: a.file_page_url,
    source_revision: a.source_revision,
    suggested_creator_unverified: a.creator,
    suggested_license_unverified: a.license.identifier,
    identity_in_pilot: pilotKeys.has(a.subject.type + ':' + a.subject.id),
    checks: {
      canonical_f1db_identity: 'pending',
      commons_exact_revision_and_original_file: 'pending',
      creator_and_license_chain: 'pending',
      historical_image_context: 'pending',
      dimensions_and_original_sha256: 'pending',
      attribution_and_derivative_obligations: 'pending',
      english_alt_and_caption: 'pending',
      ukrainian_alt_and_caption: 'pending',
      independent_human_approval: 'pending'
    },
    publication_allowed: false
  }));
  return { schema_version: 1, kind: 'review_worklist_not_approval', pinned_source: pilot.source, count: tasks.length, tasks };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(buildReviewPacket(load('docs/media/cross-era-staging.json'), load('docs/media/candidates.json'), load('apps/web/src/components/media/publication.json'), load('docs/media/pilot-identities.json')), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
