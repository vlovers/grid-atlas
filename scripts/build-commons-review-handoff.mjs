import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { auditStaging } from './audit-media-staging.mjs';
import { auditCommonsEvidence } from './audit-commons-evidence.mjs';
import { renderCommonsReviewMarkdown } from './render-commons-review-markdown.mjs';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const sha256 = /^[a-f0-9]{64}$/;
const sha1 = /^[a-f0-9]{40}$/;
const isoDay = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Offline handoff for independent human rights/subject review.
 * This is a checklist of evidence and missing decisions, NEVER an approval.
 * Source-record SHA-256 and original-image SHA-256 are distinct namespaces.
 */
export function buildCommonsReviewHandoff({ staging, evidence, observations, identities, candidates, publication }) {
  const stageAudit = auditStaging(staging, candidates, publication, identities);
  const sourceAudit = auditCommonsEvidence(staging, evidence);
  if (!stageAudit.ok || !sourceAudit.ok || staging.entries.length === 0) {
    throw Error('Incomplete or invalid Commons research evidence: ' +
      [...stageAudit.errors, ...sourceAudit.errors].join('; '));
  }
  if (identities?.source?.slug !== 'f1db' || identities.source.release !== 'v2026.17.0' ||
      !sha256.test(identities.source.sha256 ?? '') || !Array.isArray(identities.subjects)) {
    throw Error('Expected pinned F1DB v2026.17.0 identities');
  }
  if (observations?.schema_version !== 1 || observations.lane !== 'research_only' ||
      observations.publication_allowed !== false || !Array.isArray(observations.entries) ||
      typeof observations.source_run_url !== 'string' ||
      !/^https:\/\/github\.com\/vlovers\/grid-atlas\/actions\/runs\/\d+$/.test(observations.source_run_url) ||
      !isoDay.test(observations.observed_on ?? '')) {
    throw Error('Invalid research-only original observation provenance');
  }
  const observationDay = observations.observed_on;
  if (Number.isNaN(Date.parse(observationDay + 'T00:00:00Z')) ||
      new Date(observationDay + 'T00:00:00Z').toISOString().slice(0, 10) !== observationDay) {
    throw Error('Invalid original observation calendar date');
  }
  const sourceById = new Map(evidence.entries.map(item => [item.research_id, item]));
  const identityByKey = new Map();
  for (const subject of identities.subjects) {
    const key = subject?.type + ':' + subject?.id;
    if (identityByKey.has(key) || !sha256.test(subject?.record_sha256 ?? '') ||
        typeof subject?.name !== 'string' || !subject.name.trim()) {
      throw Error('Invalid or duplicate F1DB identity');
    }
    identityByKey.set(key, subject);
  }
  const observedById = new Map();
  const observedHashes = new Set();
  for (const item of observations.entries) {
    const source = sourceById.get(item?.research_id);
    if (!source || observedById.has(item.research_id) || !sha256.test(item.sha256 ?? '') ||
        !sha1.test(item.sha1 ?? '') || item.sha1 !== source.sha1 || item.bytes !== source.bytes ||
        observedHashes.has(item.sha256)) {
      throw Error('Invalid, duplicate or unpinned original binary observation');
    }
    observedById.set(item.research_id, item);
    observedHashes.add(item.sha256);
  }
  const entries = staging.entries.map(item => {
    const source = sourceById.get(item.id);
    const identity = identityByKey.get(item.subject?.type + ':' + item.subject?.id);
    if (!source || !identity || !['image/jpeg', 'image/png'].includes(item.image?.mime) ||
        source.source_author !== item.creator ||
        source.source_license !== item.license?.identifier ||
        !sha1.test(source.sha1 ?? '') ||
        !Number.isSafeInteger(source.description_oldid) || source.description_oldid < 1 ||
        !Number.isSafeInteger(source.bytes) || source.bytes < 16 ||
        !Number.isSafeInteger(source.width) || source.width < 1 ||
        !Number.isSafeInteger(source.height) || source.height < 1 ||
        source.width * source.height > 80_000_000) {
      throw Error('Missing or contradictory candidate provenance: ' + item.id);
    }
    const observation = observedById.get(item.id);
    if (observation && (typeof item.inspected_on !== 'string' ||
        !isoDay.test(item.inspected_on) || observationDay < item.inspected_on)) {
      throw Error('Original binary observation predates candidate inspection: ' + item.id);
    }
    return {
      research_id: item.id,
      subject: { type: item.subject.type, id: item.subject.id, f1db_name: identity.name },
      f1db_record: {
        release: identities.source.release, archive_sha256: identities.source.sha256,
        record_sha256: identity.record_sha256,
        scope: 'canonical identity only; not proof of depicted subject'
      },
      commons_source: {
        file_page_url: source.file_page_url, description_oldid: source.description_oldid,
        original_sha1: source.sha1, bytes: source.bytes,
        width: source.width, height: source.height,
        observed_creator: source.source_author,
        observed_license: source.source_license,
        license_url: item.license?.url ?? null,
        source_note: source.note ?? null
      },
      original_binary: observation ? {
        status: 'sha256_observed_not_rights_approved',
        sha256: observation.sha256,
        observation_run_url: observations.source_run_url,
        observed_on: observations.observed_on
      } : { status: 'pending_original', sha256: null, observation_run_url: null, observed_on: null },
      proposed_kind: item.kind,
      context_warning: item.rights_note,
      required_human_checks: [
        'Inspect exact Commons description revision and complete upload/derivative history',
        'Independently establish photographer/creator, license obligations and attribution',
        'Confirm depicted identity, capture date and historical context; do not infer from F1DB identity',
        'Visually decode and inspect original, and document any edits/crops',
        'Review privacy, personality, trademark and intended editorial/commercial use',
        'Write and independently verify distinct Ukrainian and English alt text/captions',
        'Record independent named reviewer, rationale, date and exact reviewed bytes'
      ],
      locale_text: { uk: { alt: null, caption: null }, en: { alt: null, caption: null } },
      reviewer: null, rights_decision: 'pending', subject_decision: 'pending',
      publication_allowed: false
    };
  });
  if (observedById.size > entries.length) throw Error('Unmapped binary observations');
  return {
    schema_version: 1, kind: 'commons_independent_review_handoff_not_approval',
    publication_allowed: false, original_files_in_report: false,
    generated_from: { f1db_release: identities.source.release, pinned_commons_metadata: true },
    total: entries.length, binary_sha256_observed: observedById.size,
    binary_sha256_pending: entries.length - observedById.size,
    rights_approved: 0, entries
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { output: { type: 'string' }, format: { type: 'string' } } });
    if (values.format && !['json', 'markdown'].includes(values.format)) throw Error('Expected --format json or markdown');
    const report = buildCommonsReviewHandoff({
      staging: read('docs/media/cross-era-staging.json'),
      evidence: read('docs/media/commons-original-evidence.json'),
      observations: read('docs/media/verified-original-observations.json'),
      identities: read('docs/media/pilot-identities.json'),
      candidates: read('docs/media/candidates.json'),
      publication: read('apps/web/src/components/media/publication.json')
    });
    const serialized = values.format === 'markdown' ? renderCommonsReviewMarkdown(report) : JSON.stringify(report, null, 2) + '\n';
    if (values.output) writeFileSync(values.output, serialized, { flag: 'wx', mode: 0o600 });
    else process.stdout.write(serialized);
  } catch (error) {
    console.error('Commons review handoff failed: ' + error.message);
    process.exitCode = 1;
  }
}
