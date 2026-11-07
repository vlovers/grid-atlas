#!/usr/bin/env node
/** Read-only circuit intake audit. Never imports, approves, downloads or publishes. */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { parseMediaRegistry, selectMediaCollection } from '../apps/web/src/components/media/registry.ts';

const root = resolve(import.meta.dirname, '..');
const folder = 'docs/media/circuit-intake-410/';
const load = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
const requireThat = (value, message) => { if (!value) throw Error(`Circuit media intake: ${message}`); };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const exactUrl = value => {
  const url = new URL(value);
  requireThat(url.protocol === 'https:' && !url.username && !url.password && !url.port && url.pathname !== '/', 'exact HTTPS source document required');
  return url;
};
const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value).toISOString().slice(0, 10) === value;
function noApproval(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (['human_approval', 'publication_allowed', 'media_rights_approved'].includes(key)) requireThat(item === false, 'nested approval flags must remain false');
    noApproval(item);
  }
}

export function loadCircuitMediaIntake() {
  return { intake: load(folder + 'intake.json'), candidates: load(folder + 'candidates.json'),
    snapshot: load(folder + 'archive-snapshot.json'), observations: load(folder + 'source-observations.json'),
    manifest: load('apps/web/src/components/circuit-layout-manifest.json'),
    source: load('docs/media/pilot-identities.json').source };
}

