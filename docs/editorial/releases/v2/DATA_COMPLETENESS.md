# Data completeness: measured archive versus historical storytelling

This is a **baseline field-coverage matrix**, not a new import or a claim of individual-record completeness. It uses the measured exhaustive [encyclopedia audit](../../../encyclopedia-coverage.md), whose verified baseline is F1DB v2026.17.0. The machine-readable [archive-readiness.json](archive-readiness.json) distinguishes measured fields from known editorial gaps.

## Verified archive strengths

- All **917 drivers**, **187 constructors** and **78 circuits** have source-reported identity details. The exhaustive acceptance checked all 1,182 profile identities, both locales, all 1,172 races and 27,665 result entries; see the original audit for verification boundaries.
- **57 drivers** and **one constructor** have no imported race-result evidence. Do not infer that they never raced.
- **506** drivers have source-reported death dates, **28** have permanent numbers and **7** have a second nationality. Absence of an optional field is not a factual negative.
- **160 historical circuit SVGs** exist across layouts; this is not a count of distinct circuits or proof of surveyed corner/sector geometry.

## Blockers to richly sourced stories

| Topic | Ready for automatic profile display | Additional editorial evidence needed |
| --- | --- | --- |
| Drivers | Identities and observed race-result careers | Contemporary biography, team moves, title rules, independently cleared portraits |
| Constructors | Identities, result associations and season rosters | Legal continuity, chassis/engine evolution, ownership and principals, photos |
| Circuits | Identities, events and illustrated historical layouts | Dated layout transitions, event-specific records, precise geometry and rights review |
| Seasons | Calendars and results | Official championship scoring, rules and sourced narrative turning points |

**Do not block story research until all optional fields exist.** Work on source-rich stories while recording unknowns explicitly. For the 11 framework-only editorial subjects, source verification and chapter-level event evidence come before publication; no automatic biography generation from a profile card.

## Quality gates

Run `python3 scripts/audit-editorial-archive-readiness.py` and `python3 -m unittest discover -s tests -p 'test_editorial_archive_readiness.py'`. These checks catch accidental overstatements of completeness; they do not re-run the 11,504-request exhaustive audit or independently prove historical accuracy. Public editorial approval and asset rights checks remain separate.
