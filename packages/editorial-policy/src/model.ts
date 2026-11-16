/**
 * Canonical evidence and publication model for the autonomous editorial pipeline.
 *
 * Everything here is data. Source text, excerpts and agent notes are untrusted
 * input: the policy compares them, it never interprets them as instructions.
 */

export const POLICY_VERSION = 'grid-atlas-editorial-policy/1.3.0';

export type Locale = 'en' | 'uk';
export type Localized = { en: string; uk: string };

export type AgentRole =
  | 'research' | 'writer' | 'fact_check' | 'editorial_review' | 'localization'
  | 'automated_verifier' | 'human';

/** Who did a piece of work. `run_id` distinguishes separate executions of the same agent/model. */
export type AgentRef = { id: string; role: AgentRole; run_id: string; model?: string; version?: string };

export type VerificationStatus =
  | 'unverified' | 'verified' | 'disputed' | 'insufficient_evidence' | 'stale' | 'rejected';

export type VerificationMethod = 'none' | 'dataset_comparison' | 'source_excerpt_match' | 'independent_retrieval';

export type ClaimType =
  | 'structured_statistic' | 'date' | 'name' | 'historical_event' | 'interpretation'
  | 'layout_fact' | 'corner_name' | 'technical_characteristic' | 'geographic' | 'quotation';

/** Critical claims carry the article (dates, results, names, causes); they need stronger evidence. */
export type ClaimImportance = 'critical' | 'standard';

export type EntityRef = { type: 'circuit' | 'layout' | 'corner' | 'driver' | 'constructor' | 'race' | 'season' | 'story'; id: string };

/** Reference to one field of one record in a pinned structured dataset. */
export type DatasetRef = { dataset: 'f1db'; release: string; record: string; field: string };

export type SourceEvidence = { source_id: string; excerpt: string; locator: string };
/**
 * A dataset record plus the value the claim asserts for it. The value must equal the
 * dataset's value and must be stated (as the value or a dataset-supplied mention) in the
 * claim's English statement, so a record cannot back a claim about something else.
 */
export type DatasetEvidence = { dataset_ref: DatasetRef; value: string | number };
export type Evidence = SourceEvidence | DatasetEvidence;

export type SourceKind = 'dataset' | 'official' | 'operator' | 'historian' | 'publication' | 'archive' | 'reference' | 'other';

/**
 * A captured copy of a source as retrieved by an agent. `text` is the normalized
 * retrieved text; `content_sha256` must be its SHA-256. A citation without a stored
 * snapshot cannot be checked and is treated as fabricated.
 */
export type SourceSnapshot = {
  source_id: string; url: string; title: string; publisher: string; kind: SourceKind;
  published_on: string | null; retrieved_at: string; retrieved_by: AgentRef;
  content_sha256: string; text: string;
};

export type Verification = {
  status: VerificationStatus;
  method: VerificationMethod;
  verifier: AgentRef | null;
  verified_at: string | null;
  /** claimDigest() at verification time: the claim plus the hashes of the snapshots it cites. Editing either makes it stale. */
  claim_sha256: string | null;
  notes?: string;
  /** Recorded for diagnostics only. The policy never reads it. */
  confidence?: number;
};

/**
 * `conflict_disclosed` means the text presents a documented disagreement between
 * sources rather than asserting one side; it is the only publishable form of a dispute.
 */
export type ClaimPresentation = 'asserted' | 'qualified' | 'conflict_disclosed';

export type Claim = {
  claim_id: string;
  entity: EntityRef;
  claim_type: ClaimType;
  importance: ClaimImportance;
  statement: Localized;
  /** Display value only. It is never evidence and never backs numbers in prose; dataset values live on DatasetEvidence. */
  value?: string | number | null;
  presentation: ClaimPresentation;
  evidence: Evidence[];
  verification: Verification;
};

