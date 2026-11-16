import { claimDigest, itemDigest, sha256 } from './canonical.ts';
import type {
  AgentRef, Claim, ContentItem, Finding, GateName, GateResult, GateStatus, Locale, MediaUse,
  PolicyContext, SourceEvidence, SourceSnapshot,
} from './model.ts';
import {
  boilerplateHits, containsPhrase, cyrillicShare, hasNonAsciiDigits, hasPlaceholder, looksLikeInstruction, numberTokens,
  paragraphs, registrableDomain, significantNumbers, similarity,
} from './text.ts';

const LOCALES: Locale[] = ['en', 'uk'];
/** Claim types for which agreement with the pinned dataset is sufficient evidence on its own. */
const STRUCTURED_CLAIMS = new Set(['structured_statistic', 'date', 'layout_fact']);
const MIN_EXCERPT = 20;
const DUPLICATE_THRESHOLD = 0.6;

const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isHttps = (value: unknown) => {
  if (!nonEmpty(value)) return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};
const isSourceEvidence = (e: object): e is SourceEvidence => 'source_id' in e;
const publisherKey = (source: SourceSnapshot) => {
  try { return registrableDomain(new URL(source.url).hostname); } catch { return source.publisher.trim().toLowerCase(); }
};
const time = (value: string | null | undefined) => (value ? Date.parse(value) : Number.NaN);
// Format characters (zero-width space/joiner, BOM…) cannot make two ids distinct.
const actorKey = (value: unknown) => String(value ?? '').normalize('NFKC').replace(/\p{Cf}/gu, '').trim().toLowerCase();
/** Two agent records are the same actor if either the identity or the execution matches (case/space-insensitive). */
export const sameActor = (a: AgentRef | null, b: AgentRef | null) =>
  Boolean(a && b && (actorKey(a.id) === actorKey(b.id) || actorKey(a.run_id) === actorKey(b.run_id)));

function result(gate: GateName, findings: Finding[], warnings: Finding[] = [], whenFailing: GateStatus = 'fail'): GateResult {
  return { gate, status: findings.length ? whenFailing : 'pass', findings, warnings };
}

/** Structural validity and reference resolution. */
export function schemaGate(item: ContentItem): GateResult {
  const f: Finding[] = [];
  const add = (code: string, target: string, message: string) => f.push({ code, target, message });
  if (!nonEmpty(item.item_id)) add('item_id_missing', 'item', 'Item needs a stable identifier.');
  if (!item.blocks?.length) add('no_blocks', 'item', 'Item has no content blocks.');
  const claimIds = new Set<string>();
  for (const claim of item.claims ?? []) {
    if (!nonEmpty(claim.claim_id)) add('claim_id_missing', 'claim', 'Claim needs a stable identifier.');
    else if (claimIds.has(claim.claim_id)) add('claim_id_duplicate', claim.claim_id, 'Claim identifier is not unique.');
    claimIds.add(claim.claim_id);
  }
  const blockIds = new Set<string>();
  for (const block of item.blocks ?? []) {
    if (blockIds.has(block.block_id)) add('block_id_duplicate', block.block_id, 'Block identifier is not unique.');
    blockIds.add(block.block_id);
    for (const id of block.claim_ids) if (!claimIds.has(id)) add('claim_reference_unresolved', `${block.block_id}->${id}`, 'Block cites a claim that does not exist.');
  }
  const sourceIds = new Set<string>();
  for (const source of item.sources ?? []) {
    if (sourceIds.has(source.source_id)) add('source_id_duplicate', source.source_id, 'Source identifier is not unique.');
    sourceIds.add(source.source_id);
  }
  const assetIds = new Set<string>();
  for (const asset of item.media ?? []) {
    if (assetIds.has(asset.asset_id)) add('asset_id_duplicate', asset.asset_id, 'Asset identifier is not unique.');
    assetIds.add(asset.asset_id);
  }
  return result('schema', f);
}

/**
 * Integrity of stored source snapshots. Instruction-like text is surfaced, never obeyed.
 * The writer may not capture the sources it cites: otherwise it could write the evidence too.
 */
