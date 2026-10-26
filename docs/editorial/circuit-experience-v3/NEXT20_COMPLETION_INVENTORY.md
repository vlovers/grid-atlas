# Twenty-circuit editorial completion inventory

> **Research-only, not published.** Counts below are derived from the actual `next20-bilingual-histories-v1.json` manuscript on this branch. The presence of a source candidate does not establish an independently approved claim.

## Bilingual historical event coverage

| Circuit | Drafts | Source candidates | F1 article first-pass checked | Classification-only checks | Missing source |
|---|---:|---:|---:|---:|---:|
| silverstone | 5 | 5 | 4 | 0 | — |
| monza | 5 | 5 | 4 | 0 | — |
| suzuka | 6 | 6 | 6 | 0 | — |
| interlagos | 6 | 6 | 6 | 0 | — |
| gilles-villeneuve | 5 | 5 | 5 | 0 | — |
| imola | 5 | 5 | 1 | 3 | — |
| nurburgring | 5 | 5 | 4 | 1 | — |
| hockenheimring | 5 | 5 | 4 | 1 | — |
| zandvoort | 5 | 5 | 4 | 0 | — |
| hungaroring | 8 | 8 | 7 | 1 | — |
| red-bull-ring | 5 | 5 | 4 | 0 | — |
| barcelona-catalunya | 5 | 5 | 3 | 2 | — |
| albert-park | 5 | 5 | 4 | 0 | — |
| marina-bay | 5 | 5 | 4 | 0 | — |
| bahrain | 5 | 5 | 3 | 2 | — |
| shanghai | 5 | 5 | 3 | 1 | — |
| yas-marina | 5 | 5 | 4 | 1 | — |
| cota | 5 | 5 | 3 | 2 | — |
| sepang | 5 | 5 | 4 | 0 | — |
| istanbul-park | 5 | 3 | 1 | 1 | 2008, 2007 |

**Totals:** 105 bilingual event drafts across 20 circuits; 103 with at least one F1 source candidate; 78 marked article first-pass checked; 15 marked classification-only; 2 without any source candidate.

## What was actually done on 27 October 2026

- Added or replaced **49** individual bilingual historical event narratives with official Formula 1 article or result citations. Earlier work had 54 source candidates; this branch now contains 103. A classification-only source is explicitly distinguished from an event narrative source.
- Corrected the review-status enum used for seven earlier classification-only checks, which caused the Foundation CI failure on commit `6c8a52a`.
- No independent historical editorial review or media rights approval has occurred; no public publication is authorized by this batch.

## Outstanding source gaps

- **Istanbul Park 2008:** Massa's third consecutive Turkish Grand Prix victory; requires a race-specific source confirming the historical claim.
- **Istanbul Park 2007:** Hamilton's tyre problem; requires a race-specific source for the tyre failure and its effect on his finishing position.

## Remaining publication blockers

1. Review all event claims against exact source passages, including the 10 sourced-but-unverified drafts. Classification-only results cannot establish crashes, penalties, race strategy or championship causation.
2. Obtain independent historical and bilingual editorial review; `source_checked_research_draft` is an internal first-pass label, not sign-off.
3. Map circuit identity and every historical event to the exact pinned F1DB circuit/configuration/race record. No configuration-specific turn numbering has been approved; do not infer turn numbers from generic SVGs.
4. Review photography rights per image asset and check presentation in both locales; no photo is approved merely because an article links to it.
5. Run full tests and archive-browser acceptance, inspect current CI status, and keep this PR in Draft until all release gates pass.

## Editorial status meanings

- `source_checked_research_draft`: a Formula 1 article was consulted for the specific event; narrative still requires independent review.
- `official_classification_checked_interpretation_pending`: official classification supports positions/times, not race context.
- `unverified_research_draft`: candidate story remains unverified even if a URL is attached.
- `unpublished`: content is not eligible for public story publication.

**No claim of 20 publication-ready circuits is made.** All 20 dossiers remain research-only.
