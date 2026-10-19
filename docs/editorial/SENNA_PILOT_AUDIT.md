# Editorial audit and Senna pilot — 2026-10-20

## Existing architecture and scope

Audited main at `bb71855`, with PR #71 at
`010321a05aef329edb3604c11625c5fb02740a9a`. Open PRs were #71 (Senna draft),
#118 and #124 (Time Machine). This work uses a separate branch from main and changes
none of those branches or their public application code.

- `docs/editorial-verification.md` already defines human claim/source, identity,
  copyright, translation and publication gates.
- Migrations 0006/0007 already store articles, sources, claims, evidence and licensed
  media, and invalidate reviews when article text, claims or evidence change.
- `apps/api/src/editorial.controller.ts` already exposes only published driver
  articles backed by verified, supported claims. Driver profiles render that result
  with references, and omit absent articles. Separate career-section editorial fields
  remain empty under their documented future contract. No new rendering is required.
- `scripts/editorial_dossiers.py` already validates draft-only claim/source dossiers,
  renders registered claims, reports research gaps and attaches research without
  overwriting existing batch content. Batch and career scripts have separate roles.
- Foundation CI runs all offline Python tests and JS unit tests. Database/API CI
  covers existing publication constraints and public-reader gates; web CI covers
  localized profiles. This milestone adds review preflight tests to existing discovery.
- The missing slice is an exact-revision repository review record, source category
  and publication details, media rights preflight and explicit readiness checks.
  [PUBLICATION_REVIEW.md](PUBLICATION_REVIEW.md) defines that addition. No CMS,
  database importer, authoring endpoint or automatic publication is introduced.

## PR #71 claim/prose audit

The starting draft is [PR #71](https://github.com/vlovers/grid-atlas/pull/71), file
`content/drafts/ayrton-senna.md`. Its original UK/EN writing and seven-row source
matrix are useful research input. The matrix is not a complete sentence-level claim
register. Its source spot-check explicitly does not constitute human approval.
The parallel Senna Markdown drafts and evidence register already on main are also
unapproved; this pilot does not replace or approve them.

| Draft statement / topic | Assessment and remaining evidence |
| --- | --- |
| Birth date, birthplace and nationality | The matrix points to F1; original documents and precise locators still need review. No birth assertion is carried into this small pilot. |
| 1984–1994 career and Toleman/Lotus/McLaren/Williams | Do not turn result associations into contracts, legal lineage or official starts. Reconcile the exact chronology and identities with the pinned archive before expanding the pilot. |
| First victory, Portugal 1985 | PR #71 recorded a contradictory retrospective heading. The currently inspected retrospective instead states 1985 in its text and headings do not reproduce the reported typo. A live page may have changed; preserve the old concern as research history and verify exact race results before publication. |
| Titles in 1988, 1990, 1991 | Located the FIA championship-winner rows previously only listed as a candidate in #71. Included as a narrow, still-unapproved claim. |
| 41 wins, 65 poles, 80 podiums, 161 starts | Source metric labels are not interchangeable with imported result rows. Not carried forward; a pinned data reconciliation and human statistical review remain missing. |
| Six Monaco wins | Verify the individual race records and FIA historical table. Not included in this two-claim pilot. |
| Eight wins and the 1988 title contest | The final standings table supports positions and championship points only. It does not itself establish raw race-result totals or the best-results rule. Pilot wording stays limited to table observations. |
| “Most successful period,” defining rivalry and legacy judgments | These need attributed criteria and source-specific evidence beyond the matrix. Omit them from this pilot. |
| Suzuka 1989/1990 collisions and championship effects | The matrix has no dedicated incident evidence entries. Obtain contemporaneous classifications, decisions and independent reporting; preserve disagreements and avoid assigning intent without precise attribution. Omitted here. |
| Williams move, six McLaren seasons, death date and circumstances | The combined prose has more assertions than the matrix's final row. Split and source each independently. Medical/crash causation is outside this pilot. |

## Source observations made during this audit

These are research observations by an automated assistant, not human review decisions.
No quotation or photograph has been copied. Exact publication days are left unknown
where the source does not provide them.

1. Opened the [FIA 2018 US GP pocket guide](https://www.fia.com/sites/default/files/2018_a5_media_kit_final_1.pdf),
   PDF page 80 (1-based), printed page 77, championship-winners table. The Senna rows
   identify 1988, 1990 and 1991 with McLaren-Honda. This is an official register
   (`primary` for the championship claim), with event-year context but no invented
   publication day. The claim does not generalize the source's other rows.
2. Reopened [Formula 1's 1988 driver standings](https://www.formula1.com/en/results/1988/drivers),
   first two rows. They list Senna first on 90 and Prost second on 87. This is an
   official classification (`primary` for these table values), not a raw season sum.
3. Reopened the [F1 Hall of Fame retrospective](https://www.formula1.com/en/information/drivers-hall-of-fame-ayrton-senna.FLD7ZtO0nUn7JzLEn5rOJ)
   and [2024 career retrospective](https://www.formula1.com/en/latest/article/who-was-ayrton-senna-and-why-is-he-regarded-as-one-of-f1s-greatest-drivers.2GZEdmgHd9mPeCae2n6n4K).
   They are secondary narrative sources, not independent corroboration of each other.
   The latter currently describes the first victory in the 1985 season. Neither is
   used as blanket support for the pilot's omitted biography passages.

The pilot files retain original, narrowly scoped UK/EN statements, exact source
locators and access dates. They intentionally do not duplicate the complete existing
biography. No media candidate was selected and no license or attribution was invented.
They live outside the existing batch dossier inventory to preserve its scope.

## Manual work before approval or publication

- Assign an accountable human author. A named independent editor must reopen each
  source and verify complete support, identity and each locale's original wording.
- Run the preflight with checksum-verified pinned F1DB assets. This checks that the
  external driver ID exists; it is not a race-by-race statistical reconciliation.
- Resolve the 1988 scoring issue by narrowing/removing unsupported interpretation
  or adding precise evidence. The pilot currently remains explicitly blocked.
- Decide whether to expand the biography; research omitted statements as individual
  claims, with contradictions and missing evidence retained. Do not represent two
  reviewed claims as approval of all PR #71 prose.
- Review Ukrainian terminology separately, and check copyright/originality and links
  in both locales. All pilot review fields remain null, including editorial sign-off.
- If media is later selected, record the original file page, creator, exact license,
  attribution, modifications and independent rights review before any reuse.
- A future database adapter needs immutable external revision mapping and additional
  integration tests for source edits, withdrawal and human authorization. Until then
  these files cannot publish through this CLI or the existing public API.

Neither PR #71 nor any biography has been marked published by this work.
