// Milestone B2: reviewed UK name table, entity recognition, and pilot-focused negative checks
// (wrong names, years, winners, layouts, corner attribution). Synthetic sentences; pinned F1DB export.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { F1dbIndex, acceptCornerName, checkCandidate, inflect, nameForms, ukNameMap } from '../packages/editorial-evidence/src/index.ts';
import { sha256 } from '../packages/editorial-policy/src/index.ts';

const archive = JSON.parse(readFileSync('docs/editorial/circuit-completion/archive/f1db-v2026.17.0-circuit-facts.json', 'utf8'));
const index = new F1dbIndex(archive);
const entry = (key, given, surname, surname_key, status = 'approved') => ({ key, ...Object.fromEntries(Object.entries(nameForms(given, surname)).map(([k, v]) => [k === 'full' ? 'full_forms' : 'surname_forms', v])), surname_key, review: { status } });
const approved = [
  entry('ayrton-senna', 'Айртон', 'Сенна', 'ambiguous:senna'),
  entry('nigel-mansell', 'Найджел', 'Менселл', 'nigel-mansell'),
  entry('nelson-piquet', 'Нельсон', 'Піке', 'ambiguous:piquet'),
  entry('alain-prost', 'Ален', 'Прост', 'ambiguous:prost'),
];
const indexUk = new F1dbIndex(archive, ukNameMap(approved));
const candidate = (circuit_id, en) => ({ claim_id: 't#s1', block_id: 't', circuit_id, kind: 'test', provenance: {}, en, uk: null, alignment: 'unaligned', claim_type: 'statistic', importance: 'critical', cited_urls: [] });
const kinds = (checks, status) => checks.filter(c => c.status === status).map(c => c.kind);

test('UK declension: indeclinable, a-stem, hard and soft consonant names', () => {
  assert.deepEqual(new Set(Object.values(inflect('Алонсо')).flat()), new Set(['Алонсо']));
  assert.deepEqual(new Set(Object.values(inflect('Піке')).flat()), new Set(['Піке']));
  assert.deepEqual(inflect('Сенна').gen, ['Сенни']);
  assert.deepEqual(inflect('Сенна').ins, ['Сенною']);
  assert.deepEqual(inflect('Менселл').gen, ['Менселла']);
  assert.deepEqual(inflect('Менселл').ins, ['Менселлом']);
  assert.deepEqual(inflect('Жиль').gen, ['Жиля']);
  // Independent review findings (2026-11-17): locative after к/г/х, -й stems, a-stem alternation.
  assert.deepEqual(inflect('Кларк').loc, ['Кларкові', 'Кларку']);
  assert.ok(!Object.values(inflect('Джек')).flat().includes('Джекі'), 'Jack must never yield Jackie (Джекі)');
  assert.deepEqual(inflect('Клей').ins, ['Клеєм']);
  assert.deepEqual(inflect('Міка').loc, ['Міці']);
  const forms = nameForms("Жан-П'єр", "Жар'є");
  assert.ok(forms.full.includes("Жан-П'єра Жар'є"), 'hyphenated given name declines its last element');
});

test('UK name map loads only independently approved entries', () => {
  const map = ukNameMap([...approved, entry('jim-clark', 'Джим', 'Кларк', 'jim-clark', 'pending'), entry('john-surtees', 'Джон', 'Сертіс', 'john-surtees', 'changes_required')]);
  assert.equal(map.get('Айртона Сенни'), 'ayrton-senna');
  assert.equal(map.has('Джим Кларк'), false, 'pending entries are not recognised');
  assert.equal(map.has('Сертіс'), false, 'entries needing changes are not recognised');
  const shared = ukNameMap([entry('jochen-mass', 'Йохен', 'Масс', 'jochen-mass'), entry('felipe-massa', 'Феліпе', 'Масса', 'felipe-massa')]);
  assert.equal(shared.get('Масса'), 'ambiguous:uk:масса', 'a bare form shared by two surnames is ambiguous');
  assert.equal(shared.get('Феліпе Масса'), 'felipe-massa');
  assert.equal(shared.get('Йохена Масса'), 'jochen-mass');
});

test('committed name table: approvals bind the reviewed forms; only approved entries are loaded', () => {
  const table = JSON.parse(readFileSync('docs/editorial/names/uk-name-table.json', 'utf8'));
  const review = JSON.parse(readFileSync('docs/editorial/names/uk-name-review.json', 'utf8'));
  for (const e of table.entries) {
    if (e.review.status === 'approved') assert.equal(review.entries[e.key].forms_sha256, e.forms_sha256, e.key);
  }
  const map = ukNameMap(table.entries);
  const loaded = new Set(map.values());
  for (const e of table.entries.filter(x => x.review.status !== 'approved')) assert.ok(!loaded.has(e.key), `${e.key} must not be recognised`);
});

