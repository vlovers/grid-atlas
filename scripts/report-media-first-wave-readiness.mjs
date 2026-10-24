import { readFileSync } from 'node:fs';

const load = (path) => JSON.parse(readFileSync(path, 'utf8'));
const original = load('docs/media/commons-original-evidence.json');
const observed = load('docs/media/verified-original-observations.json');
const staged = load('docs/media/cross-era-staging.json');
const pub = load('apps/web/src/components/media/publication.json');
const source = new Map(original.entries.map(e => [e.research_id, e]));
const observations = new Map(observed.entries.map(e => [e.research_id, e]));
const failures = [];
const checks = (ok, message) => { if (!ok) failures.push(message); };

checks(original.lane === 'research_only' && original.publication_allowed === false, 'Original evidence must remain research-only');
checks(observed.lane === 'research_only' && observed.publication_allowed === false, 'SHA-256 observations must remain research-only');
checks(staged.lane === 'research_only' && staged.publication_allowed === false, 'Staging must remain research-only');
checks(pub.lane === 'publication', 'Unexpected public registry lane');
checks(Array.isArray(pub.assets) && pub.assets.length === 0, 'Research-only batch must not silently publish photos');
checks(Number.isInteger(original.schema_version) && original.schema_version === 1, 'Unexpected original evidence schema');
checks(Number.isInteger(observed.schema_version) && observed.schema_version === 1, 'Unexpected observation schema');
checks(Number.isInteger(staged.schema_version) && staged.schema_version === 1, 'Unexpected staging schema');
checks(staged.entries.length === 5, 'Expected exactly five staged originals');
checks(source.size === original.entries.length && source.size === 5, 'Missing or duplicate source evidence');
checks(observations.size === observed.entries.length, 'Duplicate SHA-256 observation');
for (const entry of staged.entries) {
  const evidence = source.get(entry.id);
  checks(Boolean(evidence), 'No original metadata for ' + entry.id);
  if (!evidence) continue;
  checks(entry.file_page_url === evidence.file_page_url, 'File-page conflict for ' + entry.id);
  checks(entry.creator === evidence.source_author, 'Creator conflict for ' + entry.id);
  checks(entry.license.identifier === evidence.source_license, 'License claim drift for ' + entry.id);
  checks(Number.isInteger(evidence.description_oldid) && evidence.description_oldid > 0,
    'Missing immutable Commons description revision for ' + entry.id);
  checks(Number.isInteger(evidence.width) && evidence.width > 0 &&
    Number.isInteger(evidence.height) && evidence.height > 0,
    'Missing original pixel dimensions for ' + entry.id);
  checks(typeof evidence.source_author === 'string' && evidence.source_author.length > 0,
    'Missing source author for ' + entry.id);
  checks(/^CC-BY(?:-SA)?-[0-9]+\.[0-9]+$/.test(evidence.source_license),
    'Unexpected claimed license for ' + entry.id);
  checks(/^[a-f0-9]{40}$/.test(evidence.sha1), 'Invalid source SHA-1 for ' + entry.id);
  checks(Number.isInteger(evidence.bytes) && evidence.bytes > 0, 'Invalid original size for ' + entry.id);
  const observation = observations.get(entry.id);
  if (observation) {
    checks(/^[a-f0-9]{64}$/.test(observation.sha256), 'Malformed SHA-256 for ' + entry.id);
    checks(observation.sha1 === evidence.sha1 && observation.bytes === evidence.bytes,
      'Observed original differs from pinned Commons metadata: ' + entry.id);
  }
}
for (const id of observations.keys()) checks(source.has(id), 'Unexpected SHA-256 research identity: ' + id);
const identities = staged.entries.map(entry => {
  const evidence = source.get(entry.id);
  return {
    id: entry.id,
    subject: entry.subject,
    source_metadata_pinned: Boolean(evidence),
    sha256_original_observed: observations.has(entry.id),
    rights_approved: false,
    human_review: false,
    publication_allowed: false,
    blockers: [
      ...(!observations.has(entry.id) ? ['original_sha256_unobserved'] : []),
      'original_visual_identity_review_pending',
      'creator_licence_derivative_rights_pending',
      'human_review_pending',
      'approved_delivery_bytes_missing',
    ],
  };
});
const report = { schema_version: 1, research_only: true, source_count: source.size,
  binary_sha256_observations: observations.size, public_assets: pub.assets.length,
  publishable_count: 0, identities, failures };
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
if (failures.length) process.exitCode = 1;
