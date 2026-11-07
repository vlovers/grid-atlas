# Fuji 2008: 16-turn candidate guide and 1976/2008 stories

**2 November 2026 — independent editorial review pending.** Directly integrated into `circuit-corners-v3.json` and `circuit-narratives-v3.json`, not a disconnected research batch.

- `fuji-2` (2007–2008) has **16 individually authored EN/UK turns**, each with sources, no fabricated official proper name and no unreviewed pixel-coordinate overlay. This is **not** the eight-turn `fuji-1` configuration used in 1976–1977.
- Evidence: [F1DB-derived historical layout inventory](https://lapledger.org/circuits/fuji), [Fuji course corner guide in Japanese](https://grasshopper.d2.r-cms.jp/mcgp/fsw/), [Fuji Speedway official venue](https://fujispeedway.jp/), [Formula 1 2008 classification](https://www.formula1.com/en/results/2008/races/840/japan/race-result).
- **Source limitation:** A 2008 FIA turn-by-turn circuit map was not independently retrieved in this run. The F1DB 16-turn count and Japanese course guide support the layout and named areas, but do not fully prove a historical one-to-one mapping of every modern sponsored corner name to each 2008 number. `name: null` is therefore deliberate. Recheck T2–T15 against an actual 2008 F1 event map before approval.
- Two sourced EN/UK moments distinguish the [1976 championship decider](https://www.formula1.com/en/latest/article/9-thrilling-title-deciding-finales-from-f1-history.57lx35G8vIsWRCOL5LV6cF.57lx35G8vIsWRCOL5LV6cF) from the [2008 final Fuji F1 race](https://www.formula1.com/en/results/2008/races/840/japan/race-result). **Mario Andretti won the 1976 race; James Hunt finished third and won the title.** Fernando Alonso won in 2008.
- No FIA maps, F1 articles, photos, logos or track graphics were copied or relicensed. The existing `fuji-2.svg` is unchanged and remains attributed to Jules Roy under F1DB's CC BY 4.0. External sources are evidence, not image-use permission.
- `tests/circuit-fuji-2008-sixteen-turns-and-1976-history.test.mjs` guards era, numbering, two languages, source URLs, independent-review gate and the 1976/2008 distinction. The local full test suite was not run in this connector-only environment; CI must pass on the latest PR SHA.

**Status:** candidate data only; no public release or merge.
