import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const load = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const isPath = value => typeof value === 'string' && /^docs\/editorial\/[a-z0-9/._-]+\.json$/.test(value) && !value.includes('..');

export function buildEditorialReviewQueue(manifest, read = load) {
  if (manifest?.schema_version !== 1 || manifest.status !== 'research_only' ||
      !Array.isArray(manifest.drivers) || !manifest.drivers.length) throw Error('Invalid research release manifest');
  const seen = new Set(), dossiers = [];
  for (const driver of manifest.drivers) {
    if (!/^[a-z0-9-]+$/.test(driver.driver_id ?? '') || seen.has(driver.driver_id)) throw Error('Invalid or duplicate driver');
    seen.add(driver.driver_id);
    for (const locale of ['uk', 'en']) {
      const entry = driver.locales?.[locale];
      if (!isPath(entry?.dossier) || !isPath(entry?.review)) throw Error('Invalid dossier/review path');
      const dossier = read(entry.dossier), review = read(entry.review);
      if (dossier.driver_id !== driver.driver_id || dossier.locale !== locale ||
          !Array.isArray(dossier.claims) || !Array.isArray(dossier.sources) ||
          !Array.isArray(dossier.gaps) || !Array.isArray(review.issues) ||
          typeof review.claim_reviews !== 'object' || review.claim_reviews === null) {
        throw Error('Invalid dossier or review identity: ' + driver.driver_id + '/' + locale);
      }
      const claims = new Set(dossier.claims.map(c => c.claim_id));
      if (claims.size !== dossier.claims.length ||
          Object.keys(review.claim_reviews).length !== claims.size ||
          Object.keys(review.claim_reviews).some(id => !claims.has(id))) {
        throw Error('Claim/review mismatch: ' + driver.driver_id + '/' + locale);
      }
      const sourceIds = new Set(dossier.sources.map(s => s.source_id));
      if (sourceIds.size !== dossier.sources.length) throw Error('Duplicate source IDs');
      const work = dossier.claims.map(claim => {
        const groups = new Set((claim.evidence ?? []).filter(e => e.supports === true)
          .map(e => dossier.sources.find(s => s.source_id === e.source_id)?.independence_group)
          .filter(Boolean));
        if ((claim.evidence ?? []).some(e => !sourceIds.has(e.source_id))) throw Error('Unknown evidence source');
        return {
          claim_id: claim.claim_id,
          review_pending: review.claim_reviews[claim.claim_id] === null,
          supporting_publisher_groups: groups.size,
          has_counter_evidence: (claim.evidence ?? []).some(e => e.supports === false)
        };
      });
      dossiers.push({
        driver_id: driver.driver_id, locale,
        dossier_path: entry.dossier, review_path: entry.review,
        stage: review.stage, claims: work.length,
        pending_claim_reviews: work.filter(c => c.review_pending).length,
        single_group_claims: work.filter(c => c.supporting_publisher_groups < 2).map(c => c.claim_id),
        counter_evidence_claims: work.filter(c => c.has_counter_evidence).map(c => c.claim_id),
        unresolved_issues: review.issues.filter(i => i.resolution === null).length,
        open_research_gaps: dossier.gaps.length,
        human_signoff_present: review.checks?.signoff !== null && review.checks?.signoff !== undefined,
        publication_ready: false
      });
    }
  }
  return {
    schema_version: 1, kind: 'editorial_review_work_queue_not_approval',
    publication_allowed: false, release_id: manifest.release_id,
    dossiers: dossiers.length,
    claims: dossiers.reduce((n, d) => n + d.claims, 0),
    pending_claim_reviews: dossiers.reduce((n, d) => n + d.pending_claim_reviews, 0),
    unresolved_issues: dossiers.reduce((n, d) => n + d.unresolved_issues, 0),
    entries: dossiers
  };
}

export function renderEditorialReviewQueue(report) {
  const lines = [
    '# Editorial review queue — research only', '',
    'No automated historical approval, publication, or factual verification.', '',
    '| Driver | Locale | Claims pending review | Unresolved issues | Single-group claims |',
    '| --- | --- | ---: | ---: | ---: |'
  ];
  for (const entry of report.entries) lines.push(
    '| ' + entry.driver_id + ' | ' + entry.locale + ' | ' + entry.pending_claim_reviews +
    ' | ' + entry.unresolved_issues + ' | ' + entry.single_group_claims.length + ' |'
  );
  lines.push('', 'Single-group counts flag claims needing an independence check; they are not automatic evidence failures.',
    'Use the existing exact-revision human review and publication pipeline. This report cannot approve a dossier.', '');
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { format: { type: 'string' }, output: { type: 'string' } } });
    if (values.format && !['json', 'markdown'].includes(values.format)) throw Error('Expected json or markdown');
    const report = buildEditorialReviewQueue(load('docs/editorial/releases/v1/manifest.json'));
    const output = values.format === 'markdown' ? renderEditorialReviewQueue(report) : JSON.stringify(report, null, 2) + '\n';
    if (values.output) writeFileSync(values.output, output, { flag: 'wx', mode: 0o600 });
    else process.stdout.write(output);
  } catch (error) { console.error('Editorial review queue failed: ' + error.message); process.exitCode = 1; }
}
