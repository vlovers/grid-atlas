# Editorial batch pipeline v1 — safe operating contract

## Goal

Prepare **20–50 driver profiles per batch**, rather than one PR per driver. Batch creation is a research and review workflow, **not** an automatic publication mechanism. Canonical identity and statistical data originate from the pinned F1DB release; narrative claims require independently opened sources and human review under [editorial-verification.md](../editorial-verification.md).

## Batch manifest

Create one version-controlled JSON manifest per batch under `docs/editorial/batches/`. Required fields:

- `batch_id`: stable lowercase identifier; unique across batches.
- `source`: `f1db` and the exact pinned release tag.
- `drivers`: 1–50 distinct canonical F1DB driver IDs; reject unknown and duplicate IDs against the imported release.
- `locale_targets`: `en` and/or `uk`.
- `review_status`: `draft` or `needs_review` for generated batches.
- `created_at`: ISO date; `reviewer`: null until a human actually reviews the batch.

Each driver's generated package should contain a canonical ID, source-release reference, factual/statistical observations with metric definitions, original narrative drafts, a claim-by-claim evidence register, locale-specific review status, and a media rights register. **Do not generate invented citations or placeholder images for publication.**

## Processing stages

1. **Preflight:** verify release checksum, schema, IDs, uniqueness and batch size. Fail the whole batch if identity reconciliation is ambiguous.
2. **Statistics:** read imported race/driver data and record metric semantics; do not equate raw race points with championship points when drop-score rules apply.
3. **Drafting:** create original English/Ukrainian draft text with stable claim IDs. Missing evidence stays `needs_review`, never `verified`.
4. **Evidence:** collect exact source passage/locator, publisher, canonical URL, access date and source version; preserve contradictions as review tasks.
5. **Quality gates:** check claims, references, translation consistency, link integrity and media permissions. Generate a machine-readable exceptions report.
6. **Human review:** named editor explicitly approves each factual claim and each locale. Review is invalidated if claim wording or source changes.
7. **Publish:** publish only approved revisions; stats-only public pages remain available when narrative approval is incomplete.

## MVP rollout

- **Batch 0:** five priority pilots (Senna, Schumacher, Hamilton, Verstappen, Prost) to exercise the contract.
- **Batch 1:** 20 additional historically significant drivers, selected by editorial coverage rather than a fabricated importance score.
- **Scale:** 50-driver batches after preflight and quality gates have automated tests and a successful dry run.

## Non-goals

No automatic claim approval, unlicensed image imports, bulk scraping of copyrighted articles, synthetic references, inferred team lineage, or silent changes to public biographies.

## Definition of done for implementation

A reproducible CLI can validate a manifest, generate drafts and an exceptions report, and prove in tests that unapproved claims never reach public pages. CI checks the manifest and source integrity. Keep batch outputs private/unpublished until editorial sign-off.
