// Regressions from the independent review of PR #422. Each case was reproduced by the reviewer
// (HIGH 1–2, MEDIUM 3–6) and fails without its fix. Real pinned-F1DB data; synthetic snapshots only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { F1dbIndex, acceptCornerName, checkCandidate, isPureStatistic, normalizeWhitespace, unresolvedUkNames, verdictToClaim } from '../packages/editorial-evidence/src/index.ts';
import { checkClaim, sha256 } from '../packages/editorial-policy/src/index.ts';

const archive = JSON.parse(readFileSync('docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json', 'utf8'));
const index = new F1dbIndex(archive);
const race = (circuit, season) => archive.circuits.find(c => c.circuit_id === circuit).races.find(r => r.season === season);
const ref = (r, field) => ({ dataset: 'f1db', release: 'v2026.17.0', record: `race:${r.race_id}`, field });
const cand = (circuit_id, en, uk = null) => ({ claim_id: `${circuit_id}:x#s1`, block_id: `${circuit_id}:x`, circuit_id, kind: 'x', provenance: { file: 'drafts.json' },
  en, uk, alignment: uk ? 'sentence' : 'unaligned', claim_type: 'statistic', importance: 'critical', cited_urls: [] });
const ctx = { pinned_dataset_release: 'v2026.17.0', dataset: index.lookup, entities: index.entities, evaluated_at: '2026-11-17T00:00:00Z' };
const verifier = { id: 'f1db-verifier', role: 'automated_verifier', run_id: 'v1' };
const item = { sources: [], authorship: { writer: { id: 'legacy:drafts.json', role: 'writer', run_id: 'legacy:drafts.json' } } };
const winnerVerdict = (c, r, winner, season) => ({ claim_id: c.claim_id, verdict: 'supported', evidence: [],
  dataset_evidence: [{ dataset_ref: ref(r, 'winner'), value: winner }, { dataset_ref: ref(r, 'season'), value: season }], checker: verifier, checked_at: '2026-11-16T00:00:00Z' });

test('HIGH 1. a record from another race cannot verify a claim about this circuit', () => {
  const c = cand('monaco', 'Senna won here in 1985.', 'Тут переміг Сенна у 1985 році.');
  const claim = verdictToClaim(c, winnerVerdict(c, race('estoril', 1985), 'ayrton-senna', 1985), []);
  const codes = checkClaim(claim, item, ctx).failures.map(f => f.code);
  assert.ok(codes.includes('dataset_record_out_of_scope'), codes.join());
});

test('HIGH 1. narrative "won" sentences are not dataset-only statistics', () => {
  assert.equal(isPureStatistic('Prost won the 1985 race.'), true);
  assert.equal(isPureStatistic('Prost won here in 1985 after a dramatic late duel in the rain.'), false);
  const c = cand('monaco', 'Prost won here in 1985 after a dramatic late duel in the rain.');
  const claim = verdictToClaim(c, winnerVerdict(c, race('monaco', 1985), 'alain-prost', 1985), []);
  assert.equal(claim.claim_type, 'historical_event');
  const result = checkClaim(claim, item, ctx);
  assert.ok(result.unverifiable.some(f => f.code === 'evidence_insufficient'), 'the dataset alone cannot verify the narrative');
});

test('HIGH 2. a Ukrainian statement naming someone is quarantined until the name table resolves it', () => {
  const c = cand('monaco', 'Prost won the 1985 race.', 'Перегони 1985 року виграв Прост.');
  const quarantined = verdictToClaim(c, winnerVerdict(c, race('monaco', 1985), 'alain-prost', 1985), []);
  assert.equal(quarantined.verification.status, 'insufficient_evidence');
  assert.match(quarantined.verification.notes, /uk_names_unbound: Прост/);
  const wrongUk = cand('monaco', 'Prost won the 1985 race.', 'Перегони 1985 року виграв Сенна.');
  assert.equal(verdictToClaim(wrongUk, winnerVerdict(wrongUk, race('monaco', 1985), 'alain-prost', 1985), []).verification.status, 'insufficient_evidence');
  const resolved = verdictToClaim(c, winnerVerdict(c, race('monaco', 1985), 'alain-prost', 1985), [], new Map([['Прост', 'alain-prost']]));
  assert.equal(resolved.verification.status, 'verified');
  assert.deepEqual(checkClaim(resolved, item, ctx).failures, []);
  assert.deepEqual(unresolvedUkNames('Перегони 1985 року.', new Map()), [], 'sentence-initial capital is not a name');
});

test('LOW. the legacy writer of the sentence cannot check it', () => {
  const c = cand('monaco', 'Prost won the 1985 race.');
  assert.throws(() => verdictToClaim(c, { ...winnerVerdict(c, race('monaco', 1985), 'alain-prost', 1985), checker: { id: 'legacy:drafts.json', role: 'fact_check', run_id: 'x' } }, []));
});

