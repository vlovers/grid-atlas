// Milestone B: evidence extraction, F1DB verification, fact-check contract, corner research, quality.
// Uses the committed pinned-F1DB export and the repository's real content; synthetic snapshots only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  F1dbIndex, acceptCornerName, assessCorpus, buildRegistry, checkCandidate, enUkConsistency, extractClaims, findPassages,
  legacyWriter, loadCorpus, normalizeUrl, sentences, surnameFromSlug, verdictToClaim,
} from '../packages/editorial-evidence/src/index.ts';
import { checkClaim, claimDigest, evaluatePublication, sha256 } from '../packages/editorial-policy/src/index.ts';

const archive = JSON.parse(readFileSync('docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json', 'utf8'));
const index = new F1dbIndex(archive);
// Stand-in for the reviewed EN→UK name table (synthetic test entries only).
const indexUk = new F1dbIndex(archive, new Map([['Карлос Пасе', 'carlos-pace'], ['Пасе', 'carlos-pace']]));
const corpus = loadCorpus('.');
const claims = corpus.blocks.flatMap(extractClaims);
const candidate = (circuit_id, en, uk = null) => ({ claim_id: 'test#s1', block_id: 'test', circuit_id, kind: 'test', provenance: {}, en, uk, alignment: uk ? 'sentence' : 'unaligned', claim_type: 'statistic', importance: 'critical', cited_urls: [] });
const kinds = (checks, status) => checks.filter(c => c.status === status).map(c => c.kind);

test('ingestion reuses every existing content source without rewriting it', () => {
  const counts = Object.fromEntries(['short_summary', 'long_history_draft', 'narrative_biography', 'defining_moment', 'legacy_history', 'corner_section'].map(k => [k, corpus.blocks.filter(b => b.kind === k).length]));
  assert.deepEqual(counts, { short_summary: 73, long_history_draft: 73, narrative_biography: 51, defining_moment: 111, legacy_history: 5, corner_section: 977 });
  const interlagos = JSON.parse(readFileSync('apps/web/src/components/editorial/circuit-extra-stories.json', 'utf8')).find(s => s.id === 'interlagos');
  assert.equal(corpus.blocks.find(b => b.block_id === 'interlagos:long_history_draft').en, interlagos.description.en, 'text is taken verbatim');
  for (const c of claims.slice(0, 200)) {
    const block = corpus.blocks.find(b => b.block_id === c.block_id);
    assert.equal(c.provenance.block_en_sha256, sha256(block.en));
    assert.equal(sentences(block.en)[c.provenance.sentence_index], c.en, 'provenance points to the exact sentence');
  }
});

test('sentence splitting keeps abbreviations and decimals intact', () => {
  assert.deepEqual(sentences('Graham Hill Jr. raced at St. Devote. The lap was 3.337 km long! Next.'), ['Graham Hill Jr. raced at St. Devote.', 'The lap was 3.337 km long!', 'Next.']);
});

test('F1DB index: accent-insensitive surnames, trusted mentions and dataset lookup', () => {
  assert.equal(surnameFromSlug('elio-de-angelis'), 'Angelis');
  assert.equal(surnameFromSlug('nelson-piquet-jr'), 'Piquet');
  assert.ok(index.entities('Räikkönen won').includes('kimi-raikkonen'));
  const race = archive.circuits.find(c => c.circuit_id === 'interlagos').races.find(r => r.season === 1975);
  const winner = index.lookup({ dataset: 'f1db', release: 'v2026.17.0', record: `race:${race.race_id}`, field: 'winner' });
  assert.equal(winner.value, 'carlos-pace');
  assert.ok(winner.mentions.includes('Carlos Pace') && winner.mentions.includes('Pace'));
  assert.equal(index.lookup({ dataset: 'f1db', release: 'v2000.0.0', record: `race:${race.race_id}`, field: 'winner' }), undefined, 'other releases are refused');
});