export function auditCircuitMediaIntake(bundle, { asOf = '2026-11-05', readAsset = path => readFileSync(resolve(root, 'apps/web/public', path.slice(1))) } = {}) {
  const { intake, candidates, snapshot, observations, manifest, source } = bundle;
  noApproval(intake); noApproval(observations); noApproval(candidates);
  requireThat(day(asOf), 'valid asOf required');
  requireThat(intake.schema_version === 1 && intake.lane === 'research_only' && intake.human_approval === false &&
    intake.publication_allowed === false && intake.media_rights_approved === false, 'research-only false approval flags required');
  requireThat(JSON.stringify(intake.source) === JSON.stringify(source) && JSON.stringify(snapshot.source) === JSON.stringify(source), 'pinned F1DB source mismatch');
  requireThat(intake.entries.length === 20 && new Set(intake.entries.map(row => row.circuit_id)).size === 20, 'exactly20 distinct circuits required');
  requireThat(observations.schema_version === 1 && observations.lane === 'research_only' && observations.publication_allowed === false &&
    observations.media_rights_approved === false, 'source observations cannot grant rights');
  const subjects = [...snapshot.circuits.map(row => ({ type: 'circuit', id: row.id })), ...snapshot.races.map(row => ({ type: 'race', id: String(row.id) }))];
  const mappings = snapshot.layouts.map(layout => ({ id: layout.id, circuit_id: layout.circuitId,
    race_ids: snapshot.races.filter(race => race.circuitLayoutId === layout.id && race.circuitId === layout.circuitId).map(race => String(race.id)) }));
  parseMediaRegistry(candidates, subjects, asOf, 'candidates', [], mappings);
  const referenced = new Set(), files = new Set();
  const records = intake.entries.map(entry => {
    const circuit = snapshot.circuits.find(row => row.id === entry.circuit_id);
    const race = snapshot.races.find(row => String(row.id) === entry.reference_race_id);
    const layout = snapshot.layouts.find(row => row.id === entry.layout_id && row.circuitId === entry.circuit_id);
    requireThat(circuit && race && layout && race.circuitId === circuit.id && race.year === entry.reference_year &&
      race.circuitLayoutId === layout.id, `${entry.circuit_id}: wrong venue/year/layout`);
    requireThat(entry.geometry_scope === 'identifier_only_not_period_geometry', 'layout ID is not authenticated historic geometry');
    const years = snapshot.years_by_circuit[circuit.id];
    requireThat(Array.isArray(years) && years.length > 0 && years.every((year, index) => Number.isInteger(year) && year >= 1950 &&
      year <= Number(asOf.slice(0, 4)) && (index === 0 || year > years[index - 1])) && years.includes(race.year), 'invalid archive years');
    requireThat(entry.candidate_ids.length > 0, 'source-bound candidates required');
    const blockers = new Set(['independent_human_rights_review', 'period_geometry_not_authenticated', 'independent_bilingual_review']);
    if (layout.turns !== race.turns || layout.length !== race.courseLength) {
      requireThat(entry.caveats.includes('layout_event_metadata_conflict'), `${circuit.id}: layout/event conflict must remain explicit`);
      blockers.add('layout_event_metadata_conflict');
    }
    if (circuit.id === 'mont-tremblant') {
      requireThat(entry.caveats.includes('modern_comparison_not_period_evidence'), 'Mont-Tremblant modern comparison is not period evidence');
      blockers.add('modern_comparison_not_period_evidence');
    }
    let photos = 0;
    const sources = entry.candidate_ids.map(id => {
      const asset = candidates.assets.find(row => row.id === id);
      const matches = observations.observations.filter(row => row.candidate_id === id);
      requireThat(asset && !referenced.has(id) && matches.length === 1 && asset.subject.id === circuit.id, 'missing/duplicate/misassigned candidate');
      referenced.add(id);
      const observation = matches[0];
      requireThat(observation.circuit_id === circuit.id && observation.rights_state === 'source_asserted_not_cleared' &&
        observation.human_review === null, 'source assertion cannot become human clearance');
      requireThat(observation.observed_at.endsWith('Z') && Number.isFinite(Date.parse(observation.observed_at)) &&
        observation.observed_at.slice(0, 10) <= asOf && typeof observation.source_locator === 'string' && observation.source_locator.length > 30, 'timestamp/method/locator required');
      requireThat(asset.file_page_url === observation.file_page_url && asset.source_revision === observation.source_revision &&
        asset.creator === observation.creator_asserted && asset.license.identifier === observation.license_asserted &&
        asset.license.url === observation.license_url && asset.image.width === observation.bytes.width && asset.image.height === observation.bytes.height,
      'creator/license/revision/dimension assertion drift');
      requireThat(typeof asset.creator === 'string' && asset.creator.trim() && typeof asset.attribution === 'string' && asset.attribution.includes(asset.creator) && asset.attribution.includes(asset.license.identifier) &&
        asset.attribution.includes(asset.file_page_url), 'creator/license/file attribution gap');
      requireThat(asset.license.restrictions.length >= 2 && asset.rights_note.length > 30 && asset.modifications.length > 20, 'terms/modifications/rights note required');
      for (const value of [...Object.values(asset.caption), ...Object.values(asset.alt)]) requireThat(typeof value === 'string' && value.trim() && !/\b(licensed|verified|approved|cleared|certified)\b|(?:схвален|ліцензован|сертифікован)/i.test(value), 'missing or misleading rights/verification wording in proposed display text');
      exactUrl(observation.license_source_url);
      exactUrl(observation.license_url); const url = exactUrl(asset.file_page_url);
      const fileKey = url.hostname === 'commons.wikimedia.org' ? decodeURIComponent(url.searchParams.get('title') ?? url.pathname.replace('/wiki/', '')).replaceAll('_', ' ') : asset.file_page_url;
      requireThat(!files.has(fileKey), 'duplicate original file must not become another independent candidate'); files.add(fileKey);
      requireThat(/^[a-f0-9]{40}$/.test(observation.bytes.source_sha1) && Number.isSafeInteger(observation.bytes.size) && observation.bytes.size > 0, 'source byte/hash availability missing');
      if (asset.kind === 'circuit-diagram') {
        const artwork = manifest.find(row => row.layout_id === layout.id);
        requireThat(artwork && observation.claim_type === 'svg_layout' && asset.historical_context.year === race.year &&
          asset.layout.id === layout.id && asset.layout.race_ids.length === 1 && asset.layout.race_ids[0] === String(race.id), 'diagram/year binding mismatch');
        requireThat(observation.method === 'existing_local_bytes_git_blob_and_sha256_plus_source_license_read' && observation.bytes.availability === 'existing_vendored_file' &&
          observation.bytes.source_sha1_kind === 'git_blob' && observation.license_blob_sha1 === '4ea99c213c5c0c005ae4e80df8e52169d06896ec', 'artwork/license evidence missing');
        requireThat(asset.creator === artwork.author && asset.license.identifier === 'CC BY 4.0' && asset.license.url === 'https://creativecommons.org/licenses/by/4.0/' &&
          observation.license_source_url === 'https://github.com/f1db/f1db/blob/v2026.17.0/LICENSE', 'artwork creator/license source differs from manifest');
        const bytes = readAsset(artwork.path);
        const blob = createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest('hex');
        requireThat(artwork.source_url === asset.file_page_url && blob === artwork.source_git_blob_sha && blob === observation.bytes.source_sha1 &&
          digest(bytes) === asset.content_sha256 && asset.content_sha256 === observation.bytes.local_sha256 && bytes.length === observation.bytes.size, 'local artwork bytes differ from source manifest');
      } else {
        photos++;
        requireThat(asset.kind === 'photograph' && observation.claim_type === 'photograph' && url.hostname === 'commons.wikimedia.org' &&
          /^\d+$/.test(url.searchParams.get('oldid') ?? '') && observation.source_revision === 'commons-description-oldid:' + url.searchParams.get('oldid'), 'exact photo file-page revision required');
        requireThat(observation.license_source_url === asset.file_page_url, 'photo license evidence must be its exact file page');
        requireThat(observation.method === 'commons_description_and_metadata_only_no_original_fetch' && observation.bytes.availability === 'source_metadata_only' &&
          observation.bytes.source_sha1_kind === 'raw_file_reported_by_source' && observation.bytes.local_sha256 === null && asset.content_sha256 === null, 'metadata is not local original-byte inspection');
        requireThat(observation.depiction_scope === 'venue_only_not_selected_event_or_geometry' && asset.historical_context.year === observation.capture_year,
          'photo capture year is not selected F1 year or exact geometry');
        blockers.add('original_bytes_not_individually_inspected'); blockers.add('photo_venue_event_identity_pending');
      }
      if (observation.conflicts.length) blockers.add('source_conflict_unresolved');
      return { candidate_id: id, claim_type: observation.claim_type, file_page_url: asset.file_page_url,
        creator: asset.creator, source_declared_license: asset.license.identifier, bytes: observation.bytes.availability,
        human_rights_clearance: false, conflicts: observation.conflicts };
    });
    requireThat(selectMediaCollection(candidates.assets, { type: 'circuit', id: circuit.id }, asOf).length === 0, 'intake must never select public media');
    const nextSteps = [
      `Authenticate ${layout.id} against period evidence for ${circuit.id}, ${race.year}, race ${race.id}; the identifier is not geometry clearance.`,
      'Independently review the individual SVG author/license chain, attribution, modifications and delivery before any publication entry.',
      'Obtain independent EN/UK caption and identity review; preserve research-only status until those reviews exist.',
    ];
    if (photos) nextSteps.push('Review each exact photo file revision and author authority; only with a documented reuse basis inspect original bytes, compute SHA256 and confirm venue/capture context.');
    if (blockers.has('source_conflict_unresolved')) nextSteps.push('Resolve each recorded source conflict explicitly; never infer event identity from a venue photograph.');
    if (circuit.id === 'bugatti') nextSteps.push('Resolve the 1967 event 8 turns / 4.422km versus layout 14 / 4.185km discrepancy without replacing either observation.');
    if (circuit.id === 'mont-tremblant') nextSteps.push('Find 1968/1970 period geometry evidence; the 2001 comparison cannot provide it.');
    return { circuit_id: circuit.id, layout_id: layout.id, reference_year: race.year, race_id: String(race.id),
      structurally_ready: true, publishable_media: 0, photo_candidates: photos, blockers: [...blockers], next_steps: nextSteps, sources };
  });
  requireThat(referenced.size === candidates.assets.length && referenced.size === observations.observations.length, 'unreferenced assets or source observations');
  return { audit: 'circuit-media-intake410', as_of: asOf, source: source, circuits_checked: records.length,
    structurally_ready: records.length, publishable_media: 0, human_rights_clearances: 0,
    candidates: referenced.size, photo_candidates: records.reduce((n, row) => n + row.photo_candidates, 0), circuits: records,
    limitations: ['Structural consistency is not independent rights, venue, historical geometry or translation approval.',
      'Photo hashes and dimensions are external metadata; no photo originals were fetched.', 'Actual archive consistency requires the companion pinned-archive verifier.'] };
}

