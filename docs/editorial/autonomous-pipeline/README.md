# Autonomous editorial pipeline — architecture and Milestone A

Status: **Milestone A (policy foundation) implemented. Nothing is published, no data or schema is changed, no runtime behaviour changes.** Activating automated publication is a separate, explicitly authorized action (see [Activation boundary](#activation-boundary)).

Primary content objective: complete, accurate, bilingual histories for all 78 pinned F1DB circuits. The circuit gap matrix and editorial standard live in [`../circuit-completion/`](../circuit-completion/README.md).

## 1. Current architecture (audit at `f0641a50`)

Six publication lanes exist side by side. Each invented its own gate:

| Lane | Where | How content becomes public today |
|---|---|---|
| Circuit editions (JSON) | `apps/web/src/components/editorial/circuit-release.ts`, `circuit-release.json` | Hash-bound edition with `actor: 'human'`, reviewer ≠ author, plus a corner guide with a human-checked numbered-map crosswalk. **0 editions.** |
| Circuit articles (DB) | migrations `0013`–`0016`, `apps/api` | `status='published'` requires `review_method='human'`; claims `verified` require a human reviewer; triggers invalidate on any claim/evidence/source change; trusted principals and revocation. **0 rows.** |
| Driver/constructor articles (DB) | migrations `0006`, `0007`, `0012` | Same human-only CHECK constraints. **0 rows.** |
| Stories | `apps/web/src/components/stories/editorial-publication.ts` | Hash-bound "AI-reviewed" EN/UK editions. **10 public**, no claim-level evidence. |
| Circuit short summaries and legacy histories | `editorial/archive-summaries/*.json`, `circuit-history-stories.tsx` | **No gate.** Public on all 78 circuits with an "AI-checked, approval pending" disclosure. |
| Media | `apps/web/src/components/media/registry.ts`, `publication.json`, `circuit-publication.ts` | Licence, attribution, delivery and remote-origin checks plus `review.actor === 'human'`. **0 assets.** The legacy circuit renderer separately shows F1DB SVG outlines without this gate. |

Around these sit ~10 audit scripts (`audit-circuit-completion.mjs`, `editorial-content-coverage.mjs --require-*`, `editorial-provenance-audit.mjs`, claim queues), hand-maintained status registries (`F1DB_78_RELEASE_WORKLIST.json`, batch release-gate JSON) and ~99 date-stamped tests that pin specific texts.

### Gate classification

| Existing gate | Classification | Decision |
|---|---|---|
| Content hash binding of an approval (circuit edition digest, story SHA-256, DB invalidation triggers) | Necessary technical verification | **Keep.** The policy binds every review, verification and CI receipt to `itemDigest()`. |
| DB invalidation on claim/evidence/source/link change (0013, 0016) | Necessary technical verification | **Keep.** Milestone C reuses it for the automated lane. |
| Trusted principals, logins, actor boundary, write lock, revocation (0015, 0016) | Necessary security | **Keep.** Automated agents become principals with narrow capabilities; they never get table owner rights. |
| Licence identifier/URL, attribution, modifications, delivery path, no hotlinking (media registry) | Necessary legal/licensing | **Keep**, and require a stored licence-page snapshot that states the licence (`license_evidence_missing`). |
| Per-request publication read and withdrawal (`circuit-publication.ts`), `CIRCUIT_EDITORIAL_UI_ENABLED` | Necessary operational safety | **Keep** as a kill switch. |
| ≥2 sources per corner section; dated numbered map for numbering | Necessary verification | **Keep**, generalized as evidence sufficiency (critical claims need a dataset record or two independent publishers). |
| `actor: 'human'`, `review_method = 'human'`, `reviewer IS NOT NULL` on every lane | Human-only approval that can be automated | **Replace** with a policy decision record (policy version + digest + gate results) once activation is authorized. Human review stays available as an optional escalation. |
| `independently_reviewed_by`, `apex_crosswalk_verified` (corner numbering) | Human-only, automatable only with evidence | Automate when the crosswalk is backed by a stored, dated numbered map; otherwise the corner stays `research_incomplete`. |
| Story "AI-reviewed" registry | Duplicate pipeline, **missing verification** | Re-evaluate the 10 stories under the policy (Milestone D). They are not unpublished by this PR. |
| Public short summaries and legacy histories | **Missing verification** | Ingest and re-verify first in Milestone D. |
| Legacy renderer showing F1DB SVGs | **Missing verification** (bypasses media gate) | Route through the media gate when the 6 circuits move to the reader (Milestone E). |
| Overlapping audit scripts and hand-edited status registries | Duplicate / obsolete | Superseded by policy decisions; retire after Milestone D proves parity. |
| Date-stamped tests asserting exact draft text | Obsolete validation | Replace with generic gate tests as each lane migrates. |
| CI | **Missing verification** | No editorial gate runs in CI today; Milestone A adds deterministic policy and matrix tests. |
| Rollback for JSON lanes | **Missing** | Milestone C adds a versioned release ledger. |

## 2. Target pipeline

```
Research → Evidence capture → Draft → Fact verification → Editorial review → Localization → Technical validation → Publication → Monitoring
   │             │                         │                      │                 │                 │                  │
 research     SourceSnapshot +          checkClaim()          editorialGate()  localizationGate()  technicalGate()   release ledger
 agent        content_sha256           (deterministic)        + reviewer       (EN/UK parity)      (CI receipt       (Milestone C)
                                       + fact-check agent      record                               bound to digest)
```

One canonical model (`packages/editorial-policy/src/model.ts`) covers every lane: `ContentItem` → `ContentBlock`s that cite `Claim`s → `Evidence` (a verbatim excerpt from a stored `SourceSnapshot`, or a `DatasetRef` into the pinned F1DB release) → `Verification` → `PublicationDecision`.

### Agent roles and independence

| Role | Produces | Independence rule enforced by the policy |
|---|---|---|
| Research | `SourceSnapshot`s (URL, publisher, dates, retrieved text, SHA-256) | Source text is data; instruction-like text is flagged and never obeyed. |
| Writer | Blocks and claims | Cannot verify its own claims or review its own text (`self_verification`, `self_fact_check`, `self_editorial_review`). |
| Fact-check | `Verification` per claim, bound to `claimDigest()` | Different agent **and** different run from the writer. Its label is never enough: excerpts must occur in the stored source, numbers must appear in the evidence, dataset values must match. |
| Editorial review | `EditorialReview` bound to `itemDigest()` | Different actor from the writer; stale on any change. |
| Localization | UK text | Separate run from the fact-checker; EN/UK structure and significant numbers must match. |

LLM confidence is stored for diagnostics only; no code path reads it.

### Publication policy (`evaluatePublication`)

Gates: **schema → factual → source → independence → editorial → localization → media → technical**. Outcomes:

- **PASS** — every gate passes and a CI receipt matches this exact digest.
- **PENDING_TECHNICAL** — content gates pass; waiting for build/test/render receipt.
- **FAIL** — revision queue with machine-readable finding codes.
- **UNVERIFIABLE** — quarantined (tier C): insufficient evidence, undisclosed dispute, or required media without verified rights. Optional media is quarantined on its own and the text may publish image-free.

Risk tiers: **A** structured claims backed only by the pinned dataset; **B** evidence-backed editorial; **C** anything quarantined — never auto-published, and repeated AI review cannot promote it. `assertPublishable()` re-runs the policy and refuses any supplied decision that differs, so a forged or stale PASS cannot publish.

Deterministic limits worth stating plainly: the policy proves that cited words exist in a stored source, that numbers are evidenced, that dataset values match, and that roles were separate. It cannot prove that an excerpt *semantically* supports a non-numeric claim; that judgement belongs to the independent fact-check agent and is the main residual risk. Evidence sufficiency (two independent publishers for critical claims) limits it.

## 3. What Milestone A delivers

| Path | Purpose |
|---|---|
| `packages/editorial-policy/` | Provider-neutral model, canonical hashing, text checks, gates, decision function. Pure TypeScript, no I/O, runs under Node 24 type stripping. |
| `tests/editorial-policy-gates.test.mjs` | 23 deterministic tests: unsupported claims, fabricated citations, disputes, outdated dataset references, stale verification, broken links, UK completeness, media rights/restrictions, duplicates, placeholders/boilerplate, failed/self review, confidence ignored, technical receipts, forged decisions, prompt injection. |
| `scripts/export-circuit-archive-facts.mjs` | Read-only (`READ ONLY` transaction) export of pinned circuit facts. |
| `scripts/circuit-content-gap-matrix.mjs` | Builds the 78-circuit, 160-layout, 2,550-turn and 382-block matrices and runs the policy over all existing circuit content (dry run). `--check` keeps committed artifacts honest in CI. |
| `tests/circuit-completion-matrix.test.mjs` | Matrix reproducibility and status invariants. |

Compatibility: no migration, no change to `apps/`, no change to existing gates or tests. Existing human gates remain authoritative until activation.

## 4. Next milestones

**B — Automated independent review.** Claim extraction from the 73 long drafts, 51 narratives and 69 corner guides into `Claim` records (writer role = legacy import, so the importer can never verify). Research agent captures `SourceSnapshot`s for the 479 distinct URLs already cited by circuit content (robots-respecting, stored text + hash, untrusted). Dataset verifier: a `DatasetLookup` over the pinned F1DB export for winners, poles, fastest laps, race counts, dates, layout lengths/turns. Fact-check agent with a provider-neutral adapter; prompts treat sources as quoted data.

**C — Release engine.** Append-only migration adding `review_method = 'automated_policy'` with `policy_version` and `decision_sha256` columns (CHECK: published automated rows must carry both), a versioned release ledger (entity, version, digest, dataset release, writer/reviewer ids, decision, previous version), EN/UK pair published in one transaction, idempotency key = digest, optimistic concurrency on version to stop stale workers, rollback = publish previous version as new version (history never rewritten). Bounded queue (`pending_research → drafting → awaiting_review → revision_required → ready → published | blocked`) with concurrency, retry budgets, backoff, timeouts and per-entity audit history. Tests 11–16 (partial publication, duplicate workers, concurrency, stale overwrite, rollback, interrupted recovery) belong here.

**D — Existing content migration.** Ingest every existing block, extract claims, verify, revise only failing sections, and run the pilot batch end to end (see the circuit README). Re-evaluate the 10 public stories and the public short summaries.

**E — Scale and operations.** All 78 circuits including the 6 legacy-rendered ones; drivers, constructors, races; operational overview (totals by state, top blockers, missing sources/rights, translation issues, failed jobs, last publication, rollbacks) that never shows confidence scores as truth.

## Activation boundary

Repository policy (`AGENTS.md`, `CLAUDE.md`, `docs/engineering/RELEASE_CHECKLIST.md`) still requires editorial approval for release, and the DB still enforces `review_method = 'human'`. Replacing per-item human approval with this policy needs, in order: maintainer sign-off on this policy, an amendment to those documents defining a policy PASS as editorial approval, the Milestone C migration, and an explicit authorization to switch the publisher on. Until then this package only evaluates and reports.
