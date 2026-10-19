# Real F1DB archive acceptance — 20 October 2026

This report records results obtained through GitHub Actions in isolated PostgreSQL
17 against the **pinned F1DB v2026.17.0** release. It does **not** independently
verify F1 history, biographies, lineage, rights or individual row provenance.

## Reproducible procedure

Workflow: [Pinned F1DB real-archive acceptance](../../.github/workflows/real-archive.yml).

1. Download published split JSON ZIP + checksum list; verify SHA-256 through the
   existing importer, apply checksummed migrations, import twice to a disposable
   DB to check repeatability.
2. Build/start real NestJS API; run `python3 scripts/verify-real-archive.py`
   against PostgreSQL and API, selecting actual relationships by SQL instead of
   hardcoded local IDs.
3. Build/start production Next.js and Chromium; run
   `pnpm exec playwright test --config playwright.real-archive.config.ts`.
   CI derives representative early, middle, modern, repeated-result, densest
   constructor-season and longest driver-name cases directly from this release.

## Recorded evidence

| Gate | Result |
| --- | --- |
| Release size | 77 seasons, 917 drivers, 187 constructors, 830 entrants, 78 circuits, 1,172 races, 27,665 result rows |
| Twice-imported pinned archive | Both imports successful; counts unchanged |
| 1950 early SQL/API sample | 4 result entries / 4 distinct races |
| 1980 middle SQL/API sample | 13 result entries / 13 distinct races |
| 2010 modern SQL/API sample | 19 result entries / 19 distinct races |
| 1950 repeated-row case | 7 result entries / 6 distinct races |
| Empty season 2200 | Focus only; no observed edges |
| Driver ↔ constructor race evidence | SQL and both reciprocal Explorer endpoints agreed |
| Real archive UI | UK/EN desktop/mobile, evidence → Back and reciprocal graph, empty state, keyboard focus, mobile scroll, graph/list counts and longest recorded name |
| PR #113 | [12/12 real browser checks](https://github.com/vlovers/grid-atlas/actions/runs/39327987640) |
| PR #114 | [20/20 real browser checks](https://github.com/vlovers/grid-atlas/actions/runs/39329533573); Foundation CI and pinned archive workflow passed |

The PR #114 high-degree stress selector found a **1960 constructor-season with 34
distinct recorded driver associations** (local constructor ID 40 in that CI DB).
It confirmed 25 API/list entries, 10 SVG neighbors, an explicit truncation notice,
and accessible inspection of a list-only edge. IDs are local and must not be
used as portable F1DB identifiers. The longest imported result-associated driver
name was checked without assuming a fixed identity/name in the suite.

## Known limits and follow-ups

- This proves pinned-dataset import integrity and **consistency between SQL,
  API and sampled page behavior**, not the historical accuracy of every record.
  F1DB attribution at entity level does not identify per-result primary evidence.
- High-degree graphs can have more than 25 associations; **9 of 34 were not
  reachable through the bounded graph list**. Truncation is correctly disclosed,
  but completeness of browsing is not delivered: tracked in
  [#115](https://github.com/vlovers/grid-atlas/issues/115).
- Browser tests verify the keyboard-focusable map viewport, selected neighbor
  interaction and narrow/mobile scroll mechanics. They are **not** a complete
  manual screen-reader or cross-device accessibility audit.
- An independently reviewed bilingual biography and any verified editorial
  team-lineage edge remain separate publication gates, as do production hosting,
  backup/restore rehearsal, and deployment reviews (see
  [#104](https://github.com/vlovers/grid-atlas/issues/104) and
  [#107](https://github.com/vlovers/grid-atlas/issues/107)).
- A selected test path is representative, not a full row-by-row audit of all
  27,665 records. No synthetic fixture creates published historical facts.

## Decision

**P0 import/API/browser acceptance of issue #103: complete for the reproducible
pinned baseline**, based on merged
[PR #111](https://github.com/vlovers/grid-atlas/pull/111),
[PR #112](https://github.com/vlovers/grid-atlas/pull/112),
[PR #113](https://github.com/vlovers/grid-atlas/pull/113), and
[PR #114](https://github.com/vlovers/grid-atlas/pull/114).
Remaining product improvements are explicitly tracked rather than silently
presented as verified or fixed. This is **not** public beta approval.
