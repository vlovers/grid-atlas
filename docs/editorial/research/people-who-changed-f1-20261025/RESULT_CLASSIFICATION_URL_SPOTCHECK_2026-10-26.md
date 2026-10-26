# Official classification source URL spot-check — 26 October 2026

Scope: targeted validation of **five** official Formula 1 race-result URLs appearing in the editorial research. These are direct checks of the official classification pages, not comprehensive approval of all long-form manuscript claims.

| Story | Official race classification | Checked details |
| --- | --- | --- |
| Button / Canada 2011 | https://www.formula1.com/en/results/2011/races/34/canada/race-result | Button P1, Vettel P2, Webber P3, 70 laps, winner time 4:04:39.537 |
| Pérez / Sakhir 2020 | https://www.formula1.com/en/results/2020/races/1060/bahrain/race-result | Page is the **Sakhir Grand Prix**, despite its `bahrain` URL suffix; Pérez P1, Ocon P2, Stroll P3, Russell P9 with fastest-lap bonus point |
| Vettel / Italy 2008 | https://www.formula1.com/en/results/2008/races/838/italy/race-result | Vettel P1 in STR Ferrari (Toro Rosso), Kovalainen P2, Kubica P3; Vettel +12.512 s ahead of P2 |
| Villeneuve and Arnoux / France 1979 | https://www.formula1.com/en/results/1979/races/414/france/race-result | Jabouille P1, Villeneuve P2, Arnoux P3, circuit Dijon-Prenois, 80 laps |
| Kubica / Canada 2008 | https://www.formula1.com/en/results/2008/races/831/canada/race-result | Kubica P1 and Heidfeld P2 for Sauber BMW, Coulthard P3; 70 laps |

**Important URL subtlety:** The 2011 Canada result path ending `races/34/canada` and the 2020 Sakhir result path ending `races/1060/bahrain` are **valid official pages**. Do not 'fix' the numeric ID or URL slug based only on assumptions about year-number sequencing or race names.

## Verification boundaries

A final classification does **not** by itself establish the precise order of overtakes, strategy choices, team conversations, what a driver thought, tyre compounds per lap, stewards' reasoning, or photo and video reuse rights. These need other primary historical records and independently reviewed prose.

## Engineering blocker identified

In the same audit, the story reader's route was importing `draftArticle` from `apps/web/src/components/stories/editorial-draft-articles.ts`, but that module had lost the export during a prior wholesale serialization of its manuscripts. Restored the named export and added a regression test. **Do not represent the Next.js build as passing until the current HEAD is actually tested.**

Release remains **blocked** by independent source review, CI, browser QA and licensed media signoff.