export function sourceGate(item: ContentItem): GateResult {
  const f: Finding[] = [], w: Finding[] = [];
  for (const source of item.sources) {
    if (sameActor(source.retrieved_by ?? null, item.authorship.writer))
      f.push({ code: 'source_captured_by_writer', target: source.source_id, message: 'Sources must be captured by a research/retrieval actor, not the writer.' });
    if (!isHttps(source.url)) f.push({ code: 'source_url_invalid', target: source.source_id, message: 'Source URL must be an absolute https URL.' });
    if (!nonEmpty(source.title) || !nonEmpty(source.publisher)) f.push({ code: 'source_metadata_missing', target: source.source_id, message: 'Source title and publisher are required.' });
    if (!nonEmpty(source.text) || sha256(source.text) !== source.content_sha256)
      f.push({ code: 'source_snapshot_integrity', target: source.source_id, message: 'Stored snapshot is missing or does not match its recorded hash.' });
    if (!nonEmpty(source.retrieved_at) || !source.retrieved_by?.id) f.push({ code: 'source_retrieval_unrecorded', target: source.source_id, message: 'Retrieval time and agent must be recorded.' });
    if (looksLikeInstruction(source.text ?? '')) w.push({ code: 'source_contains_instructions', target: source.source_id, message: 'Source text contains instruction-like content; treated as inert data.' });
  }
  return result('source', f, w);
}

type ClaimCheck = { failures: Finding[]; unverifiable: Finding[] };

/** Returns a description when EN and UK name different archive entities, otherwise null. */
function entitySetsDiffer(ctx: PolicyContext, en: string, uk: string): string | null {
  const a = new Set(ctx.entities(en, 'en')), b = new Set(ctx.entities(uk, 'uk'));
  const onlyEn = [...a].filter(k => !b.has(k)), onlyUk = [...b].filter(k => !a.has(k));
  return onlyEn.length || onlyUk.length ? `only EN: [${onlyEn.join(', ')}]; only UK: [${onlyUk.join(', ')}]` : null;
}

