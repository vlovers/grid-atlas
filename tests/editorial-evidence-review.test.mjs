// Regressions from both independent reviews of PR #422 (round 1: HIGH 1–2, MEDIUM 3–6; round 2:
// N1–N8). Each case was reproduced by a reviewer and fails without its fix. Real pinned-F1DB data;
// synthetic snapshots and a synthetic stand-in for the reviewed Ukrainian name table only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { F1dbIndex, acceptCornerName, checkCandidate, isPureStatistic, normalizeWhitespace, verdictToClaim } from '../packages/editorial-evidence/src/index.ts';
import { checkClaim, sha256 } from '../packages/editorial-policy/src/index.ts';

const archive = JSON.parse(readFileSync('docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json', 'utf8'));
const index = new F1dbIndex(archive);
const UK_TABLE = new Map([['Ален Прост', 'alain-prost'], ['Айртон Сенна', 'ayrton-senna'], ['Сенна', 'ambiguous:senna'], ['сенна', 'ambiguous:senna']]);
const indexUk = new F1dbIndex(archive, UK_TABLE);
const name = w => index.isDriverNameWord(w);
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
  assert.equal(isPureStatistic('Prost won the 1985 race.', name), true);
  assert.equal(isPureStatistic('Prost won here in 1985 after a dramatic late duel in the rain.', name), false);
  const c = cand('monaco', 'Prost won here in 1985 after a dramatic late duel in the rain.');
  const claim = verdictToClaim(c, winnerVerdict(c, race('monaco', 1985), 'alain-prost', 1985), [], name);
  assert.equal(claim.claim_type, 'historical_event');
  const result = checkClaim(claim, item, ctx);
  assert.ok(result.unverifiable.some(f => f.code === 'evidence_insufficient'), 'the dataset alone cannot verify the narrative');
});

test('HIGH 2 / N2. the policy requires EN and UK to name the same driver; without a name table it fails closed', () => {
  const verdictFor = c => verdictToClaim(c, winnerVerdict(c, race('monaco', 1985), 'alain-prost', 1985), [], name);
  const ctxUk = { ...ctx, entities: indexUk.entities, renderStructured: indexUk.renderStructured };
  const codes = (claim, context) => checkClaim(claim, item, context).failures.map(f => f.code);
  // No reviewed table: any claim naming someone fails, whatever the Ukrainian says.
  assert.ok(codes(verdictFor(cand('monaco', 'Alain Prost won the 1985 race.', 'Перегони 1985 року виграв Ален Прост.')), ctx).includes('claim_entities_differ_across_locales'));
  // With the table: the right name passes; a different name fails in any position or case.
  assert.deepEqual(codes(verdictFor(cand('monaco', 'Alain Prost won the 1985 race.', 'Перегони 1985 року виграв Ален Прост.')), ctxUk), []);
  for (const uk of ['Сенна виграв перегони 1985 року.', 'Перегони 1985 року виграв сенна.', 'Перегони 1985 року виграв Сенна.']) {
    assert.ok(codes(verdictFor(cand('monaco', 'Alain Prost won the 1985 race.', uk)), ctxUk).includes('claim_entities_differ_across_locales'), uk);
  }
});

test('N1. a record from another season at the same circuit cannot back the claim', () => {
  const c = cand('monaco', 'Senna won the 1985 race.', 'Перегони 1985 року виграв Сенна.');
  const claim = verdictToClaim(c, { ...winnerVerdict(c, race('monaco', 1987), 'ayrton-senna', 1987), dataset_evidence: [{ dataset_ref: ref(race('monaco', 1987), 'winner'), value: 'ayrton-senna' }] }, [], name);
  assert.ok(checkClaim(claim, item, { ...ctx, entities: indexUk.entities }).failures.some(f => f.code === 'dataset_season_not_stated'));
});

