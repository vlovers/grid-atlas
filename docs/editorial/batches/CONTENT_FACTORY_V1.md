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

Run from repository root with Node 24+:

```sh
node scripts/editorial-content-coverage.mjs > /tmp/grid-atlas-content-coverage.json
node scripts/editorial-content-coverage.mjs --require-evidence > /tmp/grid-atlas-content-evidence.json
node --test tests/editorial-content-factory.test.mjs
```

The normal coverage command **must** fail on missing files, malformed bilingual cards, duplicate claims, or publication-gate violations. The `--require-evidence` option is intentionally stricter and **currently expected to fail** until every research claim has precise claim-level evidence. It must never be bypassed to suggest editorial readiness.

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

Sixteen cards now have inspected Formula 1 Hall of Fame claim-level locators: Alonso, Piquet, Mansell, Brabham, Farina, Rindt, Villeneuve, Norris, Vettel, Lauda, Fangio, Clark, Räikkönen, Häkkinen, Button and Rosberg. Across the 25 research cards, **52 of 76 paired EN/UK claims** have a linked primary-publisher passage; **24** remain unlinked (including the 9 cards not yet evidence-enriched). Räikkönen's 2002 McLaren transfer and Button's 2010 McLaren transfer deliberately remain unlinked because the inspected biography did not explicitly establish those exact season transitions. All 25 still require independent corroboration, pinned-F1DB identity reconciliation and separate human EN/UK review.

**URL caveat:** the live Nigel Mansell Hall of Fame page is served at a URL containing `drivers-hall-of-fame-john-surtees`, despite its displayed title and text being about Mansell. The card retains the previously recorded `nigel-mansell` slug; verify the canonical address and stable archive link before publication. Do not infer a correct page from the URL slug alone.

Do not import editorial photos, invent DRS/circuit data, infer 2026 season outcomes from 2025 records, or treat a green structural CI job as a human approval.

## Next substantive batch

- Resolve URL/title mismatches and reopen **every** research source.
- Add precise claim-level locators to the remaining cards and independent corroboration to all 25.
- Reconcile driver IDs with the pinned F1DB and build proper EN/UK canonical dossier pairs with null review sidecars.
- Expand narrative chapters from sourced claims only, with explicit section-to-claim linkage.
- Obtain independent human review; only then consider an approved release.

Related: issue #107, `docs/editorial/APPROVED_RELEASE_PIPELINE.md` and `docs/editorial/PUBLICATION_REVIEW.md`.