test('dataset checks: real facts are supported and contradicted facts are flagged', () => {
  const ok = checkCandidate(candidate('interlagos', 'Carlos Pace won the 1975 Brazilian Grand Prix after Jarier took pole.'), index);
  assert.deepEqual(kinds(ok, 'conflict'), []);
  assert.ok(kinds(ok, 'supported').includes('race_winner') && kinds(ok, 'supported').includes('pole'));
  const bad = checkCandidate(candidate('interlagos', 'Jarier won the 1975 Brazilian Grand Prix.'), index);
  assert.ok(kinds(bad, 'conflict').includes('race_winner'));
  const passive = checkCandidate(candidate('brands-hatch', 'Brands Hatch hosted the 1986 British Grand Prix, won by Piquet.'), index);
  assert.ok(kinds(passive, 'conflict').includes('race_winner'), 'passive voice credits the named driver');
  assert.ok(kinds(checkCandidate(candidate('interlagos', 'The first championship race here was held in 1960.'), index), 'conflict').includes('first_race'));
});

test('dataset checks: known false-positive shapes do not raise conflicts', () => {
  const shapes = [
    ['istanbul', 'Felipe Massa won his first Formula 1 Grand Prix at İstanbul Park in 2006.'],
    ['sepang', 'Max Verstappen passed Lewis Hamilton and won the 2017 Malaysian Grand Prix, the final event of the 1999–2017 run.'],
    ['imola', 'Imola’s first World Championship race carried Italy’s national title; from 1981 it became the San Marino Grand Prix.'],
    ['mosport', 'Formula One raced here from 1967 to 1977, when Jody Scheckter won the final Canadian Grand Prix at the venue.'],
    ['imola', 'The 1994 weekend requires a different tone: the official winner cannot stand in for the deaths of Ratzenberger and Senna.'],
  ];
  for (const [circuit, text] of shapes) assert.deepEqual(kinds(checkCandidate(candidate(circuit, text), index), 'conflict'), [], text);
});

test('dataset checks: zero conflicts on the real corpus and ≥95% detection of seeded winner swaps', () => {
  assert.equal(claims.flatMap(c => checkCandidate(c, index)).filter(k => k.status === 'conflict').length, 0);
  let trials = 0, caught = 0;
  for (const c of claims) for (const k of checkCandidate(c, index).filter(x => x.kind === 'race_winner' && x.status === 'supported')) {
    const race = archive.circuits.flatMap(x => x.races).find(r => `race:${r.race_id}` === k.refs[0].record);
    const winner = race.winners.map(surnameFromSlug).find(s => c.en.includes(s));
    const second = race.podium.find(p => p.position === 2 && !race.winners.includes(p.driver))?.driver;
    if (!winner || !second) continue;
    trials++;
    if (checkCandidate({ ...c, en: c.en.replaceAll(winner, surnameFromSlug(second)) }, index).some(x => x.kind === 'race_winner' && x.status === 'conflict')) caught++;
  }
  assert.ok(trials >= 50, `enough seeded trials (${trials})`);
  assert.ok(caught / trials >= 0.95, `detection ${caught}/${trials}`);
});

test('end to end: a real F1DB fact verified by the automated dataset verifier satisfies the hardened policy', () => {
  const race = archive.circuits.find(c => c.circuit_id === 'interlagos').races.find(r => r.season === 1975);
  const ref = field => ({ dataset: 'f1db', release: 'v2026.17.0', record: `race:${race.race_id}`, field });
  const claim = {
    claim_id: 'interlagos-1975-winner', entity: { type: 'race', id: race.race_id }, claim_type: 'structured_statistic', importance: 'critical',
    statement: { en: 'Carlos Pace won the 1975 Brazilian Grand Prix.', uk: 'Гран-прі Бразилії 1975 року виграв Карлос Пасе.' }, presentation: 'asserted',
    evidence: [{ dataset_ref: ref('winner'), value: 'carlos-pace' }, { dataset_ref: ref('season'), value: 1975 }], verification: null,
  };
  claim.verification = { status: 'verified', method: 'dataset_comparison', verifier: { id: 'f1db-verifier', role: 'automated_verifier', run_id: 'v1' }, verified_at: '2026-11-16T00:00:00Z', claim_sha256: claimDigest(claim, []) };
  const ctx = { pinned_dataset_release: 'v2026.17.0', dataset: index.lookup, entities: indexUk.entities, evaluated_at: '2026-11-17T00:00:00Z' };
  const item = { sources: [], authorship: { writer: legacyWriter('x') } };
  assert.deepEqual(checkClaim(claim, item, ctx), { failures: [], unverifiable: [] });
  const wrong = { ...claim, statement: { ...claim.statement, en: 'Jarier won the 1975 Brazilian Grand Prix.' } };
  wrong.verification = { ...claim.verification, claim_sha256: claimDigest(wrong, []) };
  const codes = checkClaim(wrong, item, ctx).failures.map(f => f.code);
  assert.ok(codes.includes('dataset_value_not_stated') && codes.includes('claim_entity_unsupported'));
});

