# Content Factory V1 — 30-driver research and evidence queue

**Research only.** This is not a release of 30 complete biographies. The first five drivers reuse their existing EN/UK canonical dossiers; the remaining 25 have paired EN/UK claim cards. None is approved or published by this batch.

## Inventory and commands

- `drivers-30-v1.json`: exactly 30 provisional identities (5 existing pilots, 25 additional candidates).
- `research/*.json`: 25 unpublished paired-language research cards. Each claim has stable ID, EN/UK statement and `needs_review` status.
- `championship-reference.json`: championship-year lookup, **not** an independently verified identity mapping or permission to publish.
- `scripts/editorial-batch-model.mjs`: pure structural and claim-evidence validation.
- `scripts/editorial-content-coverage.mjs`: authoritative offline coverage inventory including both canonical pilots **and** all 25 research cards.
- `scripts/editorial-research-batch-audit.mjs` and `scripts/editorial-evidence-readiness.mjs`: additional diagnostic reports; neither replaces publication review.
- `tests/editorial-content-factory.test.mjs`: structural, unsafe URL, evidence and publication-gate regression tests.
- `narrative-chapters-v1.json`: 25 original bilingual research chapters for eight drivers, each with explicit claim-ID dependencies. Not a public biography export.
- `scripts/editorial-narrative-model.mjs`, `scripts/editorial-narrative-audit.mjs`, and `tests/editorial-narrative.test.mjs`: validate chapter references, translations, and the unpublished gate.

Run from repository root with Node 24+:

```sh
node scripts/editorial-content-coverage.mjs > /tmp/grid-atlas-content-coverage.json
node scripts/editorial-content-coverage.mjs --require-evidence > /tmp/grid-atlas-content-evidence.json
node scripts/editorial-content-coverage.mjs --require-corroboration > /tmp/grid-atlas-corroboration.json
node scripts/editorial-narrative-audit.mjs > /tmp/grid-atlas-narratives.json
node --test tests/editorial-content-factory.test.mjs tests/editorial-narrative.test.mjs
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

## Current evidence audit notes (2026-10-24)

All **25 additional research cards** have now had their source passages inspected and claim-level locators recorded. There are **96 paired EN/UK research claims**, each with at least one declared Formula 1 source passage. Two transition claims (Räikkönen joining McLaren for 2002 and Button for 2010) use additional official Formula 1 articles with explicit dates rather than relying on inference from the original Hall of Fame page.

**Important distinction:** 96/96 is **structural evidence coverage**, not 96 externally validated facts, independent corroborations or editorial approvals. All linked sources currently belong to the **same Formula 1 publisher group**, so independent corroboration remains **0/96**. The research author recorded the locators; the audit does not inspect external pages. All 25 cards still require F1DB identity reconciliation, independently published evidence where available, and separate human EN/UK review.

Eight drivers now also have **25 bilingual narrative chapters** in `narrative-chapters-v1.json`: Emerson Fittipaldi, Graham Hill, Alberto Ascari, Mario Andretti, Keke Rosberg, Damon Hill, Jackie Stewart and Charles Leclerc. Chapters link back to the exact research claim IDs, and the new narrative audit rejects orphan claims, missing translations and publication-gate violations. These are **research-only narrative drafts**, not eight approved biographies.

**URL check:** the Nigel Mansell Hall of Fame URL in his card was reopened on 2026-10-24 and displays the correct Nigel Mansell biography with the 1992 championship heading. An earlier note about a John Surtees slug was an erroneous observation and has been removed. Recheck redirects during final source validation.

Do not import editorial photos, invent DRS/circuit data, infer 2026 season outcomes from 2025 records, or treat green structural CI as human approval.

## Next substantive batch

- Resolve URL/title mismatches and independently re-check the accuracy of all 96 linked claims.
- Add independent publisher corroboration to the 96 research claims; do not count two Formula 1 pages as independent.
- Reconcile driver IDs with the pinned F1DB and build proper EN/UK canonical dossier pairs with null review sidecars.
- Expand narrative chapters from sourced claims only, with explicit section-to-claim linkage.
- Obtain independent human review; only then consider an approved release.

Related: issue #107, `docs/editorial/APPROVED_RELEASE_PIPELINE.md` and `docs/editorial/PUBLICATION_REVIEW.md`.
