# Content Factory V1 — first 30-driver research batch

This batch is an **unpublished research queue**, not 30 completed biographies. It reuses the existing five bilingual dossiers from `docs/editorial/releases/v1/manifest.json` instead of duplicating them.

## Scope

- `drivers-30-v1.json`: 30 proposed driver IDs, five existing pilots plus 25 research candidates.
- `scripts/editorial-content-coverage.mjs`: read-only report of actual dossier presence, claim counts, source counts, review decisions and EN/UK claim-ID parity.
- No fictional citations, AI-generated reviewer decisions, auto-published text, unlicensed images, or new competing editorial CMS.

Run from the repository root:

```sh
node scripts/editorial-content-coverage.mjs > /tmp/grid-atlas-content-coverage.json
```

The report is intentionally conservative: an existing draft is not a verified identity, and a sourced claim is not an independently approved claim. `identity_verified` and `ready_for_publication` remain false until separate pinned-archive and human-review checks.

## Parallel research lanes

1. **Existing pilots (5):** Senna, Prost, Schumacher, Hamilton, Verstappen. Reopen and verify exact evidence passages; expand gaps only with traceable sources.
2. **Champions across eras (20):** develop EN/UK claim-linked drafts in independently reviewable batches, checking provisional slugs against pinned F1DB before dossier creation.
3. **Contemporary profiles (5):** distinguish dated archive coverage from live 2026 results; do not invent current season outcomes.

Each proposed narrative claim needs source URL, title, publisher, exact locator, access date and scope. Historical interpretations need attribution and independent corroboration. EN and UK claims share stable IDs, but require separate language review.

## Completion gates

- Batch research: source-linked EN/UK dossiers, exact IDs, review sidecars with null decisions, structural validation.
- Publication: a **different human reviewer** verifies the precise source passages and signs the exact revision; then the existing approved export and operator-controlled PostgreSQL publisher may be used.
- Missing source, unknown identity or disputed assertion stays explicitly blocked, not filled with generated text.

Related: issue #107 and the existing approved editorial release pipeline.