/** Checks one claim's evidence deterministically. Never trusts the verification label alone. */
export function checkClaim(claim: Claim, item: ContentItem, ctx: PolicyContext): ClaimCheck {
  const failures: Finding[] = [], unverifiable: Finding[] = [];
  const fail = (code: string, message: string) => failures.push({ code, target: claim.claim_id, message });
  const quarantine = (code: string, message: string) => unverifiable.push({ code, target: claim.claim_id, message });
  const sources = new Map(item.sources.map(source => [source.source_id, source]));

  for (const locale of LOCALES) if (!nonEmpty(claim.statement?.[locale])) fail('claim_statement_missing', `Claim statement missing in ${locale}.`);

  const supportingText: string[] = [];
  const publishers = new Set<string>();
  const citedSources: SourceSnapshot[] = [];
  let datasetSupport = 0, datasetCorroboration = 0;
  const races = new Set<string>();
  for (const evidence of claim.evidence ?? []) {
    if (isSourceEvidence(evidence)) {
      const source = sources.get(evidence.source_id);
      if (!source) { fail('citation_unregistered', `Cites unregistered source "${evidence.source_id}" (no stored snapshot).`); continue; }
      if (!nonEmpty(source.text) || sha256(source.text) !== source.content_sha256) { fail('citation_snapshot_invalid', 'Cited snapshot fails integrity.'); continue; }
      if (!nonEmpty(evidence.excerpt) || evidence.excerpt.trim().length < MIN_EXCERPT) { fail('excerpt_too_short', 'Evidence excerpt is missing or too short to support a claim.'); continue; }
      if (!containsPhrase(source.text, evidence.excerpt)) { fail('excerpt_not_in_source', `Excerpt does not occur (on word boundaries) in the stored copy of ${source.source_id}.`); continue; }
      if (!nonEmpty(evidence.locator)) fail('locator_missing', 'Evidence needs a precise locator.');
      supportingText.push(evidence.excerpt);
      publishers.add(publisherKey(source));
      citedSources.push(source);
    } else {
      const ref = evidence.dataset_ref;
      if (!ref || typeof ref !== 'object') throw new TypeError(`claim ${claim.claim_id}: evidence is neither a source excerpt nor a dataset reference`);
      if (ref.release !== ctx.pinned_dataset_release) { fail('dataset_release_outdated', `References ${ref.dataset} ${ref.release}; pinned release is ${ctx.pinned_dataset_release}.`); continue; }
      const found = ctx.dataset(ref);
      if (found === undefined || found === null) { fail('dataset_record_missing', `No ${ref.record}.${ref.field} in the pinned dataset.`); continue; }
      const actual = typeof found === 'object' ? found.value : found;
      const mentions = typeof found === 'object' ? found.mentions : [];
      // A scoped record (e.g. a race belongs to one circuit and one season) may only back claims about that scope.
      // Unscoped values fail closed: without a scope nothing ties the record to the claim's subject.
      const scope = typeof found === 'object' ? found.scope : undefined;
      if (!scope?.length) { fail('dataset_record_unscoped', `${ref.record}.${ref.field} carries no scope.`); continue; }
      if (!scope.includes(`${claim.entity?.type}:${claim.entity?.id}`))
        { fail('dataset_record_out_of_scope', `${ref.record} belongs to ${scope.join(', ')}, not ${claim.entity?.type}:${claim.entity?.id}.`); continue; }
      // A record scoped to a season backs only a sentence that states that season.
      const seasons = scope.filter(s => s.startsWith('season:')).map(s => s.slice(7));
      if (seasons.length && !seasons.some(year => numberTokens(claim.statement?.en ?? '').includes(year)))
        { fail('dataset_season_not_stated', `${ref.record} is from ${seasons.join('/')}, which the statement does not state.`); continue; }
      const [recordKind] = ref.record.split(':');
      if (recordKind === 'race') races.add(ref.record);
      if (evidence.value === undefined || evidence.value === null || String(evidence.value).trim() === '')
        { fail('dataset_value_missing', 'Dataset evidence must state the value it relies on.'); continue; }
      if (String(evidence.value).trim() !== String(actual).trim())
        { fail('dataset_value_mismatch', `Evidence value "${evidence.value}" differs from dataset value "${actual}".`); continue; }
      // The record must be about what the sentence says: its value (or a dataset-supplied name for it) is stated.
      if (![String(actual), ...mentions].some(form => containsPhrase(claim.statement?.en ?? '', form)))
        { fail('dataset_value_not_stated', `Statement does not state ${ref.record}.${ref.field} ("${actual}").`); continue; }
      supportingText.push(String(actual), ...mentions);
      // Dataset agreement suffices only for structured claims; narrative claims still need sources.
      if (STRUCTURED_CLAIMS.has(claim.claim_type)) datasetSupport++; else datasetCorroboration++;
    }
  }

  // One race per claim: a winner from one race and a year from another cannot be combined.
  if (races.size > 1) fail('dataset_records_inconsistent', `Claim combines records of ${races.size} races (${[...races].join(', ')}); split it.`);

  // Every numeral the claim states, in either language, must be visible in its supporting evidence.
  const supported = new Set(supportingText.flatMap(numberTokens));
  for (const locale of LOCALES) for (const n of new Set(numberTokens(claim.statement?.[locale] ?? '')))
    if (!supported.has(n)) fail('claim_number_unsupported', `"${n}" (${locale}) does not appear in any supporting evidence.`);

  // Every archive entity the claim names, in either language, must be named by its evidence.
  const backedEntities = new Set(supportingText.flatMap(text => [...ctx.entities(text, 'en'), ...ctx.entities(text, 'uk')]));
  for (const locale of LOCALES) for (const key of new Set(ctx.entities(claim.statement?.[locale] ?? '', locale)))
    if (!backedEntities.has(key)) fail('claim_entity_unsupported', `"${key}" (${locale}) is not named by any supporting evidence.`);
  // Both languages must name the same entities. A recogniser that cannot read one language
  // (e.g. no reviewed Ukrainian name table) therefore fails closed for any claim naming someone.
  const differ = entitySetsDiffer(ctx, claim.statement?.en ?? '', claim.statement?.uk ?? '');
  if (differ) fail('claim_entities_differ_across_locales', differ);

  if (claim.claim_type === 'quotation') {
    const quoted = (claim.statement?.en ?? '').match(/"([^"]{8,})"|“([^”]{8,})”/);
    const text = quoted?.[1] ?? quoted?.[2];
    if (!text || !supportingText.some(s => containsPhrase(s, text)))
      fail('quotation_unsupported', 'Quoted words must appear verbatim in a cited excerpt.');
  }

  const sufficient = claim.importance === 'critical' ? datasetSupport > 0 || publishers.size >= 2 : datasetSupport > 0 || publishers.size >= 1;
  const v = claim.verification;
  // Verified and disputed outcomes are both publishable states, so both need a complete,
  // current, chronologically possible verification record.
  const requireRecord = () => {
    if (!v || v.method === 'none' || !v.verifier || !nonEmpty(v.verified_at) || Number.isNaN(time(v.verified_at)))
      { fail('verification_incomplete', 'Verification needs a method, verifier and valid timestamp.'); return; }
    if (v.claim_sha256 !== claimDigest(claim, item.sources)) fail('verification_stale', 'Claim or a cited snapshot changed after it was verified.');
    if (!(time(v.verified_at) <= time(ctx.evaluated_at))) fail('verified_in_future', 'Verification is dated after this evaluation.');
    for (const source of citedSources) if (!(time(source.retrieved_at) <= time(v.verified_at)))
      fail('verified_before_retrieval', `Verification predates retrieval of ${source.source_id}.`);
  };
  switch (v?.status) {
    case 'verified':
      if (!sufficient) quarantine('evidence_insufficient', claim.importance === 'critical'
        ? 'Critical claim needs a dataset record or two independent publishers.' : 'Claim needs at least one valid piece of evidence.');
      requireRecord();
      if (v.method === 'dataset_comparison' && !datasetSupport) fail('verification_method_mismatch', 'Dataset comparison claimed without a dataset reference.');
      break;
    case 'disputed':
      if (claim.presentation !== 'conflict_disclosed' || publishers.size + datasetSupport + datasetCorroboration < 2)
        quarantine('dispute_undisclosed', 'Disputed claims publish only as a disclosed conflict backed by two positions.');
      else requireRecord();
      break;
    case 'insufficient_evidence': quarantine('evidence_insufficient', 'Verifier found insufficient evidence.'); break;
    case 'stale': fail('verification_stale', 'Verification is stale; re-verify.'); break;
    case 'rejected': fail('claim_rejected', 'Rejected claims must be removed from the text.'); break;
    default: fail('verification_missing', 'Claim has not been independently verified.');
  }
  return { failures, unverifiable };
}

