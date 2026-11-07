import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { auditCircuitMediaIntake, loadCircuitMediaIntake, renderCircuitMediaReport } from '../scripts/audit-circuit-media-intake.mjs';
import { mediaFingerprint, selectMediaCollection } from '../apps/web/src/components/media/registry.ts';
import { selectCircuitVisualDiagram } from '../apps/web/src/components/media/circuit-visual-intake/selection.ts';

const original = loadCircuitMediaIntake();
const changed = mutate => { const data = structuredClone(original); mutate(data); return data; };

test('20 exact circuit/race/layout records and26 source candidates are structurally complete but never publishable', () => {
  const report = auditCircuitMediaIntake(original);
  assert.equal(report.circuits_checked, 20);
  assert.equal(report.structurally_ready, 20);
  assert.equal(report.candidates, 26);
  assert.equal(report.photo_candidates, 6);
  assert.equal(report.publishable_media, 0);
  assert.equal(report.human_rights_clearances, 0);
  for (const row of report.circuits) {
    assert.equal(selectMediaCollection(original.candidates.assets, { type: 'circuit', id: row.circuit_id }).length, 0);
    assert.ok(row.blockers.includes('independent_human_rights_review'));
    assert.ok(row.blockers.includes('period_geometry_not_authenticated'));
  }
  assert.ok(report.circuits.find(row => row.circuit_id === 'bugatti').blockers.includes('layout_event_metadata_conflict'));
  assert.ok(report.circuits.find(row => row.circuit_id === 'mont-tremblant').blockers.includes('modern_comparison_not_period_evidence'));
});

const cases = {
  'wrong venue': data => { data.intake.entries[0].circuit_id = 'silverstone'; },
  'wrong historical year': data => { data.intake.entries[0].reference_year = 1984; },
  'wrong layout': data => { data.intake.entries[0].layout_id = 'monaco-4'; },
  'fake human approval': data => { data.candidates.assets[0].review = { actor: 'human', reviewer: 'invented' }; },
  'positive root approval': data => { data.intake.publication_allowed = true; },
  'hidden nested rights grant': data => { data.intake.entries[0].media_rights_approved = true; },
  'hidden candidate rights grant': data => { data.candidates.assets[0].media_rights_approved = true; },
  'source renamed to rights-cleared': data => { data.observations.observations[0].rights_state = 'licensed'; },
  'missing license evidence': data => { data.observations.observations[0].license_source_url = null; },
  'wrong creator despite consistent self-asserted source metadata': data => { data.candidates.assets[0].creator = data.observations.observations[0].creator_asserted = 'Wrong creator'; data.candidates.assets[0].attribution += ' Wrong creator'; },
  'missing attribution': data => { data.candidates.assets[0].attribution = ''; },
  'incorrect local hash': data => { data.candidates.assets[0].content_sha256 = 'a'.repeat(64); },
  'metadata promoted to inspected original': data => { data.observations.observations.find(row => row.claim_type === 'photograph').bytes.local_sha256 = 'a'.repeat(64); },
  'fake human verification method': data => { data.observations.observations[0].method = 'human_approved'; },
  'missing source locator': data => { data.observations.observations[0].source_locator = ''; },
  'future verification timestamp': data => { data.observations.observations[0].observed_at = '2027-01-01T00:00:00Z'; },
  'misleading verified caption': data => { data.candidates.assets[0].caption.en = 'Verified licensed photo ready for publication'; },
  'caption absent in Ukrainian': data => { data.candidates.assets[0].caption.uk = null; },
  'photo backdated to F1 reference year': data => { const row = data.candidates.assets.find(asset => asset.id.endsWith('spa-francorchamps-photo')); row.historical_context.year = 2025; },
  'duplicate original candidate': data => { const row = structuredClone(data.candidates.assets[0]); row.id += '-duplicate'; data.candidates.assets.push(row); const observation = structuredClone(data.observations.observations[0]); observation.candidate_id = row.id; data.observations.observations.push(observation); data.intake.entries[0].candidate_ids.push(row.id); },
  'Bugatti discrepancy erased': data => { data.intake.entries.find(row => row.circuit_id === 'bugatti').caveats = []; },
  'Mont-Tremblant modern comparison certified': data => { data.intake.entries.find(row => row.circuit_id === 'mont-tremblant').caveats = []; },
};
for (const [name, mutate] of Object.entries(cases)) test(`rejects ${name} from a known passing baseline`, () => {
  assert.equal(auditCircuitMediaIntake(original).structurally_ready, 20);
  assert.throws(() => auditCircuitMediaIntake(changed(mutate)));
});

