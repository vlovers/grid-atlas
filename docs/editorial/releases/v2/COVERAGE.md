# Editorial Atlas Batch 2 — complete cohort scaffolding

All **25 subjects** now have original UK/EN briefs. Five subjects (Ferrari, McLaren, Monaco, Silverstone, 1988) additionally have source-located atomic claims and 11 original bilingual pilot chapters. The other **20 subjects have 60 bilingual editorial framework sections**, which explain how each page will investigate its history; **these sections are not verified subject-specific historical articles**.

[Coverage inventory](coverage.json) makes the difference machine-readable: 5 researched pilots, 20 frameworks, **0 approved and 0 published**. The coverage checker fails if a framework claims to have sourced evidence or if publication status is flipped.

## Why this is not ready for public publication

No canonical F1DB identities or independent human claim reviews have been completed for the 20 frameworks. The generic sections do not assert invented historical events, dates, statistics or quotations. Before publishing, each subject needs exact evidence locators, subject-specific original prose, UK/EN independent language checks, media rights and the existing signed editorial release path.

Run `python3 scripts/audit-editorial-coverage.py` and `python3 -m unittest discover -s tests -p 'test_editorial_*.py'` (subject to existing test discovery rules). Structural QA is not a substitute for historical verification.
