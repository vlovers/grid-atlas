# Content Factory V1 — 30-driver research and evidence queue

**Research only.** This is not a release of 30 complete biographies. The first five drivers reuse their existing EN/UK canonical dossiers; the remaining 25 have paired EN/UK claim cards. None is approved or published by this batch.

## Inventory and commands

- `drivers-30-v1.json`: exactly 30 provisional identities (5 existing pilots, 25 additional candidates).
- `research/*.json`: 25 unpublished paired-language research cards. Each claim has stable ID, EN/UK statement and `needs_review` status.
- `championship-reference.json`: championship-year lookup, **not** an independently verified identity mapping or permission to publish.
- `scripts/editorial_batch_identity.py`: fail-closed pinned-F1DB external-ID reconciliation for all 30 drivers, reusing the existing checksum-verifying `read_drivers` importer. CI uploads a machine-readable **unpublished** identity report. Archive ID existence does not mean a human verified the person or the historical claims.
- `scripts/editorial-batch-model.mjs`: pure structural and claim-evidence validation.
- `scripts/editorial-content-coverage.mjs`: authoritative offline coverage inventory including both canonical pilots **and** all 25 research cards.
- `scripts/editorial-research-batch-audit.mjs` and `scripts/editorial-evidence-readiness.mjs`: additional diagnostic reports; neither replaces publication review.
- `tests/editorial-content-factory.test.mjs`: structural, unsafe URL, evidence and publication-gate regression tests.
- `narrative-chapters-v1.json`: 66 original bilingual research chapters for all 25 additional drivers, each with explicit claim-ID dependencies. Not a public biography export.
- `scripts/editorial-narrative-model.mjs`, `scripts/editorial-narrative-audit.mjs`, and `tests/editorial-narrative.test.mjs`: validate chapter references, translations, and the unpublished gate.

Run from repository root with Node 24+:

```sh
node scripts/editorial-content-coverage.mjs > /tmp/grid-atlas-content-coverage.json
node scripts/editorial-content-coverage.mjs --require-evidence > /tmp/grid-atlas-content-evidence.json
node scripts/editorial-content-coverage.mjs --require-corroboration > /tmp/grid-atlas-corroboration.json
node scripts/editorial-narrative-audit.mjs > /tmp/grid-atlas-narratives.json
node scripts/editorial-corroboration-queue.mjs > /tmp/grid-atlas-corroboration-queue.json
node --test tests/editorial-content-factory.test.mjs tests/editorial-narrative.test.mjs
python3 -m unittest discover -s tests -p test_editorial_batch_identity.py -v
python3 scripts/editorial_batch_identity.py \
  --archive /tmp/f1db/f1db-json-splitted.zip \
  --checksums /tmp/f1db/checksums_sha256.txt \
  --output /tmp/content-factory-30-identity.json
```

The normal coverage command **must** fail on missing files, malformed bilingual cards, duplicate claims, or publication-gate violations. The `--require-evidence` option now requires all claims to have structurally valid, declared source locators; it does **not** verify live page semantics. The separate `--require-corroboration` option requires two independent publisher groups per claim and is **expected to fail** until that research is complete. Passing either structural gate is not editorial approval.

## Evidence tiers

1. **Candidate:** ID is provisional until checked against pinned F1DB. A source URL alone is not identity proof.
2. **Paired research claim:** EN/UK text exists. This does not prove that either language has been independently reviewed.
3. **Claim-linked evidence:** `claim.evidence[]` has an HTTPS `source_url`, a human-readable **specific locator** (paragraph/section/row) and `supports: true`. The audit validates the *shape*, not the live page or semantic correctness.
4. **Source corroboration:** An independent publisher group supports the claim, with date, attribution, conflict checks and precise passage recorded.
5. **Editorial review:** An accountable author and a different human reviewer approve the exact revision of separate EN and UK dossiers using the existing release review sidecars.
6. **Publication:** Only the established approved-export and operator-controlled PostgreSQL publishing pipeline can publish. No research card is read by the public article renderer.

The evidence schema used by the research cards is:

```json
{
  "claim_id": "driver-event",
  "topic": "career_chronology",
  "en": "Sourced English statement.",
  "uk": "Підтверджене українське твердження.",
  "review_status": "needs_review",
  "evidence": [{
    "source_url": "https://example.org/primary-source",
    "locator": "Specific heading, result row or identifiable paragraph",
    "supports": true
  }]
}
```

