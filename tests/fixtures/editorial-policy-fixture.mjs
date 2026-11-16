import { claimDigest, containsPhrase, evaluatePublication, itemDigest, sha256 } from '../../packages/editorial-policy/src/index.ts';

// Synthetic fixture: clearly fictional source text, never imported into the archive.
export const PINNED = 'v2026.17.0';
export const writer = { id: 'writer-agent', role: 'writer', run_id: 'run-w1', model: 'model-a' };
export const checker = { id: 'factcheck-agent', role: 'fact_check', run_id: 'run-f1', model: 'model-b' };
export const editor = { id: 'editor-agent', role: 'editorial_review', run_id: 'run-e1' };
export const localizer = { id: 'localizer-agent', role: 'localization', run_id: 'run-l1' };
export const researcher = { id: 'research-agent', role: 'research', run_id: 'run-r1' };

export const snapshot = (source_id, url, publisher, text) => ({
  source_id, url, title: `Fixture ${source_id}`, publisher, kind: 'publication', published_on: '1990-01-01',
  retrieved_at: '2026-11-16T00:00:00Z', retrieved_by: researcher, content_sha256: sha256(text), text,
});
export const SOURCE_A = 'The circuit hosted its first championship race in 1961 after the original road course was shortened to 4.2 kilometres.';
export const SOURCE_B = 'Organisers shortened the road course before the 1961 race, leaving a lap of 4.2 kilometres.';
export const LICENSE_PAGE = 'This file is licensed under the Creative Commons Attribution 4.0 International license. Identifier: CC-BY-4.0.';

const RACE_SCOPE = ['race:1961-fixture', 'circuit:fixture-ring', 'season:1961'];
const OTHER_SCOPE = ['race:1962-elsewhere', 'circuit:other-ring', 'season:1962'];
const dataset = new Map([
  [`f1db|${PINNED}|race:1961-fixture|winner`, { value: 'fixture-driver', mentions: ['Fixture Driver'], scope: RACE_SCOPE }],
  [`f1db|${PINNED}|race:1961-fixture|season`, { value: 1961, mentions: [], scope: RACE_SCOPE }],
  [`f1db|${PINNED}|race:1963-fixture|season`, { value: 1963, mentions: [], scope: ['race:1963-fixture', 'circuit:fixture-ring', 'season:1963'] }],
  [`f1db|${PINNED}|race:1962-elsewhere|winner`, { value: 'fixture-driver', mentions: ['Fixture Driver'], scope: OTHER_SCOPE }],
  [`f1db|${PINNED}|race:1962-elsewhere|season`, { value: 1962, mentions: [], scope: OTHER_SCOPE }],
]);
export const lookup = ref => dataset.get(`${ref.dataset}|${ref.release}|${ref.record}|${ref.field}`);
export const datasetVerifier = { id: 'f1db-verifier', role: 'automated_verifier', run_id: 'run-v1', version: '1' };

/** Records a verification bound to the claim and the snapshots it cites in `item`. */
export function verify(item, claim, by = checker, method = 'source_excerpt_match') {
  claim.verification = { status: 'verified', method, verifier: by, verified_at: '2026-11-16T01:00:00Z', claim_sha256: claimDigest(claim, item.sources) };
  return claim;
}

