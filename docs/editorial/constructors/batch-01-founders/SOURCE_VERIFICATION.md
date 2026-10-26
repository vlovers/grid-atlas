# Constructor batch 01 — source verification ledger

**Scope:** evidence inspected 2026-10-24. This is **editorial research**, not an independent human approval. The URL itself is not a license to reproduce images or prose. The 12-subject manifest remains `research_only`.

## Claims with inspected primary championship pages

| Claim ID | Subject | Claim | Publisher / exact locator | Research check | Remaining |
|---|---|---|---|---|---|
| F-01 | Ferrari | First team entry shown as 1950; team profile says competed in each championship season, **not necessarily every race** | [Formula 1 Ferrari team profile](https://www.formula1.com/en/teams/ferrari), “First Team Entry” and intro | Web source inspected 2026-10-24: supports statement as qualified | Check pinned archive season associations and reviewer sign-off |
| F-02 | Ferrari | Ascari, Surtees, Lauda, Schumacher are identified as major Ferrari eras | [Formula 1 Ferrari team profile](https://www.formula1.com/en/teams/ferrari), introductory paragraph | Web source inspected 2026-10-24 | Independent published source; editorial interpretation review |
| J-01 | Jordan | 1998 Belgian GP won by Damon Hill in Jordan Mugen Honda, Ralf Schumacher second | [Formula 1 1998 Belgian GP results](https://www.formula1.com/en/results/1998/races/683/belgium/race-result), positions 1 and 2 | Official results page inspected 2026-10-24: supports finishing order | Pinned F1DB race/result cross-check; human reviewer |
| J-02 | Jordan | Belgian 1998 was the team's first Grand Prix victory | [Formula 1 — Jordan's greatest moments](https://www.formula1.com/en/latest/article/from-memorable-debuts-to-unexpected-victories-jordan-grand-prixs-10-greatest.6CY81a5nTpky7ECfgfr138), “The first win — Belgian Grand Prix, 1998” | Source inspected 2026-10-24 | Verify historical total against pinned races and independent publisher |
| J-03 | Jordan | Jordan opportunity for Schumacher in 1991 ended early with a clutch failure | [Formula 1 — Moments in time, Belgian Grand Prix](https://www.formula1.com/en/latest/article/moments-in-time-the-belgian-grand-prix.2bJxwoBEgCzcC1Yrlzj1Qv), 1991 Schumacher passage | Source inspected 2026-10-24 | Differentiate qualifying from race result in final narrative |

## Historical data boundaries and next evidence

- The currently pinned manifest records exact source records for **Ferrari and McLaren** only. These hashes have **not** been recalculated in this PR.
- For Williams 1977, the **entrant** and **chassis constructor** must be reconciled separately. Do not attach a March chassis entry to the Williams constructor.
- Team Lotus must be disambiguated from later Lotus names; Mercedes 1954–55 must not silently imply a continuous works entry; Renault-era Enstone corporate succession is not the same thing as race-statistic continuity.
- All claims above come from **one publisher group, Formula 1**. Official results and editorial pages are different document types, **not independent publishers**.
- For the other nine constructors, exact page locators, event records and second-publisher evidence remain **unverified**. No entry in this ledger sets a review status to approved.
- Next tasks: (1) download and checksum-check the pinned F1DB archive in CI; (2) reconcile all 12 identities; (3) evidence-test individual claims, seasons and race IDs; (4) independent EN/UK human source and style review; (5) create a constructor-specific publication mechanism before exposure.