This is an *intermediate* card format, not a competing canonical dossier schema. The `supports` field means the research author linked a passage; it is **not** a reviewer sign-off.

## Pinned archive identity gate (2026-10-24)

The F1DB import workflow now checks **all 30** candidate external driver IDs against the checksum-verified `v2026.17.0` split JSON archive and compares the five pilot IDs against the canonical release manifest. It fails on missing or duplicate IDs, invalid EN/UK locale targets, or publication-state violations. The artifact records each archive display name and source-record digest for later human reconciliation, but always reports `human_identity_review: pending` and zero editorial approvals. Local synthetic unit tests cover seven failure/success paths; real archive matching must be confirmed by the new CI run, not inferred from the test fixtures.

The batch manifest now uses `research_draft` for the 25 additional profiles instead of the stale `candidate_unresearched` status; no public status changes or approval are implied.

## Current evidence audit notes (2026-10-24)

All **25 additional research cards** have now had their source passages inspected and claim-level locators recorded. There are **96 paired EN/UK research claims**, each with at least one declared Formula 1 source passage. Two transition claims (Räikkönen joining McLaren for 2002 and Button for 2010) use additional official Formula 1 articles with explicit dates rather than relying on inference from the original Hall of Fame page.

**Important distinction:** 96/96 is **structural evidence coverage**, not 96 externally validated facts or editorial approvals. A second independent publisher group (FIA, separate from Formula 1) is now declared for **49/96** research claims, based on FIA race reports, historical features, Hall of Fame championship rows and FIA media-kit records. The remaining **47/96** still have evidence from only one publisher group. These numbers measure **declared source diversity**, not human-verified truth: the author recorded passage locators, and offline CI does not visit external pages. Every FIA passage, date and translation still requires independent editorial review, and all 25 cards still require pinned F1DB identity reconciliation and separate EN/UK sign-off. The research model additionally rejects a Formula 1 URL mislabeled as FIA or an FIA URL mislabeled as Formula 1 to prevent false corroboration counts.

All **25 additional drivers** now have **66 bilingual narrative chapters** in `narrative-chapters-v1.json` (the first eight drivers received 25 chapters, followed by 41 chapters for the remaining 17). Each chapter references research claim IDs, and the narrative audit rejects orphan claims, missing translations and publication-gate violations. The regression suite additionally requires every one of the 25 candidate IDs to have at least two chapters. These are **research-only narrative drafts**, not 25 approved biographies. Some drivers have only two brief chapters because their research cards currently contain just two claims; expansion must follow source verification rather than unsupported filler.

**URL check:** the Nigel Mansell Hall of Fame URL in his card was reopened on 2026-10-24 and displays the correct Nigel Mansell biography with the 1992 championship heading. An earlier note about a John Surtees slug was an erroneous observation and has been removed. Recheck redirects during final source validation.

Do not import editorial photos, invent DRS/circuit data, infer 2026 season outcomes from 2025 records, or treat green structural CI as human approval.

## Next substantive batch

- Recheck URL/title mismatches and verify all 96 historical assertions semantically; 49 declared FIA corroborations still require human verification.
- Work through the 47 single-publisher claims listed by `audit:editorial:queue`; verify each proposed FIA or third-party passage directly and record conflicts, not just URLs.
- Reconcile driver IDs with the pinned F1DB and build proper EN/UK canonical dossier pairs with null review sidecars.
- Expand the short narrative chapters into full biographies only after researching additional supported claims; retain explicit section-to-claim linkage.
- Obtain independent human review; only then consider an approved release.

Related: issue #107, `docs/editorial/APPROVED_RELEASE_PIPELINE.md` and `docs/editorial/PUBLICATION_REVIEW.md`.

## CI accessibility blocker (2026-10-24)

A prior Next.js web run had **503 passes and one failure** in `tests/browser/unified-archive.spec.ts`: Ukrainian `/constructors` at a 320px viewport with forced colors and 200% root text size overflowed the viewport by 184px. The catalogue stylesheet had explicitly disabled emergency word wrapping for long Ukrainian headings. The PR now allows emergency wrapping on narrow screens and the Playwright assertion reports overflowing elements to aid diagnosis. The Next.js web workflow on commit `0a3b7d1` completed successfully on 2026-10-24 at 05:22 UTC, as did the other six PR workflows. New commits must pass their own checks.