/** All cited claims verified; every number in the prose is backed by a cited claim. */
export function factualGate(item: ContentItem, ctx: PolicyContext): GateResult & { quarantined: string[] } {
  const f: Finding[] = [], u: Finding[] = [];
  const claims = new Map(item.claims.map(claim => [claim.claim_id, claim]));
  const cited = new Set(item.blocks.flatMap(block => block.claim_ids));
  if (item.dataset_release !== ctx.pinned_dataset_release)
    f.push({ code: 'item_dataset_release_mismatch', target: 'item', message: `Item targets ${item.dataset_release}; pinned release is ${ctx.pinned_dataset_release}.` });
  for (const id of cited) {
    const claim = claims.get(id);
    if (!claim) continue; // schema gate reports it
    const check = checkClaim(claim, item, ctx);
    f.push(...check.failures); u.push(...check.unverifiable);
  }
  for (const block of item.blocks) {
    // Every published block is factual prose in this archive: it must rest on at least one claim.
    if (!block.claim_ids.length) f.push({ code: 'uncited_block', target: block.block_id, message: 'Block cites no claims.' });
    const backing = new Set(block.claim_ids.flatMap(id => {
      const claim = claims.get(id);
      // Only statement numbers are backing: they are the ones checkClaim proves against evidence.
      return claim ? [...numberTokens(claim.statement.en), ...numberTokens(claim.statement.uk)] : [];
    }));
    for (const locale of LOCALES) for (const n of new Set(numberTokens(block.body?.[locale] ?? ''))) if (!backing.has(n))
      f.push({ code: 'block_number_unclaimed', target: `${block.block_id}.${locale}`, message: `"${n}" in the text is not backed by any cited claim.` });
    // Names in prose must be named by a cited claim, so "X won" cannot ride on a claim about Y.
    const named = new Set(block.claim_ids.flatMap(id => {
      const claim = claims.get(id);
      return claim ? [...ctx.entities(claim.statement.en, 'en'), ...ctx.entities(claim.statement.uk, 'uk')] : [];
    }));
    for (const locale of LOCALES) for (const key of new Set(ctx.entities(block.body?.[locale] ?? '', locale))) if (!named.has(key))
      f.push({ code: 'block_entity_unclaimed', target: `${block.block_id}.${locale}`, message: `"${key}" in the text is not named by any cited claim.` });
    const differ = entitySetsDiffer(ctx, block.body?.en ?? '', block.body?.uk ?? '');
    if (differ) f.push({ code: 'block_entities_differ_across_locales', target: block.block_id, message: differ });
  }
  const quarantined = [...new Set(u.map(finding => finding.target))];
  const status: GateStatus = f.length ? 'fail' : u.length ? 'unverifiable' : 'pass';
  return { gate: 'factual', status, findings: [...f, ...u], warnings: [], quarantined };
}

