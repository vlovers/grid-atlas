import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dossier = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next20-bilingual-histories-v1.json', 'utf8'));
const catalog = JSON.parse(readFileSync('docs/editorial/circuit-experience-v3/next20-f1db-layout-catalog-v1.json', 'utf8'));
const features = dossier.circuits.flatMap((c) => c.corner_names.map((f) => ({ circuit: c.circuit_id, ...f })));
const feature = (circuit, name) => features.find((f) => f.circuit === circuit && f.name === name);

test('all 34 candidate features are typed and sourced without claiming a verified historical turn', () => {
  assert.equal(dossier.circuits.length, 20);
  assert.equal(features.length, 34);
  assert.equal(new Set(features.map((f) => f.circuit)).size, 10);
  const allowed = new Set([
    'named_turn', 'corner_pair', 'corner_sequence', 'corner_sequence_component',
    'chicane', 'multi_apex_turn', 'historical_layout_sensitive',
    'barrier', 'straight', 'stadium_section',
  ]);
  for (const f of features) {
    assert.ok(allowed.has(f.feature_kind), f.name);
    assert.equal(f.feature_evidence_status, 'feature_kind_supported_not_layout_number_verified', f.name);
    assert.ok(f.feature_source_url.startsWith('https://'), f.name);
    assert.ok(f.feature_scope_note.length > 35, f.name);
    assert.equal(f.layout_binding_status, 'not_verified', f.name);
    assert.equal(f.turn_number, null, f.name);
    assert.equal(f.configuration_id, null, f.name);
    assert.equal(f.status, 'name_candidate_needs_official_number_and_layout', f.name);
  }
  assert.equal(catalog.summary.race_level_verified_events, 105);
  assert.ok(catalog.circuits.every((c) => c.corner_numbering_verified === false));
});

test('non-corners and multi-turn features cannot be silently published as single numbered turns', () => {
  assert.equal(feature('gilles-villeneuve', 'Wall of Champions').feature_kind, 'barrier');
  assert.equal(feature('nurburgring', 'Döttinger Höhe').feature_kind, 'straight');
  assert.equal(feature('hockenheimring', 'Motodrom').feature_kind, 'stadium_section');
  assert.equal(feature('monza', 'Lesmo').feature_kind, 'corner_pair');
  assert.equal(feature('monza', 'Ascari').feature_kind, 'chicane');
  assert.equal(feature('suzuka', 'Degner').feature_kind, 'corner_pair');
  assert.equal(feature('suzuka', 'Esses').feature_kind, 'corner_sequence');
  assert.equal(feature('interlagos', 'Senna S').feature_kind, 'corner_sequence');
  assert.equal(feature('interlagos', 'Descida do Lago').feature_kind, 'corner_sequence');
  assert.equal(feature('imola', 'Rivazza').feature_kind, 'corner_pair');
  assert.equal(feature('imola', 'Tamburello').feature_kind, 'historical_layout_sensitive');
  assert.equal(feature('imola', 'Villeneuve').feature_kind, 'historical_layout_sensitive');
  assert.equal(feature('istanbul-park', 'Turn 8').feature_kind, 'multi_apex_turn');
  assert.ok(feature('monza', 'Parabolica').feature_scope_note.includes('Curva Alboreto'));
  assert.ok(feature('monza', 'Curva Grande').feature_scope_note.includes('Biassono'));
});

test('Montreal 1999 narrative no longer undercounts crashes at the Wall of Champions', () => {
  const event = dossier.circuits.find((c) => c.circuit_id === 'gilles-villeneuve').moments.find((m) => m.year === 1999);
  assert.match(event.narrative.en, /Ricardo Zonta.*during the race/);
  assert.match(event.narrative.en, /Ralf Schumacher.*qualifying/);
  assert.match(event.narrative.uk, /Рікардо Зонта.*гонки/);
  assert.match(event.narrative.uk, /Ральф Шумахер.*кваліфікації/);
  assert.ok(event.sources.some((url) => url.includes('what-is-the-wall-of-champions')));
  assert.equal(event.review_status, 'source_checked_research_draft');
  assert.equal(dossier.publication, 'blocked_pending_independent_historical_review');
});
