# Discovery verification — 24 October 2026

Production build against checksum-verified F1DB v2026.17.0 in an isolated disposable PostgreSQL database. Base: `d0ec3a6`. No synthetic archive or production credentials used for the acceptance suite. State: implemented and locally verified; independent source/media acceptance and production release are separate gates.

| Command | Result |
| --- | --- |
| `git fetch origin main` | Fetched before branch/worktree creation |
| `pnpm install --frozen-lockfile` | Passed with pinned pnpm 10.18.3; runtime checks use Node 24.21.0 |
| `DATABASE_URL=…:55464/grid_atlas bash scripts/import-f1db.sh /private/tmp/grid-atlas-f1db/f1db-json-splitted.zip /private/tmp/grid-atlas-f1db/checksums_sha256.txt` | Passed, all migrations/importers; 160 layouts and 1,172 event fact records verified |
| `pnpm check` | Passed |
| `pnpm lint` | Passed after repairing five pre-existing main errors in local media-preview tooling (unused imports and preserved error causes only) |
| `pnpm typecheck` | Passed |
| `pnpm test` | 244 passed; loopback preview tests require execution outside filesystem/network sandbox |
| `python3 -m unittest discover -s tests -v` | 378 passed |
| `DATABASE_URL=…:55464/grid_atlas pnpm test:integration` | 42 passed, 1 existing optional approved-publication test skipped; owned schemas only |
| `pnpm build` | Passed; existing autoprefixer warnings in archive-rhythm styles retained |
| `V3_API=http://127.0.0.1:3480 pnpm exec playwright test --config playwright.product-v3.config.ts` | 36 passed: desktop Chromium, WebKit and mobile Chromium; genuine archive; EN/UK |
| `pnpm audit:media --as-of 2026-10-24` | Passed; public photographic registry remains empty |
| `python3 scripts/audit-doc-links.py` | 0 unresolved local links |
| `git diff --check` | Passed |

The first browser run caught test assumptions about short names: canonical archive names are Team Lotus, Toleman Group Motorsport and Lewis Carl Davidson Hamilton. Tests now resolve exact F1DB external identities and assert canonical IDs/names rather than assuming display strings. An initial sandbox run could not launch Chromium or loopback preview servers; reruns used approved local execution. The media audit requires its explicit as-of date; the bare command was rejected and rerun correctly. No check was disabled.

## Acceptance evidence

- Search → select Senna chooses recorded seasons; explicit 2025/2026 URLs remain intact and show outside-recorded-career context.
- Senna 1987/1988 shows the actual Lotus/McLaren difference and opens underlying race results.
- Lineage searches Ferrari in the genuine constructor catalogue, distinguishes zero reviewed claims, and opens Atlas. Its populated-claims disclosure uses general scope copy.
- Career overview exposes all four Senna constructors; sparse Schwelm Cruz remains one 1953 connection. Long careers use search and twelve partners per page.
- Cooper 1960 exercises 25 loaded associations, visual windows, last-neighbor selection, complete-list pagination and bidirectional career-page/graph-selection URL preservation.
- All tools checked with 200% text, keyboard skip link and reduced motion. Source disclosures and canonical evidence URLs remain available.

An independent reviewer assessed both original diffs against requirements. Their search-default, future Lineage copy, zero chart mark and disclosure findings were fixed; a second pass added career pagination URL-state protection and clamping. This does not grant editorial, legal or release approval.

## Screenshots

Native production captures at 1440×1000, 1024×1000 and 390×844, in EN and UK. All 30 before and 30 after captures report zero horizontal document overflow and zero page errors. The JSON capture reports include actual loaded font families, HTTP status and page height.

| Route | Before | After |
| --- | --- | --- |
| Time Machine / outside career | [UK desktop](screenshots/before-time-machine-uk-1440.jpg) | [UK desktop](screenshots/after-a-time-machine-uk-1440.jpg) |
| Time Machine / meaningful comparison | [EN desktop](screenshots/before-comparison-en-1440.jpg) | [EN desktop](screenshots/after-a-comparison-en-1440.jpg) |
| Lineage | [EN desktop](screenshots/before-lineage-en-1440.jpg) | [EN desktop](screenshots/after-a-lineage-en-1440.jpg) |
| Atlas sparse career | [UK mobile](screenshots/before-atlas-uk-390.jpg) | [UK mobile](screenshots/after-a-atlas-uk-390.jpg) |

Reproduce with API on 3480, production web on 3481, then `node scripts/capture-product-v3.mjs after-a`. Do not rebuild while preview/tests use the same Next output. Detailed API baseline is in api-baseline.json. Numeric IDs in the reported URLs were verified in this dedicated import; external F1DB identifiers remain the portable identity.

## Limits and next action

No contracts, legal lineage, inferred participation, championship claims, biographies or photographs were added. Career-derived ranges describe imported evidence, not independent historical verification of every result. Graph/API caps are unchanged. Lineage remains independently reviewed claims only. The optional publication integration test remains skipped; no approval was invented to make it run. No manual hardware screen-reader or physical-device test is claimed.

PR A changes discovery/copy; PR B provides the visual package on top with a disjoint file diff. PR C is blocked on issue #290's human rights/publication review. Maintainer review and green CI precede any merge; deployment and issue #104 release gates remain outstanding.