/** The verifier, editorial reviewer and localizer must be different actors from the writer. */
export function independenceGate(item: ContentItem): GateResult {
  const f: Finding[] = [];
  const { writer, fact_checker, localizer } = item.authorship;
  const verifierRoles = new Set(['fact_check', 'automated_verifier', 'human']);
  const role = (actor: AgentRef | null, allowed: string[], code: string, label: string) => {
    if (actor && !allowed.includes(actor.role)) f.push({ code, target: 'item', message: `${label} has role "${actor.role}".` });
  };
  if (!fact_checker) f.push({ code: 'fact_checker_missing', target: 'item', message: 'No independent fact-checker recorded.' });
  else if (sameActor(writer, fact_checker)) f.push({ code: 'self_fact_check', target: 'item', message: 'Writer and fact-checker are the same actor or run.' });
  role(fact_checker, ['fact_check', 'human'], 'fact_checker_role_invalid', 'Fact-checker');
  role(localizer, ['localization', 'human'], 'localizer_role_invalid', 'Localizer');
  role(item.editorial_review?.reviewer ?? null, ['editorial_review', 'human'], 'reviewer_role_invalid', 'Editorial reviewer');
  for (const claim of item.claims) {
    const verifier = claim.verification?.verifier ?? null;
    if ((claim.verification?.status === 'verified' || claim.verification?.status === 'disputed') && verifier) {
      if (sameActor(writer, verifier)) f.push({ code: 'self_verification', target: claim.claim_id, message: 'Claim verified by its writer.' });
      if (!verifierRoles.has(verifier.role)) f.push({ code: 'verifier_role_invalid', target: claim.claim_id, message: `Role "${verifier.role}" cannot verify claims.` });
      // Only an automated verifier may skip the recorded fact-checker, and only for dataset comparison.
      // Every source-based verdict (whatever role it declares) must come from the item's recorded fact-checker.
      const automatedDataset = verifier.role === 'automated_verifier' && claim.verification.method === 'dataset_comparison';
      if (!automatedDataset && !sameActor(verifier, fact_checker))
        f.push({ code: 'verifier_not_recorded_fact_checker', target: claim.claim_id, message: 'Source-based verification must come from the recorded fact-checker.' });
      if (sameActor(verifier, localizer)) f.push({ code: 'localizer_verified_claim', target: claim.claim_id, message: 'The localizer cannot verify claims.' });
    }
  }
  const review = item.editorial_review;
  if (review && sameActor(writer, review.reviewer)) f.push({ code: 'self_editorial_review', target: 'item', message: 'Writer reviewed their own text.' });
  if (localizer && sameActor(localizer, fact_checker)) f.push({ code: 'localizer_is_fact_checker', target: 'item', message: 'Localization and fact-check must be separate runs.' });
  if (localizer && sameActor(localizer, writer)) f.push({ code: 'self_localization', target: 'item', message: 'The writer cannot validate its own translation.' });
  return result('independence', f);
}

