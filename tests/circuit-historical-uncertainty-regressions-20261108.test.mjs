/** Historical circuit evidence regression gates.
 * Source: unpublished research already present in main. These assertions
 * protect uncertainty, provenance and release boundaries; they do not
 * independently certify any historical source or approve third-party media.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const research = JSON.parse(readFileSync(
  new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url),
  'utf8',
));
const byId = id => {
  const record = research.circuits.find(item => item.circuit_id === id);
  assert.ok(record, `Missing historical circuit ${id}`);
  return record;
};
const unresolved = ['ain-diab', 'clermont-ferrand', 'dallas', 'detroit', 'pescara', 'porto', 'sebring'];

test('seven historically unresolved circuit dossiers remain separate, bilingual and research-only', () => {
  for (const id of unresolved) {
    const record = byId(id);
    assert.equal(record.independent_numbering_verified, false, id);
    assert.equal(record.numbered_apex_verified, false, id);
    assert.equal(record.editorial_reader_preview.editorial_status, 'research_only', id);
    assert.match(record.editorial_reader_preview.source_url, /^https:\/\//, id);
    assert.ok(record.editorial_reader_preview.en.length > 300, id + ':en');
    assert.ok(record.editorial_reader_preview.uk.length > 300, id + ':uk');
    assert.ok(record.sections.length >= 7, id);
    assert.ok(record.sections.every(section => section.turn_numbers === null), id);
  }
});

test('Detroit: 17 organiser turns and 24 archived bends cannot become FIA apex numbering', () => {
  const review = byId('detroit').layout_evidence_review;
  const finding = review.independent_historical_count_adjudication;
  assert.equal(finding.organizer_turns, 17);
  assert.equal(finding.f1db_layout_bends, 24);
  assert.equal(finding.certified_fia_turn_number_crosswalk, false);
  assert.equal(review.archive_turn_count, 24);
  assert.ok(review.turn_count_source_comparison.some(x => x.count === 17 && x.source.includes('promoter')));
  assert.ok(review.turn_count_source_comparison.some(x => x.count === 24 && x.source.includes('F1DB')));
  assert.ok(review.evidence.every(source => source.supports_apex_numbering === false));
});

test('Sebring: 12 December 1959 official event date overrides contradicted March chronology', () => {
  const review = byId('sebring').layout_evidence_review;
  assert.equal(review.event_date_authority.date, '1959-12-12');
  assert.equal(review.event_date_authority.winner, 'Bruce McLaren');
  assert.equal(review.event_date_authority.not_numbered_apex_evidence, true);
  assert.match(review.event_date_authority.source, /^https:\/\/www\.formula1\.com\/en\/results\/1959\//);
  assert.equal(review.incorrect_secondary_source_claim.do_not_reproduce_march_date, true);
  assert.match(review.incorrect_secondary_source_claim.issue, /28 March 1959/);
  assert.match(review.incorrect_secondary_source_claim.issue, /12 December 1959/);
  assert.equal(review.period_report_bend_sequence.individually_numbered_apexes, 0);
});

test('Ain-Diab: 1957/1958 course continuity does not settle 15-versus-18 turn conflict', () => {
  const review = byId('ain-diab').layout_evidence_review;
  assert.equal(review.period_1957_1958_comparison.layout_continuity_reported, true);
  assert.equal(review.period_1957_1958_comparison.surface_upgrades_reported, true);
  assert.equal(review.period_1957_1958_comparison.individual_apex_numbering_in_either_year_verified, false);
  assert.equal(review.archival_count_semantics.f1db_layout_turns, 18);
  assert.equal(review.archival_count_semantics.venue_summary_turns, 15);
  assert.equal(review.archival_count_semantics.certified_apex_numbers, 0);
});

test('Pescara: both possible Esse di Cappelle sites stay unresolved and unnumbered', () => {
  const circuit = byId('pescara');
  const adjudication = circuit.layout_evidence_review.local_place_name_adjudication;
  assert.equal(adjudication.two_candidate_esse_sites.length, 2);
  assert.equal(adjudication.source_author_explicitly_unsure, true);
  assert.equal(adjudication.precise_1957_esse_site_verified, false);
  assert.equal(adjudication.independent_period_name_attestation, false);
  assert.ok(adjudication.two_candidate_esse_sites.every(site => site.historical_number === null));
  assert.equal(circuit.layout_evidence_review.archive_count_basis.numbered_apex_map_verified, false);
  assert.equal(circuit.layout_evidence_review.archive_count_basis.f1db_bend_count, 24);
});

test('Dallas: provisional and definitive plan descriptions remain unexamined archival leads', () => {
  const circuit = byId('dallas');
  const review = circuit.layout_evidence_review;
  assert.equal(review.historical_plan_bibliography.length, 6);
  assert.ok(review.historical_plan_bibliography.every(lead =>
    lead.map_content_examined === false &&
    lead.comparison_to_race_day_completed === false &&
    lead.third_party_map_reuse_approved === false &&
    lead.period_fia_numbering_verified === false &&
    lead.archival_index_url.startsWith('https://')
  ));
  assert.equal(review.finish_line_version_warning.historical_version_reconciliation_complete, false);
  assert.equal(circuit.editorial_decision.certified_turn_numbers, 0);
  assert.equal(circuit.editorial_decision.publication_allowed, false);
});

test('Charade: 1972 reported changes do not back-date modern geometry or create turn numbers', () => {
  const review = byId('clermont-ferrand').layout_evidence_review;
  const changes = review.pre_1972_event_changes;
  assert.equal(changes.reported_changes.length, 4);
  assert.equal(changes.unlocated_hairpin, true);
  assert.equal(changes.apex_numbers_identified, false);
  assert.equal(changes.do_not_equate_with_named_marlboro_hairpin, true);
  assert.equal(changes.do_not_project_1989_shortened_layout_backwards, true);
  assert.equal(review.period_1972_confirmed_named_landmark.historical_name_attested_in_1972, true);
  assert.equal(review.period_1972_confirmed_named_landmark.official_turn_number, null);
  assert.equal(review.period_1972_confirmed_named_landmark.location_kind, 'route_order_only_not_surveyed_apex');
});

test('archival Commons candidates have not been licensed, ingested or enabled for public display', () => {
  const media = unresolved.flatMap(id => byId(id).licensed_media_research_candidates ?? []);
  assert.equal(media.length, 9);
  assert.equal(new Set(media.map(asset => asset.id)).size, media.length);
  for (const asset of media) {
    assert.match(asset.commons_file_page, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/, asset.id);
    assert.ok(asset.author && asset.declared_license && asset.source_provenance, asset.id);
    assert.equal(asset.rights_review_complete, false, asset.id);
    assert.equal(asset.asset_downloaded, false, asset.id);
    assert.equal(asset.repository_intake_approved, false, asset.id);
    assert.equal(asset.public_render_allowed, false, asset.id);
    assert.equal(asset.not_official_numbered_map, true, asset.id);
  }
});

test('period reporting cannot be promoted into geometry approvals via source URLs', () => {
  for (const id of unresolved) {
    const record = byId(id);
    const evidence = record.layout_evidence_review.evidence;
    assert.ok(evidence.length >= 2, id);
    assert.ok(evidence.every(entry => entry.supports_apex_numbering === false), id);
    assert.equal(record.independent_numbering_verified, false, id);
    assert.ok(record.editorial_reader_preview.en.trim() && record.editorial_reader_preview.uk.trim(), id);
  }
});
