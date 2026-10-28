# 78-circuit research inventory — integration QA (28 October 2026)

**Scope:** reconciles the 33 newly merged five-story research dossiers with the existing 45, for **78/78 research manuscripts**. This is a repository inventory, **not** approval for public publication. The original pinned F1DB coverage audit remains an immutable historical baseline; the release worklist now records current research availability.

## What is actually present

| Measure | Observed |
| --- | ---: |
| Circuits with existing bilingual short content | 78/78 |
| Circuits with five-story research manuscripts | 78/78 |
| Newly integrated research dossiers | 33 |
| Newly integrated EN/UK story pairs | 165 |
| Source references across the new 165 stories | 177 |
| Distinct source URLs across the new 165 stories | 39 |
| Dossiers using **one distinct URL for all five stories** | **27/33** |
| Dossiers using more than one URL | 6/33 |
| Dossiers ready for publication by independent approval | **0** |

The six with more than one source URL are **Aida (3), Aintree (2), Caesars Palace (3), Dallas (2), Reims (2), Riverside (2)**. Only Aida, Aintree and Caesars Palace currently span more than one distinct story year in these research drafts. A source count is a triage heuristic, not a proxy for historical truth; a single official race classification can establish several facts but rarely corroborates five independent editorial narratives or broader circuit context.

## Integration behavior and public UX

- The new 165 stories remain in `docs/editorial/circuit-experience-v3/EXPANSION_*_RESEARCH_DRAFTS.json`; they are **not** mounted as approved public moments or published longform.
- Public circuit pages continue to use existing source-linked, release-gated featured stories and approved assets. Do not introduce a public draft fallback, automatic review transition or synthetic approval.
- The worklist now distinguishes **research manuscript exists** from **independent claim review complete**, historical layout/turn validation, photo rights, bilingual editing and **publication ready**. Every latter gate remains pending/blocked.
- `F1DB_33_EXPANSION_SOURCE_TRIAGE_20261028.json` is a reproducible, per-circuit review queue with the exact manuscript file, source URLs, story years and source-diversity risk.
- Regression tests check the 78/78 inventory, 33/165 expansion membership, bilingual text, distinct titles per circuit, source URL syntax, review flags and audit consistency.

## Review order and acceptance

**First priority:** the 27 single-source dossiers. For each of the five stories, identify each distinct historical assertion, compare with race classifications **and** at least one independent context source where warranted, and record exact claim-scoped provenance. Confirm race year and circuit variant before writing about turns or layouts. Fix translation meaning and style in both languages. Do not infer a racing outcome from a source that only provides a calendar or circuit guide.

**Second priority:** the six multi-source dossiers. More URLs do not establish independent corroboration: inspect source scope, contradictions and repeated boilerplate. In particular, cross-check Reims and Riverside against the existing claim-level queues and the expansion-3 editorial audit. The earlier expansion-3 title-vocabulary audit was performed **before** the 55-headline rewrite in PR #343; do not present its title counts as a current post-rewrite score.

**Publication acceptance:** human sign-off on the exact final claims and copy, provenance links, appropriate race-era layouts and verified media rights, then the existing digest-based release mechanism. The owner may authorize distribution of clearly labeled AI-assisted content, but that is **not** an independent historical fact-check. No photo license or human approval field was modified here.

## Automated and manual limits

The new Node tests are structural checks; they do not follow source links, verify race results, validate Ukrainian translations or assess photographic rights. CI success proves test execution, not source reliability. The pinned 78-circuit historical coverage audit remains dated to 27 October and is not rewritten to retroactively pretend all drafts existed then.