/** No placeholders, boilerplate, duplicates or broken links; a current editorial review passed. */
export function editorialGate(item: ContentItem, ctx: PolicyContext): GateResult {
  const f: Finding[] = [];
  const digest = itemDigest(item);
  for (const block of item.blocks) {
    for (const locale of LOCALES) {
      const text = block.body?.[locale] ?? '';
      if (!nonEmpty(text)) continue; // localization gate reports it
      if (hasPlaceholder(text)) f.push({ code: 'placeholder', target: `${block.block_id}.${locale}`, message: 'Unfinished or placeholder text.' });
      if (hasNonAsciiDigits(text)) f.push({ code: 'non_ascii_digits', target: `${block.block_id}.${locale}`, message: 'Digits outside 0–9 cannot be checked against evidence.' });
      const hits = boilerplateHits(text, locale);
      if (hits.length >= 2) f.push({ code: 'boilerplate', target: `${block.block_id}.${locale}`, message: `Generic phrasing: ${hits.join(', ')}.` });
    }
    for (const link of block.links) if (!ctx.known_routes.has(link)) f.push({ code: 'broken_internal_link', target: block.block_id, message: `Unknown archive route ${link}.` });
  }
  for (const claim of item.claims) for (const locale of LOCALES) {
    const text = claim.statement?.[locale] ?? '';
    if (hasPlaceholder(text)) f.push({ code: 'placeholder', target: `${claim.claim_id}.${locale}`, message: 'Unfinished or placeholder claim text.' });
    if (hasNonAsciiDigits(text)) f.push({ code: 'non_ascii_digits', target: `${claim.claim_id}.${locale}`, message: 'Digits outside 0–9 cannot be checked against evidence.' });
  }
  const own = item.blocks.map(block => ({ id: block.block_id, text: block.body?.en ?? '' }));
  for (let i = 0; i < own.length; i++) {
    for (let j = i + 1; j < own.length; j++) if (similarity(own[i].text, own[j].text) >= DUPLICATE_THRESHOLD)
      f.push({ code: 'duplicate_block', target: `${own[i].id}~${own[j].id}`, message: 'Blocks are near-identical.' });
    for (const other of ctx.corpus) if (other.item_id !== item.item_id && similarity(own[i].text, other.text) >= DUPLICATE_THRESHOLD)
      f.push({ code: 'duplicate_of_existing', target: `${own[i].id}~${other.item_id}`, message: 'Near-identical to existing content.' });
  }
  const review = item.editorial_review;
  if (!review) f.push({ code: 'editorial_review_missing', target: 'item', message: 'No editorial review recorded.' });
  else if (review.item_sha256 !== digest) f.push({ code: 'editorial_review_stale', target: 'item', message: 'Content changed after editorial review.' });
  else if (!review.passed) f.push({ code: 'editorial_review_failed', target: 'item', message: review.findings.join('; ') || 'Editorial review did not pass.' });
  return result('editorial', f);
}

/** Both locales complete and structurally equivalent; numbers agree across languages. */
export function localizationGate(item: ContentItem): GateResult {
  const f: Finding[] = [];
  if (!item.authorship.localizer) f.push({ code: 'localizer_missing', target: 'item', message: 'No localization agent recorded.' });
  const pairs: { target: string; en: string; uk: string }[] = [
    ...item.blocks.map(block => ({ target: block.block_id, en: block.body?.en ?? '', uk: block.body?.uk ?? '' })),
    ...item.claims.map(claim => ({ target: claim.claim_id, en: claim.statement?.en ?? '', uk: claim.statement?.uk ?? '' })),
  ];
  for (const { target, en, uk } of pairs) {
    if (!nonEmpty(en)) { f.push({ code: 'en_missing', target, message: 'English text missing.' }); continue; }
    if (!nonEmpty(uk)) { f.push({ code: 'uk_missing', target, message: 'Ukrainian text missing.' }); continue; }
    if (cyrillicShare(uk) < 0.5) f.push({ code: 'uk_untranslated', target, message: 'Ukrainian text is mostly non-Cyrillic.' });
    if (paragraphs(en).length !== paragraphs(uk).length) f.push({ code: 'paragraph_mismatch', target, message: 'EN and UK have different paragraph structure.' });
    const a = significantNumbers(en).join(' '), b = significantNumbers(uk).join(' ');
    if (a !== b) f.push({ code: 'number_mismatch', target, message: `Numbers differ between EN [${a}] and UK [${b}].` });
  }
  return result('localization', f);
}

