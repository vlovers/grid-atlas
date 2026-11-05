# Four historical Grand Prix layouts — 44 individual turn entries (2026-11-02)

This is a **source-and-rights note for the actual 44 EN/UK turn entries** in `apps/web/src/components/editorial/circuit-corners-v3.json` and four biographies/eight race moments in `circuit-narratives-v3.json`. It is not a duplicate of BATCH_01/BATCH_02 reading notes, a completed independent review, a release approval or permission to republish a third-party map.

| Circuit | Historical F1DB layout | Period | Turns | Verified venue features | Historical numbered FIA map |
|---|---|---:|---:|---|---|
| Aintree | `aintree-1` | 1962 | 8 | Waterway, Anchor Crossing, Cottage, Country, Village, Becher's, Melling Crossing, Tatts | **Not located**; exact feature-to-turn matching provisional |
| Kyalami | `kyalami-1` | 1985 | 9 | Crowthorne, Barbeque, Jukskei, Sunset, Clubhouse, Esses, Leeukop, the Kink on original clockwise course | **Not located**; original 1985 course, not 1992–93 or modern |
| Dijon-Prenois | `dijon-2` | 1984 | 12 | Villeroy, Sablières, Gorgeolies, Combe, Parabolique, Bretelle, Pouas | **Not located**; present-day named diagram cannot certify 1984 apex numbering |
| Zolder | `zolder-2` | 1984 | 15 | Period route and named geographical landmarks; modern labels only as comparison | **Not located**; current 10-corner layout cannot be substituted |

Every turn has one section, a distinct English explanation, a distinct Ukrainian explanation and source keys. **`name: null` is deliberate**: names in `aliases` are *research leads*, not verified official period names attached to a numbered 1984/1985/1962 apex. Every section uses `confirmation_status: historical_numbering_unverified`; every guide uses `review_status: independent_review_pending`. Neither a historical SVG outline nor a modern turn guide is sufficient to certify period numbering. The site release gate must keep all four unpublished.

## Evidence actually consulted

- **Aintree:** [Aintree Circuit Club's Grand Prix history](https://www.aintree.org.uk/history/) establishes the five World Championship British Grands Prix and 1955/1957 milestones; [F1DB-based period layout summary](https://lapledger.org/circuits/aintree) establishes the eight-turn `aintree-1` layout; [historical corner route account](https://yorkshireferret.blogspot.com/2016/02/) provides a tentative named sequence; [F1 official 1962 result](https://www.formula1.com/en/results/1962/races/200/great-britain/race-result) verifies Clark's victory.
- **Kyalami:** [venue's named-corner guide](https://www.kyalamigrandprixcircuit.com/about-kyalami/) documents names **on the modern track**, not their 1985 numbered positions. [Layout chronology](https://en.wikipedia.org/wiki/Kyalami) distinguishes original and rebuilt routes; [F1DB period breakdown](https://racedatahub.com/en/f1/circuits/kyalami) distinguishes the nine-turn original from the thirteen-turn 1992–93 layout. [Official 1975 result](https://www.formula1.com/en/results/1975/races/346/south-africa/race-result) verifies Scheckter's home win; [1985 results](https://www.formula1.com/en/results/1985/races) verify Mansell's victory.
- **Dijon:** [the venue's history](https://www.circuit-dijon-prenois.com/en/history-of-the-racetrack-en/) documents the 1977 extension from 3.289 km to 3.801 km and creation of Parabolique; [Driver61 named feature map](https://driver61.com/wp-content/uploads/2020/10/Dijon-Prenois-Track-Map-Driver61.pdf) provides a modern feature reference **only**; [F1DB period breakdown](https://lapledger.org/circuits/dijon) confirms `dijon-2`; [1979](https://www.formula1.com/en/results/1979/races/414/france/race-result) and [1984](https://www.formula1.com/en/results/1984/races/470/france/race-result) F1 results support the historical moments.
- **Zolder:** [F1DB period breakdown](https://www.lapledger.org/circuits/zolder) confirms the 4.262-km fifteen-turn `zolder-2` configuration; [period outline and history](https://perencz.hu/f1/circuit/zolder/info/) corroborate the era. [Modern corner names](https://www.speedsport-magazine.com/circuits/belgium/zolder) are explicitly **not** presented as an official 1984 numbering list. [1982](https://www.formula1.com/en/results/1982/races/441/belgian-grand-prix/race-result) and [1984](https://www.formula1.com/en/results/1984/races/468/belgium/race-result) F1 results support the race moments.

## Media, attribution and licensing

- **No images were added in this batch.** The linked Driver61 PDF is marked © Driver61 Ltd; no permission to redistribute its diagram is assumed. Venue photos, racecourse photographs, F1 articles and event maps are referenced as external research, **not** copied or presented as freely licensed media.
- F1DB's pinned structured circuit/layout data is licensed **CC BY 4.0** and must retain its attribution; the already-imported circuit SVG assets are not re-licensed by this batch. A separately hosted historical SVG may have its own licence and author: verify the specific file page before any use.
- A link to an FIA/F1/venue map does **not** grant republication rights. Do not embed or screenshot a third-party diagram until its copyright holder and terms have been checked. The existing SVG outline alone does not provide numbered turn coordinates.
- Source keys in the candidate model are provenance references, **not independent approval**. Review each disputed name and period apex against a dated programme, onboard, race organiser archive or FIA/FISA plan. Do not promote `historical_numbering_unverified` to `independently_verified` by automation.

## Release blockers

1. Find period-appropriate numbered maps for 1962 Aintree, 1985 Kyalami, 1984 Dijon and 1984 Zolder, or document the exact historical turn convention used by F1DB.
2. Resolve provisional alias-to-number mapping, particularly the modern Zolder chicanes and the Dijon Villeroy/Parabolique subdivisions. Do **not** claim that a modern corner name existed in 1984 without a dated source.
3. Independently check EN/UK copy, confirm the publication digest and two distinct human sign-offs, then test actual browser rendering. Structural tests and GitHub CI are not editorial sign-off.

**Current disposition:** research-only candidate content, not published, no new image permissions granted.