test('fact-check verdicts are re-checked by the policy, never trusted', () => {
  const text = 'Carlos Pace took his only Formula One victory at Interlagos in 1975, ahead of Emerson Fittipaldi.';
  const snap = { source_id: 'src-test', url: 'https://archive.example.org/x', title: 'x', publisher: 'Example', kind: 'publication', published_on: null,
    retrieved_at: '2026-11-16T00:00:00Z', retrieved_by: { id: 'source-fetch', role: 'research', run_id: 'fetch-1' }, content_sha256: sha256(text), text };
  const cand = { ...candidate('interlagos', 'Pace took his only Formula One victory here in 1975.', 'Пасе здобув тут свою єдину перемогу у Формулі-1 1975 року.'), claim_type: 'dated_event' };
  const checker = { id: 'fact-checker', role: 'fact_check', run_id: 'fc-1' };
  const ctx = { pinned_dataset_release: 'v2026.17.0', dataset: index.lookup, entities: indexUk.entities, evaluated_at: '2026-11-17T00:00:00Z' };
  const verdict = excerpt => ({ claim_id: cand.claim_id, verdict: 'supported', evidence: [{ source_id: 'src-test', excerpt, locator: 'para 1' }], dataset_evidence: [], checker, checked_at: '2026-11-16T01:00:00Z' });
  const item = by => ({ sources: [snap], authorship: { writer: legacyWriter('drafts'), fact_checker: by } });

  const good = verdictToClaim(cand, verdict('Carlos Pace took his only Formula One victory at Interlagos in 1975'), [snap]);
  assert.deepEqual(checkClaim(good, item(checker), ctx).failures, []);
  const fabricated = verdictToClaim(cand, verdict('Carlos Pace dominated every lap of the 1975 race at Interlagos'), [snap]);
  assert.ok(checkClaim(fabricated, item(checker), ctx).failures.some(f => f.code === 'excerpt_not_in_source'));
  assert.throws(() => verdictToClaim(cand, { ...verdict('x'), claim_id: 'other' }, [snap]));

  // Run the whole policy: a verdict from the legacy writer itself is not independent.
  const selfCheck = verdictToClaim(cand, { ...verdict('Carlos Pace took his only Formula One victory at Interlagos in 1975'), checker: legacyWriter('drafts') }, [snap]);
  const decision = evaluatePublication({ item_id: 'i', entity: { type: 'circuit', id: 'interlagos' }, dataset_release: 'v2026.17.0',
    blocks: [{ block_id: 'b', kind: 'history', body: { en: cand.en, uk: cand.uk }, claim_ids: [cand.claim_id], links: [] }], claims: [selfCheck], sources: [snap], media: [],
    authorship: { writer: legacyWriter('drafts'), fact_checker: legacyWriter('drafts'), localizer: null }, editorial_review: null },
  { ...ctx, known_routes: new Set(), corpus: [], license_allowlist: [], technical_receipt: null });
  // The writer as fact-checker is rejected by the policy; the Ukrainian name "Пасе" also keeps it from verifying.
  assert.ok(decision.gates.flatMap(g => g.findings).some(f => f.code === 'self_fact_check'));
  assert.notEqual(decision.outcome, 'PASS');
  // verdictToClaim itself refuses a checker that is the recorded legacy writer of the sentence's file.
  assert.throws(() => verdictToClaim({ ...cand, provenance: { file: 'drafts' } }, { ...verdict('x'), checker: legacyWriter('drafts') }, [snap]));
});

test('passage finder locates candidate passages but marks number coverage honestly', () => {
  const docs = [{ source_id: 's', url: 'https://x.example', text: 'Pace won in 1975 at Interlagos. Fittipaldi was second. The circuit opened in 1940.' }];
  const [best] = findPassages('Carlos Pace won the 1975 race.', docs);
  assert.equal(best.numbers_covered, true);
  assert.ok(best.names_matched.includes('Pace'));
  assert.equal(findPassages('Pace won by 12 seconds in 1975.', docs)[0].numbers_covered, false);
});