export type ContentBlock = {
  block_id: string;
  kind: string;
  body: Localized;
  claim_ids: string[];
  /** Internal archive routes, locale-free (e.g. "/drivers/72"). */
  links: string[];
};

export type MediaUse = {
  asset_id: string;
  kind: 'photograph' | 'diagram' | 'svg_outline';
  /** False when the template has a legitimate image-free presentation. */
  required: boolean;
  source_url: string | null;
  creator: string | null;
  license: { identifier: string | null; url: string | null; evidence_source_id: string | null };
  attribution: string | null;
  modifications: string | null;
  restrictions: string[];
  file_sha256: string | null;
};

export type EditorialReview = {
  reviewer: AgentRef;
  item_sha256: string;
  passed: boolean;
  findings: string[];
};

export type ContentItem = {
  item_id: string;
  entity: EntityRef;
  dataset_release: string;
  blocks: ContentBlock[];
  claims: Claim[];
  sources: SourceSnapshot[];
  media: MediaUse[];
  authorship: {
    writer: AgentRef;
    fact_checker: AgentRef | null;
    localizer: AgentRef | null;
  };
  editorial_review: EditorialReview | null;
};

/** Evidence that CI built, tested and rendered this exact content. Bound to itemDigest(). */
export type TechnicalReceipt = {
  item_sha256: string;
  build: 'passed' | 'failed';
  tests: 'passed' | 'failed';
  rendered_locales: Locale[];
  seo_metadata: boolean;
  commit_sha: string;
};

/**
 * A dataset value, optionally with the surface forms by which prose may name it (e.g. the
 * value "carlos-pace" with mentions ["Carlos Pace", "Pace"]). Mentions come from the trusted
 * dataset index, never from the claim.
 */
export type DatasetValue = string | number | { value: string | number; mentions: string[] };
export type DatasetLookup = (ref: DatasetRef) => DatasetValue | null | undefined;

/**
 * Trusted recogniser of archive entities (drivers, constructors…) in text. Returns stable
 * entity keys (e.g. F1DB slugs) for every name it finds. Built by the publisher from the
 * pinned dataset and its bilingual name table — never supplied by an agent.
 */
export type EntityRecognizer = (text: string, locale: Locale) => string[];

export type PolicyContext = {
  pinned_dataset_release: string;
  dataset: DatasetLookup;
  entities: EntityRecognizer;
  /** Locale-free internal routes that exist in the archive. */
  known_routes: ReadonlySet<string>;
  /** Already-published or sibling texts, for near-duplicate detection. */
  corpus: readonly { item_id: string; text: string }[];
  license_allowlist: readonly string[];
  technical_receipt: TechnicalReceipt | null;
  /** Trusted current time from the publisher. Decisions dated later than this are refused. */
  evaluated_at: string;
};

export type GateName = 'schema' | 'factual' | 'source' | 'independence' | 'editorial' | 'localization' | 'media' | 'technical';
export type GateStatus = 'pass' | 'fail' | 'unverifiable' | 'pending';
export type Finding = { code: string; target: string; message: string };
export type GateResult = { gate: GateName; status: GateStatus; findings: Finding[]; warnings: Finding[] };

/** A = structured data only; B = evidence-backed editorial; C = disputed/unverifiable, never auto-published. */
export type RiskTier = 'A' | 'B' | 'C';

/**
 * PASS: publish. FAIL: revision queue with reasons. UNVERIFIABLE: quarantine (tier C).
 * PENDING_TECHNICAL: content gates passed; waiting for a build/render receipt for this exact digest.
 */
export type Outcome = 'PASS' | 'FAIL' | 'UNVERIFIABLE' | 'PENDING_TECHNICAL';

export type PublicationDecision = {
  policy_version: string;
  item_id: string;
  item_sha256: string;
  dataset_release: string;
  tier: RiskTier;
  outcome: Outcome;
  gates: GateResult[];
  quarantined: { claims: string[]; media: string[] };
  publishable_media: string[];
  evaluated_at: string;
};
