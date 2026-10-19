# Batch 10 — research coverage and evidence backlog

**Status: unpublished research, 2026-10-20.** Manifest lists 10 candidate canonical F1DB identifiers; verify all against the pinned checksum-checked archive before production use. This document is a scope and quality report, not evidence of completed research.

| Driver | Existing research | Next source checks / blockers |
| --- | --- | --- |
| Ayrton Senna | EN/UK pilot with five atomic claims per locale; #130 merged; research cards #132 | Fill remaining career years; reconcile Monaco six-win sequence and exact race identities; independent reviews missing |
| Alain Prost | 11 sourced EN claims; **11 newly translated UK claims** | Independent UK wording review; source independence; cited 1984 and 1993 classifications; Suzuka 1989–1990 unresolved |
| Michael Schumacher | 11 sourced EN claims; **11 newly translated UK claims** | Independent UK wording review; historical race classifications; distinguish Mercedes account from independent history |
| Lewis Hamilton | Existing F1DB structured profile; no biography claimed complete | Source championship claims from FIA year records; pin the date of changing career stats; original UK/EN dossiers |
| Juan Manuel Fangio | Existing F1DB structured profile; no biography claimed complete | Period FIA championship records, era-specific starts/entries semantics, independent context sources |
| Jim Clark | Existing F1DB structured profile; no biography claimed complete | Verify race dates and team records separately; no unsupported career totals or accident causality |
| Niki Lauda | Existing F1DB structured profile; no biography claimed complete | FIA championship records; 1976 sensitive medical/crash context must be sourced separately |
| Jackie Stewart | Existing F1DB structured profile; no biography claimed complete | FIA titles and period safety reforms; avoid unsourced causal claims |
| Sebastian Vettel | Existing F1DB structured profile; no biography claimed complete | FIA titles, team/season mapping, historical race evidence |
| Fernando Alonso | Existing F1DB structured profile; no biography claimed complete | Titles and seasons; date-stamped current-career stats; prevent stale numerical assertions |

## Measured progress

- New content: 2 complete UK research dossiers = **22 atomic, source-linked claim translations** and **6 ordered narrative sections**. Each UK claim reuses the corresponding EN evidence locator, which is a research pointer, **not verification of the translated wording**.
- Existing primary pilot: Senna 5 claims per locale, neither locale approved.
- Remaining 7 drivers in this batch have no newly researched biography in this PR. This deliberate gap must not be counted as finished coverage.
- No photos, invented sources, fake AI/editor approvals, SQL publication, changes to live pages or sensitive history treatment.

## Quality / acceptance

- Run the existing `scripts/validate_editorial_batch.py` manifest validator with verified F1DB archive (do not bypass checksum checks).
- Run `scripts/editorial_dossiers.py` for newly added UK dossiers using pinned F1DB assets and a fixed as-of date; check duplicate source URLs, claim IDs, topics and section references.
- Run offline Python tests and existing CI. Report executable checks separately from human review.
- Review each translated claim with independent human signoff before it can leave `needs_review`.
- In a subsequent batch PR, generate/verify EN/UK dossiers for the seven remaining drivers using *visited* sources and precise locators, not memory or URL guesses.

**Why batching helps:** one manifest and one validation cycle covers many drivers; research and human claim approval remain independent work. The goal of #133 is ten verified-researchable dossiers, not a misleading ten green badges.