test('corner names require a stored excerpt naming the turn, within the layout period', () => {
  const text = 'Map 2025: Turn 1 Abbey, Turn 2 Farm, Turn 3 Village. Historic: Woodcote was the final corner in 1950.';
  const snap = { source_id: 'map', text, content_sha256: sha256(text) };
  const base = { layout_id: 'silverstone-8', turn: 1, name: 'Abbey', source_id: 'map', excerpt: 'Turn 1 Abbey, Turn 2 Farm', locator: 'map legend', source_period_year: 2025 };
  const seasons = [2011, 2025];
  assert.equal(acceptCornerName(base, snap, seasons).accepted, true);
  assert.ok(acceptCornerName({ ...base, name: 'Copse' }, snap, seasons).reasons.includes('name_not_in_excerpt'));
  assert.ok(acceptCornerName({ ...base, turn: 7 }, snap, seasons).reasons.includes('turn_number_not_in_excerpt'));
  assert.ok(acceptCornerName({ ...base, source_period_year: 1950 }, snap, seasons).reasons.includes('source_period_outside_layout_seasons'), 'no retro-projection');
  assert.ok(acceptCornerName({ ...base, excerpt: 'Turn 1 Abbey is famous' }, snap, seasons).reasons.includes('excerpt_not_in_source'));
  assert.ok(acceptCornerName({ ...base, name: 'Turn 1' }, snap, seasons).reasons.includes('not_a_name'));
  assert.ok(acceptCornerName(base, { ...snap, text: `${text} edited` }, seasons).reasons.includes('source_snapshot_integrity'));
});

test('source registry: normalisation and structural issues', () => {
  assert.equal(normalizeUrl('https://www.example.com/a/?utm_source=x#frag'), 'https://example.com/a');
  const registry = buildRegistry([
    { block_id: 'b1', circuit_id: 'c', en: 'In 1980 the race moved.', uk: '', cited_urls: ['https://www.formula1.com/en/results/1975/races/1/x/race-result', 'https://github.com/f1db/f1db/blob/v2025.1.0/x', 'http://example.com/y'], year_label: null },
  ], 'v2026.17.0');
  const issues = registry.flatMap(r => r.issues);
  assert.ok(issues.some(i => i.startsWith('results_year_not_in_text')));
  assert.ok(issues.includes('dataset_url_not_pinned'));
  assert.ok(issues.includes('not_https'));
});

test('quality and EN/UK signals flag shallow, generic and drifting text', () => {
  const [report] = assessCorpus([{ block_id: 'b', circuit_id: 'c', kind: 'long_history_draft', en: 'It stands as a testament to racing.', uk: 'Це свідчення гонок.', cited_urls: [], year_label: null }]);
  assert.ok(report.flags.includes('shallow:short'));
  assert.ok(report.flags.some(f => f.startsWith('generic:')));
  assert.ok(enUkConsistency('He won in 1975 and 1976.', 'Він переміг 1975 року.').some(i => i === 'number_only_in_en:1976'));
  assert.ok(enUkConsistency('Pace won.', 'Переміг Pace та Brabham.').some(i => i.startsWith('latin_only_in_uk:Brabham')));
  assert.ok(enUkConsistency('A long English sentence with many words in it for testing.', 'Short English text.').includes('uk_untranslated'));
});

test('committed evidence artifacts are reproducible from committed inputs', () => {
  execFileSync(process.execPath, ['scripts/circuit-evidence-report.mjs', '--check'], { stdio: 'pipe' });
});

test('snapshot-derived artifacts store hashes and offsets, never third-party text', () => {
  const tasks = JSON.parse(readFileSync('docs/editorial/circuit-evidence/factcheck-tasks.json', 'utf8'));
  const status = JSON.parse(readFileSync('docs/editorial/circuit-evidence/source-status.json', 'utf8'));
  for (const t of tasks) for (const p of t.passages) {
    assert.deepEqual(Object.keys(p).sort(), ['length', 'names_matched', 'numbers_covered', 'offset', 'passage_sha256', 'score', 'source_id']);
    assert.ok(status[p.source_id]?.text_sha256, `${p.source_id} has a recorded snapshot hash`);
  }
  for (const row of Object.values(status)) assert.ok(!('text' in row) && !('title' in row), 'no page text or titles');
  assert.ok(readFileSync('.gitignore', 'utf8').includes('.grid-atlas/source-snapshots/'));
});