test('MEDIUM 3–4. winner checks credit the asserted subject, disambiguate first names and scope negation to the clause', () => {
  const cases = [
    ['monaco', 'In 1992 Senna won the race, and Mansell won the 1993 race.', 'conflict'],
    ['imola', 'In 2002 Ralf Schumacher won.', 'conflict'],
    ['monaco', 'In 1969 Damon Hill won.', 'conflict'],
    ['monaco', 'In 1969 Graham Hill won.', 'supported'],
    ['monaco', 'In 1992 Mansell won the Grand Prix with no rival close.', 'conflict'],
    ['monaco', 'In 1985 Prost won, a year after he lost the 1984 race.', 'supported'],
    ['monaco', 'Mansell was the 1992 winner.', 'conflict'],
    ['monaco', 'In 1992 Mansell beat Senna to victory.', 'conflict'],
    ['monaco', 'In 1992 Senna held off Mansell to win.', 'supported'],
    ['interlagos', 'In 1975 Fittipaldi was victorious.', 'conflict'],
    ['east-london', 'Clark needed to win the 1962 South African finale at East London and led from pole.', 'none'],
    ['hungaroring', 'At the inaugural Hungarian Grand Prix in 1986, Nelson Piquet passed Ayrton Senna in a memorable sideways move on the way to victory.', 'supported'],
  ];
  for (const [circuit, text, want] of cases) {
    const got = checkCandidate(cand(circuit, text), index).filter(k => k.kind === 'race_winner').map(k => k.status);
    if (want === 'none') assert.ok(!got.includes('conflict') && !got.includes('supported'), `${text} → ${got}`);
    else if (want === 'supported') assert.ok(got.includes('supported') && !got.includes('conflict'), `${text} → ${got}`);
    else assert.ok(got.includes('conflict'), `${text} → ${got}`);
  }
});

test('MEDIUM 5. corner names must be linked to the exact turn in the source, within the layout\'s seasons', () => {
  const text = 'Map 1990: Turn 7 Copse, Turn 8 Maggotts. Turn 7 is slow. Copse is at the other end. Turn 7.5 Copse. Turn 7 is not Copse. 1970 map.';
  const snap = { source_id: 's', text, content_sha256: sha256(text) };
  const base = { layout_id: 'l', turn: 7, name: 'Copse', source_id: 's', excerpt: 'Turn 7 Copse, Turn 8 Maggotts', locator: 'legend', source_period_year: 1990 };
  const seasons = [1950, 1951, 1952, 1990, 1991];
  const reject = (c, reason) => { const d = acceptCornerName({ ...base, ...c }, snap, seasons); assert.equal(d.accepted, false); assert.ok(d.reasons.includes(reason), `${reason}: ${d.reasons}`); };
  assert.equal(acceptCornerName(base, snap, seasons).accepted, true);
  reject({ excerpt: 'Turn 7 is slow. Copse is at the other end.' }, 'name_not_linked_to_turn');
  reject({ excerpt: 'Turn 7.5 Copse.' }, 'turn_number_not_in_excerpt');
  reject({ excerpt: 'Turn 7 is not Copse.' }, 'name_not_linked_to_turn');
  reject({ name: 'Turn' }, 'not_a_name');
  reject({ name: 'corner' }, 'not_a_name');
  reject({ source_period_year: 1970 }, 'source_period_outside_layout_seasons');
  reject({ source_period_year: '1990' }, 'source_period_invalid');
  reject({ name: 'Co​pse' }, 'invalid_characters');
  reject({ name: 'Maggotts', excerpt: 'Turn 7 Copse, Turn 8 Maggotts' }, 'name_not_linked_to_turn');
  reject({ source_period_year: 1991 }, 'source_period_not_in_source');
});

test('MEDIUM 6. passage locators resolve in the whitespace-normalised snapshot text', () => {
  const tasks = JSON.parse(readFileSync('docs/editorial/circuit-evidence/factcheck-tasks.json', 'utf8'));
  const passages = tasks.flatMap(t => t.passages);
  assert.ok(passages.length > 0);
  assert.equal(passages.filter(p => p.offset < 0).length, 0, 'no broken offsets');
  // With local snapshots (developer machines), every locator must re-derive its hash exactly.
  const status = JSON.parse(readFileSync('docs/editorial/circuit-evidence/source-status.json', 'utf8'));
  const sample = passages.slice(0, 200).filter(p => existsSync(`.grid-atlas/source-snapshots/${status[p.source_id]?.text_sha256}.txt`));
  for (const p of sample) {
    const text = normalizeWhitespace(readFileSync(`.grid-atlas/source-snapshots/${status[p.source_id].text_sha256}.txt`, 'utf8'));
    assert.equal(sha256(text.slice(p.offset, p.offset + p.length)), p.passage_sha256);
  }
});