test('UK recognition: full names win over the bare surname inside them; bare shared surnames stay ambiguous', () => {
  assert.deepEqual(indexUk.entities('Перемогу здобув Айртон Сенна.', 'uk'), ['ayrton-senna']);
  assert.deepEqual(indexUk.entities('Для Айртона Сенни це була перша перемога.', 'uk'), ['ayrton-senna']);
  assert.deepEqual(indexUk.entities('Сенну обійшов Менселл.', 'uk').sort(), ['ambiguous:senna', 'nigel-mansell']);
  assert.deepEqual(index.entities('Перемогу здобув Айртон Сенна.', 'uk'), [], 'without a table Cyrillic names are not recognised (fail closed)');
});

test('wrong name across languages: EN and UK name different drivers', () => {
  const en = indexUk.entities('Nigel Mansell won the 1985 European Grand Prix.', 'en');
  const uk = indexUk.entities('Європейське Гран-прі 1985 року виграв Нельсон Піке.', 'uk');
  assert.deepEqual(en, ['nigel-mansell']);
  assert.deepEqual(uk, ['nelson-piquet']);
  assert.notDeepEqual(en, uk);
});

test('English recognition: sentence-initial common words and team-name surnames', () => {
  assert.equal(index.entities('Speed in the royal park was never the point.').some(k => k.includes('speed')), false);
  assert.ok(index.entities('Scott Speed retired early.').includes('scott-speed'));
  assert.ok(index.entities('Williams won again.').includes('ambiguous:williams'), 'bare Williams is the team or a driver');
  assert.ok(index.entities('Jonathan Williams started the race.').includes('jonathan-williams'));
});

test('wrong winner and wrong year at pilot circuits are flagged', () => {
  assert.ok(kinds(checkCandidate(candidate('monaco', 'Ayrton Senna won the 1988 Monaco Grand Prix.'), index), 'conflict').includes('race_winner'), 'Prost won Monaco 1988');
  assert.ok(kinds(checkCandidate(candidate('interlagos', 'Carlos Pace won the 1976 Brazilian Grand Prix.'), index), 'conflict').includes('race_winner'));
  assert.ok(kinds(checkCandidate(candidate('interlagos', 'The Brazilian Grand Prix was held at Interlagos in 1985.'), index), 'unmatched').includes('race_year'), 'no Interlagos race in 1985');
  assert.deepEqual(kinds(checkCandidate(candidate('monaco', 'Alain Prost won the 1988 Monaco Grand Prix.'), index), 'conflict'), []);
});

test('layout facts: turn counts and lengths must match an F1DB layout', () => {
  assert.ok(kinds(checkCandidate(candidate('lusail', 'The lap has 16 turns.'), index), 'supported').includes('turn_count'));
  assert.ok(kinds(checkCandidate(candidate('lusail', 'The lap has 18 turns.'), index), 'unmatched').includes('turn_count'));
  assert.ok(kinds(checkCandidate(candidate('lusail', 'The lap measures 5.419 km.'), index), 'supported').includes('layout_length'));
  assert.ok(kinds(checkCandidate(candidate('interlagos', 'The lap measured 7.960 km.'), index), 'unmatched').includes('layout_length'));
});

test('corner attribution: modern names are not projected onto older pilot layouts', () => {
  const text = 'Circuit map 2025: Turn 1 Sainte Devote, Turn 10 Nouvelle Chicane. Turn 3 Massenet.';
  const snap = { source_id: 'map', text, content_sha256: sha256(text) };
  const base = { layout_id: 'monaco-6', turn: 1, name: 'Sainte Devote', source_id: 'map', excerpt: 'Turn 1 Sainte Devote', locator: 'legend', source_period_year: 2025 };
  const monaco6 = archive.circuits.find(c => c.circuit_id === 'monaco').layouts.find(l => l.layout_id === 'monaco-6').seasons;
  const monaco2 = archive.circuits.find(c => c.circuit_id === 'monaco').layouts.find(l => l.layout_id === 'monaco-2').seasons;
  assert.equal(acceptCornerName(base, snap, monaco6).accepted, true);
  assert.ok(acceptCornerName({ ...base, layout_id: 'monaco-2' }, snap, monaco2).reasons.includes('source_period_outside_layout_seasons'));
  assert.ok(acceptCornerName({ ...base, turn: 3 }, snap, monaco6).reasons.includes('turn_number_not_in_excerpt'));
  assert.ok(acceptCornerName({ ...base, turn: 3, name: 'Massenet', excerpt: 'Turn 1 Sainte Devote' }, snap, monaco6).reasons.includes('name_not_in_excerpt'));
});

test('UK name table is reproducible from its reviewed base', () => {
  execFileSync(process.execPath, ['scripts/build-uk-name-table.mjs', '--check'], { stdio: 'pipe' });
});