export function validItem() {
  const history = {
    claim_id: 'c-history', entity: { type: 'circuit', id: 'fixture-ring' }, claim_type: 'historical_event', importance: 'critical',
    statement: { en: 'The road course was shortened to 4.2 kilometres before the first championship race in 1961.', uk: 'Перед першою заліковою гонкою 1961 року дорожню трасу скоротили до 4.2 кілометра.' },
    presentation: 'asserted',
    evidence: [
      { source_id: 's-a', excerpt: 'original road course was shortened to 4.2 kilometres', locator: 'para 1' },
      { source_id: 's-b', excerpt: 'shortened the road course before the 1961 race', locator: 'para 1' },
    ],
    verification: null,
  };
  history.evidence.push({ source_id: 's-a', excerpt: 'first championship race in 1961', locator: 'para 1' });
  const winner = {
    claim_id: 'c-winner', entity: { type: 'race', id: '1961-fixture' }, claim_type: 'structured_statistic', importance: 'critical',
    statement: { en: 'Fixture Driver won the 1961 race.', uk: 'Перегони 1961 року виграв Fixture Driver.' }, value: 'Fixture Driver', presentation: 'asserted',
    evidence: [
      { dataset_ref: { dataset: 'f1db', release: PINNED, record: 'race:1961-fixture', field: 'winner' }, value: 'fixture-driver' },
      { dataset_ref: { dataset: 'f1db', release: PINNED, record: 'race:1961-fixture', field: 'season' }, value: 1961 },
    ],
    verification: null,
  };
  const item = {
    item_id: 'circuit:fixture-ring:history', entity: { type: 'circuit', id: 'fixture-ring' }, dataset_release: PINNED,
    blocks: [{
      block_id: 'b-origins', kind: 'history',
      body: {
        en: 'Before the first championship race in 1961 the organisers cut the road course down to 4.2 kilometres. Fixture Driver won that first race.',
        uk: 'Перед першою заліковою гонкою 1961 року організатори скоротили дорожню трасу до 4.2 кілометра. Fixture Driver виграв ту першу гонку.',
      },
      claim_ids: ['c-history', 'c-winner'], links: ['/races/1'],
    }],
    claims: [history, winner],
    sources: [
      snapshot('s-a', 'https://archive.example.org/fixture-a', 'Fixture Archive', SOURCE_A),
      snapshot('s-b', 'https://history.example.net/fixture-b', 'Fixture Historian', SOURCE_B),
      snapshot('s-license', 'https://commons.example.org/file-page', 'Fixture Commons', LICENSE_PAGE),
    ],
    media: [{
      asset_id: 'm-photo', kind: 'photograph', required: false, source_url: 'https://commons.example.org/file-page', creator: 'Fixture Photographer',
      license: { identifier: 'CC-BY-4.0', url: 'https://creativecommons.org/licenses/by/4.0/', evidence_source_id: 's-license' },
      attribution: 'Fixture Photographer, CC BY 4.0', modifications: null, restrictions: [], file_sha256: 'a'.repeat(64),
    }],
    authorship: { writer, fact_checker: checker, localizer },
    editorial_review: null,
  };
  verify(item, history);
  verify(item, winner, datasetVerifier, 'dataset_comparison');
  return seal(item);
}

/** Re-bind review and receipt to the current content, as the pipeline would after a revision. */
export function seal(item) {
  item.editorial_review = { reviewer: editor, item_sha256: itemDigest(item), passed: true, findings: [] };
  return item;
}

/** Trusted bilingual name table, as the publisher would build from F1DB plus a reviewed UK glossary. */
const NAMES = [['fixture-driver', ['Fixture Driver']], ['ayrton-senna', ['Ayrton Senna', 'Senna', 'Айртон Сенна', 'Сенна']]];
export const entities = text => NAMES.filter(([, forms]) => forms.some(form => containsPhrase(text, form))).map(([key]) => key);

/**
 * Trusted canonical renderer: winner + season of one race → one fixed sentence per language.
 * Any other combination of evidence has no canonical wording (null).
 */
export const renderStructured = (evidence, locale) => {
  const fields = Object.fromEntries(evidence.map(e => [e.dataset_ref.field, e]));
  if (evidence.length !== 2 || !fields.winner || !fields.season || fields.winner.dataset_ref.record !== fields.season.dataset_ref.record) return null;
  const winner = lookup(fields.winner.dataset_ref), season = lookup(fields.season.dataset_ref);
  if (!winner || !season) return null;
  const name = winner.mentions[0];
  return locale === 'en' ? `${name} won the ${season.value} race.` : `Перегони ${season.value} року виграв ${name}.`;
};

export const context = (item, overrides = {}) => ({
  pinned_dataset_release: PINNED, dataset: lookup, entities, renderStructured, known_routes: new Set(['/races/1']), corpus: [],
  license_allowlist: ['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'PUBLIC-DOMAIN'],
  technical_receipt: { item_sha256: itemDigest(item), build: 'passed', tests: 'passed', rendered_locales: ['en', 'uk'], seo_metadata: true, commit_sha: 'f'.repeat(40) },
  evaluated_at: '2026-11-16T02:00:00Z', ...overrides,
});

export const codes = decision => decision.gates.flatMap(gate => gate.findings.map(finding => finding.code));
export const run = (item, overrides) => evaluatePublication(item, context(item, overrides));
