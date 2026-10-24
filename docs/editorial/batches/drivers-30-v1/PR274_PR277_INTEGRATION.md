# PR #274 / PR #277 editorial integration handoff

**Status: planning only; no approvals, imports, merges or publications.** Verified against the two open pull requests on 2026-10-24:
- [#274](https://github.com/vlovers/grid-atlas/pull/274) at `8504af8eb43946ce930d281c4a7ecff747d52402` — Content Factory V1 claim cards, source graph and short bilingual narrative chapters.
- [#277](https://github.com/vlovers/grid-atlas/pull/277) at `70b147a40f13018180d0d4c6904cfe61ae496196` — ten long-form bilingual dossiers, paired source-located paragraphs, review sidecars and F1DB assertions.

## Ownership and precedence

**Do not concatenate prose.** For the ten overlapping identities, use the #277 dossier revision as the candidate long-form manuscript; #274 claim cards and chapters remain separate research/evidence and editorial cross-check material, never a second canonical public biography. Neither branch's `needs_review` state can be converted into approval by an automated crosswalk.

The overlap (10 identities, 27 #274 research chapters):
| Identity | #274 chapters | Long-form manuscript owner |
| --- | ---: | --- |
| emerson-fittipaldi | 3 | #277 |
| graham-hill | 3 | #277 |
| jackie-stewart | 4 | #277 |
| sebastian-vettel | 2 | #277 |
| niki-lauda | 3 | #277 |
| juan-manuel-fangio | 2 | #277 |
| jim-clark | 3 | #277 |
| nigel-mansell | 2 | #277 |
| mika-hakkinen | 3 | #277 |
| jack-brabham | 2 | #277 |

The remaining **15** #274 research-only identities are **not covered by #277**: alberto-ascari, mario-andretti, keke-rosberg, damon-hill, charles-leclerc, fernando-alonso, kimi-raikkonen, nelson-piquet, jenson-button, nico-rosberg, nino-farina, jochen-rindt, alan-jones, jacques-villeneuve, lando-norris. They retain their #274 narrative and evidence backlog; no dossier is implied to exist.

## Safe merge sequence

1. Wait for all required CI on each PR. Both currently target `main` and are individually mergeable, but that does **not** prove a combined-tree test passes.
2. Merge #277 first, **without publishing**. The review sidecars must remain unsigned and `stage=evidence_review`.
3. Refresh #274 from the resulting `main`; resolve any shared-document or workflow changes and rerun **all** #274 workflows, including pinned F1DB identity, Foundation CI and editorial release preflight. Do not merge a red combined tree.
4. After both are in `main`, run the existing #277 dossier validator and #274 claim/narrative/provenance audits together. Confirm 20 unapproved long-form exports still fail closed and all 25 #274 cards remain unpublished.
5. Build an **explicit claim-to-paragraph review crosswalk**, not a text copy: for each of the ten shared drivers, link #274 `claim_id` to #277 paragraph ID(s) only after inspecting semantics, sources, chronology and the exact F1DB identity. Keep unmapped or contradictory claims visible; never silently discard them.
6. Require independent human historical-source review, EN and UK editing, originality review, and exact-revision approval before any approved export or database publication. The editor/operator owns publication authorization.

## Distinct metrics (do not add together)

- #274: **96** paired research claims across 25 cards; at last recorded audit **69** claims linked to at least two declared publisher groups and **27** still lacking a second group. These are *structural provenance counts*, not independent fact-check sign-offs. 66 bilingual short research chapters across 25 drivers.
- #277: **20** long-form manuscripts (10 identities × 2 locales), **121** paired source-located paragraphs, **57** source documents, and **231** F1DB statistical assertions. Paragraphs can contain several facts; 121 is not a claim count. #277's 72/121 multi-publisher paragraphs are not directly comparable with #274's 69/96 claims.
- Both: **zero human approvals and zero publications** in these batches.

## Combined-tree acceptance checklist

- [ ] #277 and #274 are merged in an intentional order, with fresh CI on the combined tree.
- [ ] Exact driver IDs and locale targets reconcile against pinned F1DB.
- [ ] No double public dossier for the same driver/locale; no auto-import of `narrative-chapters-v1.json`.
- [ ] Ten-driver claim-to-paragraph crosswalk reviewed for discrepancies and source semantics.
- [ ] Fifteen-driver #274-only queue remains intact and unpublished.
- [ ] All publication guards reject missing review signatures and stale dossier revisions.
- [ ] Human EN/UK, fact, originality and source-licence reviews recorded before publication.

This file is a coordination artifact, **not** an editorial approval or a merge authorization.