test('read-only CLI produces source-attributed20-circuit report and strict publication gate exits nonzero', () => {
  const paths = ['docs/media/circuit-intake-410/intake.json', 'docs/media/circuit-intake-410/candidates.json', 'apps/web/src/components/media/publication.json'];
  const hashes = () => paths.map(path => createHash('sha256').update(readFileSync(path)).digest('hex'));
  const before = hashes();
  const json = JSON.parse(execFileSync(process.execPath, ['scripts/audit-circuit-media-intake.mjs'], { encoding: 'utf8' }));
  assert.equal(json.structurally_ready, 20);
  const report = renderCircuitMediaReport(json);
  assert.equal((report.match(/^\| [a-z].* · /gm) ?? []).length, 20);
  assert.match(report, /0 publishable media/);
  assert.match(report, /source_metadata_only/);
  assert.equal(spawnSync(process.execPath, ['scripts/audit-circuit-media-intake.mjs', '--require-publishable']).status, 1);
  assert.deepEqual(hashes(), before);
});

test('source-derived names cannot forge Markdown rows or HTML in the handoff', () => {
  const data = changed(bundle => {
    const asset = bundle.candidates.assets.find(row => row.kind === 'photograph');
    const creator = '<img src=x onerror=alert(1)> | CLEARED\n| invented | approved';
    asset.creator = creator; asset.attribution += creator;
    bundle.observations.observations.find(row => row.candidate_id === asset.id).creator_asserted = creator;
  });
  const reportData = auditCircuitMediaIntake(data);
  reportData.circuits[0].sources[0].file_page_url += '?source=a|b';
  const report = renderCircuitMediaReport(reportData);
  assert.doesNotMatch(report, /<img|\n\| invented/);
  assert.match(report, /&lt;img/);
  assert.match(report, /\\\| CLEARED/);
  assert.match(report, /source=a%7Cb/);
  assert.doesNotMatch(report, /source=a\|b/);
});

test('diagram proposal requires live rights approval and exact venue/layout/event, using memory-only synthetic decisions', () => {
  const asset = structuredClone(original.candidates.assets[0]);
  Object.assign(asset, { status: 'verified', ai_generated: false,
    rights_note: 'SYNTHETIC TEST DECISION ONLY — never saved to a publication registry.',
    delivery: { local_path: '/media/synthetic-test.svg', remote_url: null } });
  asset.review = { actor: 'human', reviewer: 'SYNTHETIC TEST REVIEWER — not a real person', reviewed_on: '2026-11-05',
    note: 'Memory-only test decision, not permission to publish.', payload_sha256: mediaFingerprint(asset) };
  const context = { id: asset.subject.id, layout: asset.layout.id, raceId: asset.layout.race_ids[0] };
  const selected = (candidate = asset, binding = context) => selectCircuitVisualDiagram([candidate], binding, '2026-11-05');
  assert.equal(selected(), asset);
  for (const binding of [{ ...context, id: 'other-venue' }, { ...context, layout: 'other-layout' }, { ...context, raceId: 'other-event' }]) assert.equal(selected(asset, binding), null);
  for (const status of ['candidate', 'withdrawn', 'rejected']) assert.equal(selected({ ...asset, status }), null);
  assert.equal(selected({ ...asset, review: null }), null);
  const stale = structuredClone(asset); stale.caption.en += ' Changed after review.';
  assert.equal(selected(stale), null);
  assert.equal(selectCircuitVisualDiagram([asset, asset], context, '2026-11-05'), null);
});