/** One asset's rights evidence. Missing evidence means "not verified", never "permitted". */
export function mediaProblems(asset: MediaUse, item: ContentItem, ctx: PolicyContext): string[] {
  const problems: string[] = [];
  if (!isHttps(asset.source_url) || !nonEmpty(asset.creator)) problems.push('provenance_unknown');
  const id = asset.license?.identifier ?? null;
  // "CC BY NC 4.0", "cc-by-nc-4.0" → "CC-BY-NC-4.0" before any licence rule is applied.
  const license = nonEmpty(id) ? id.trim().toUpperCase().replace(/[\s_]+/g, '-') : '';
  if (!license || !isHttps(asset.license?.url)) problems.push('license_undocumented');
  else if (!ctx.license_allowlist.map(x => x.toUpperCase()).includes(license)) problems.push('license_not_allowed');
  const evidence = item.sources.find(source => source.source_id === asset.license?.evidence_source_id);
  // The licence statement must come from the asset's own page, not any page that mentions the licence.
  if (!evidence || sha256(evidence.text) !== evidence.content_sha256 || !nonEmpty(id) || !containsPhrase(evidence.text, id)
    || !nonEmpty(asset.source_url) || evidence.url !== asset.source_url)
    problems.push('license_evidence_missing');
  if (/^CC-BY/.test(license) && !nonEmpty(asset.attribution)) problems.push('attribution_missing');
  if (/-ND\b/.test(license) && nonEmpty(asset.modifications)) problems.push('derivative_not_permitted');
  // A caller's allowlist cannot make a non-commercial licence acceptable.
  if (/-NC\b/.test(license)) problems.push('restricted_use');
  if (asset.restrictions.some(r => /non-?commercial|editorial(?:[- ]use)?[- ]only|no[- ]derivatives|all rights reserved/i.test(r))) problems.push('restricted_use');
  if (!/^[a-f0-9]{64}$/.test(asset.file_sha256 ?? '')) problems.push('file_hash_missing');
  return problems;
}

export function mediaGate(item: ContentItem, ctx: PolicyContext): GateResult & { quarantined: string[]; publishable: string[]; requiredBlocked: boolean } {
  const findings: Finding[] = [], quarantined: string[] = [], publishable: string[] = [];
  let requiredBlocked = false;
  for (const asset of item.media) {
    const problems = mediaProblems(asset, item, ctx);
    if (!problems.length) { publishable.push(asset.asset_id); continue; }
    quarantined.push(asset.asset_id);
    if (asset.required) requiredBlocked = true;
    for (const code of problems) findings.push({ code, target: asset.asset_id, message: `Media rights: ${code.replace(/_/g, ' ')}.` });
  }
  const status: GateStatus = requiredBlocked ? 'unverifiable' : 'pass';
  // Quarantined optional assets stay listed as warnings: the text may publish image-free.
  return { gate: 'media', status, findings: requiredBlocked ? findings : [], warnings: requiredBlocked ? [] : findings, quarantined, publishable, requiredBlocked };
}

/** Build, tests and both-locale render recorded by CI for exactly this content digest. */
export function technicalGate(item: ContentItem, ctx: PolicyContext): GateResult {
  const receipt = ctx.technical_receipt;
  if (!receipt) return { gate: 'technical', status: 'pending', findings: [{ code: 'technical_receipt_missing', target: 'item', message: 'Awaiting CI build/render receipt.' }], warnings: [] };
  const f: Finding[] = [];
  if (receipt.item_sha256 !== itemDigest(item)) f.push({ code: 'technical_receipt_stale', target: 'item', message: 'Receipt was produced for different content.' });
  if (receipt.build !== 'passed') f.push({ code: 'build_failed', target: 'item', message: 'Build did not pass.' });
  if (receipt.tests !== 'passed') f.push({ code: 'tests_failed', target: 'item', message: 'Required tests did not pass.' });
  for (const locale of LOCALES) if (!receipt.rendered_locales.includes(locale)) f.push({ code: 'render_missing', target: locale, message: `No successful ${locale} render.` });
  if (!receipt.seo_metadata) f.push({ code: 'seo_metadata_missing', target: 'item', message: 'SEO metadata not present.' });
  if (!/^[a-f0-9]{40}$/.test(receipt.commit_sha)) f.push({ code: 'commit_sha_invalid', target: 'item', message: 'Receipt must name the exact commit.' });
  return result('technical', f);
}
