# Second five-season bilingual editorial batch

Adds **15 chapter drafts across 1950, 1961, 1984, 1994 and 2000**, linked only to claim IDs already documented in [season-research-batch-2.json](season-research-batch-2.json). Together with [the first expanded batch](expanded-season-chapters.json), all **ten selected seasons** now have three-section EN/UK editorial drafts.

These are **short narrative drafts**, not fully sourced magazine features. In particular, 1994 has only one underlying source-located championship-classification claim; no incident, safety or controversy chronology has been invented to fill that gap. Other chapters also require contemporary reporting and race-specific verification before publication.

Run `python3 scripts/audit-editorial-season-chapters-batch-2.py` and `python3 -m unittest discover -s tests -p 'test_editorial_season_chapters_batch_2.py'`. The tests verify structure, claim references, language coverage and unpublished state; they do not substitute for independent human editorial review.