test('N3. teams, pole, margins and possessives keep a sentence off the dataset-only path', () => {
  for (const text of ['Prost won the 1985 race with Ferrari.', 'Prost won from pole in 1985.', 'Prost won the 1985 race by a lap.', "Senna's 1985 win was ahead of Prost."]) {
    assert.equal(isPureStatistic(text, name), false, text);
  }
  assert.equal(isPureStatistic('Alain Prost won the 1985 Grand Prix.', name), true);
  assert.ok(index.entities("Senna's 1985 win").includes('ambiguous:senna'), 'a bare shared surname is ambiguous, not a specific driver');
  assert.ok(index.entities("Ayrton Senna's 1985 win").includes('ayrton-senna'), 'a possessive full name resolves to the driver');
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
    // Round 2 (N6): appositive commas and possessive victories.
    ['monaco', 'In 1992 Mansell, driving a Williams, won.', 'conflict'],
    ['monaco', "Mansell's 1992 victory came easily.", 'conflict'],
    ['monaco', "Senna's 1992 victory came after a late charge.", 'supported'],
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
  // Round 2 (N4, N5): a name followed by the next entry's number, and a "name" containing a turn reference.
  reject({ name: 'Maggotts', excerpt: 'Turn 8 Maggotts, Turn 7 Copse' }, 'name_not_linked_to_turn');
  reject({ name: 'Turn 7 is not Copse', excerpt: 'Turn 7 is not Copse.' }, 'not_a_name');
  const labelled = 'Map 1990 legend. Copse (Turn 7) is fast.';
  assert.equal(acceptCornerName({ ...base, excerpt: 'Copse (Turn 7) is fast', locator: 'legend' }, { source_id: 's', text: labelled, content_sha256: sha256(labelled) }, seasons).accepted, true, 'explicit label "Name (Turn N)"');
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

// Round 3: the dataset alone verifies only canonical statements (policy v1.6.0); shared surnames are
// ambiguous entities; constructors are recognised. Real archive, synthetic reviewed-name-table stand-in.
test('round 3. only the canonical rendering is verified by the dataset; extra years, wrong Hills and wrong teams are not', () => {
  const table = new Map([['Ален Прост', 'alain-prost'], ['Грем Хілл', 'graham-hill'], ['Деймон Хілл', 'damon-hill'], ['Міхаель Шумахер', 'michael-schumacher']]);
  const idx = new F1dbIndex(archive, table);
  const context = { ...ctx, entities: idx.entities, renderStructured: idx.renderStructured };
  const outcome = (circuit, en, uk, r, extra = []) => {
    const c = cand(circuit, en, uk);
    const claim = verdictToClaim(c, { ...winnerVerdict(c, r, r.winners.join(' / '), r.season), dataset_evidence: [{ dataset_ref: ref(r, 'winner'), value: r.winners.join(' / ') }, { dataset_ref: ref(r, 'season'), value: r.season }, ...extra] }, [], idx.isDriverNameWord);
    const result = checkClaim(claim, item, context);
    return [...result.failures, ...result.unverifiable].map(f => f.code);
  };
  assert.deepEqual(outcome('monaco', 'Alain Prost won the 1988 race.', 'Перегони 1988 року виграв Ален Прост.', race('monaco', 1988)), []);
  const extraYear = outcome('monaco', 'Alain Prost won the 1988 race, the 1950 race.', 'Перегони 1988 року виграв Ален Прост.', race('monaco', 1988),
    [{ dataset_ref: { dataset: 'f1db', release: 'v2026.17.0', record: 'circuit:monaco', field: 'first_season' }, value: 1950 }]);
  assert.ok(extraYear.includes('evidence_insufficient'), extraYear.join());
  const wrongHill = outcome('suzuka', 'Graham Hill won the 1996 race.', 'Перегони 1996 року виграв Грем Хілл.', race('suzuka', 1996));
  assert.ok(wrongHill.includes('claim_entity_unsupported') && wrongHill.includes('dataset_value_not_stated'), wrongHill.join());
  const wrongTeam = outcome('monaco', "Michael Schumacher's Jordan won the 2001 race.", 'Перегони 2001 року виграв Міхаель Шумахер.', race('monaco', 2001));
  assert.ok(wrongTeam.includes('claim_entity_unsupported'), wrongTeam.join());
  assert.deepEqual(idx.entities('Hill won with Ferrari.').sort(), ['ambiguous:hill', 'constructor:ferrari', 'constructor:hill']);
  assert.deepEqual(idx.entities('Alain Prost won.'), ['alain-prost'], 'a full driver name is not also the team named after him');
});