export function renderCircuitMediaReport(report) {
  const escaped = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll('[', '\\[').replaceAll(']', '\\]').replace(/[\r\n]+/g, ' ');
  const link = value => exactUrl(value).href.replaceAll('<', '%3C').replaceAll('>', '%3E').replaceAll('|', '%7C');
  return `# Twenty-circuit media intake\n\n${report.structurally_ready}/20 structurally ready; ${report.publishable_media} publishable media; ${report.human_rights_clearances} human rights clearances.\n\n| Circuit / reference | Candidate sources and declared terms | Blockers | Exact next steps |\n| --- | --- | --- | --- |\n` + report.circuits.map(row =>
    `| ${escaped(row.circuit_id)} · ${row.reference_year} · ${escaped(row.layout_id)} | ${row.sources.map(source => `[${escaped(source.claim_type)}](<${link(source.file_page_url)}>) — ${escaped(source.creator)}, ${escaped(source.source_declared_license)}; ${escaped(source.bytes)}`).join('<br>')} | ${row.blockers.map(escaped).join(', ')} | ${row.next_steps.map(escaped).join('<br>')} |`).join('\n') + '\n\n' + report.limitations.map(line => '- ' + escaped(line)).join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { 'as-of': { type: 'string', default: '2026-11-05' }, format: { type: 'string', default: 'json' }, 'require-publishable': { type: 'boolean', default: false } } });
    requireThat(['json', 'markdown'].includes(values.format), 'format must be json or markdown');
    const report = auditCircuitMediaIntake(loadCircuitMediaIntake(), { asOf: values['as-of'] });
    process.stdout.write(values.format === 'markdown' ? renderCircuitMediaReport(report) : JSON.stringify(report, null, 2) + '\n');
    if (values['require-publishable'] && report.publishable_media === 0) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
