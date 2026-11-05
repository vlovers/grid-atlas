# Twenty-circuit era-identity QA handoff — 2026-11-05

**Scope:** read-only cross-check of 20 research entries in [PR #411](https://github.com/vlovers/grid-atlas/pull/411), exact commit `de70e10e227dbda33b9537f0dbb31ccdc468700b`, against pinned F1DB v2026.17.0 identifiers. Baseline `main` `392683c3af21587a858f2e1933ad1a20b81e79e2`. This is a review worklist, **not** independent historical validation, media approval, geometry reconstruction, or a public article. No source documents were independently authenticated during this pass. Research files are not merged into main.

**Publication controls:** `human_approval=false`; `publication_allowed=false`. 20 circuit entries, 20 SVG proposals, 6 photo candidates; 0 approved images, 0 independent rights clearances. The recorded circuit/layout/race bindings are archival identity assertions only. Do not infer numbered corners, survey-grade outlines, contemporary track features, or an F1-event photograph from them.

| # | F1DB circuit ID | Reference race year | Archive layout ID | Media evidence | Specific review before publication |
| ---: | --- | ---: | --- | --- | --- |
| 1 | `monaco` | 2022 | `monaco-6` | photo 2022 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: venue and capture year are not F1 event evidence |
| 2 | `silverstone` | 2019 | `silverstone-8` | photo 2019 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: venue and capture year are not F1 event evidence |
| 3 | `monza` | 2025 | `monza-7` | SVG only | Confirm event-year layout against dated race evidence; identifier alone is not period geometry |
| 4 | `suzuka` | 2018 | `suzuka-2` | photo 2018 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: Capture2018-08-26 is venue context, not evidence of the2018 F1 race or numbered geometry. |
| 5 | `spa-francorchamps` | 2025 | `spa-francorchamps-4` | photo 2005 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: Photo dated2005; selected2025 layout must not be inferred from this image. |
| 6 | `interlagos` | 2025 | `interlagos-2` | SVG only | Confirm event-year layout against dated race evidence; identifier alone is not period geometry |
| 7 | `montreal` | 2017 | `montreal-6` | photo 2017 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: venue and capture year are not F1 event evidence |
| 8 | `bahrain` | 2025 | `bahrain-1` | photo 2021 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: Creator field United Autosports conflicts with EXIF Author/Copyright JEP; context is2021 WEC, not2025 F1. |
| 9 | `brands-hatch` | 1986 | `brands-hatch-2` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 10 | `donington` | 1993 | `donington-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 11 | `bugatti` | 1967 | `bugatti-1` | SVG only | Resolve event-vs-layout turns and length conflict before period claims |
| 12 | `mont-tremblant` | 1968 | `mont-tremblant-1` | SVG only | Find 1968/1970 period plan; 2001 comparison is not evidence |
| 13 | `aida` | 1995 | `aida-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 14 | `ain-diab` | 1958 | `ain-diab-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 15 | `clermont-ferrand` | 1972 | `clermont-ferrand-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 16 | `dallas` | 1984 | `dallas-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 17 | `detroit` | 1982 | `detroit-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 18 | `pescara` | 1957 | `pescara-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 19 | `porto` | 1960 | `porto-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 20 | `sebring` | 1959 | `sebring-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |

## Required evidence and QA workflow

1. **Archive identity:** independently check the exact race ID, year, circuit ID and layout ID against the pinned release, retaining raw event/layout discrepancies; never overwrite one observation with another.
2. **Period geometry:** use a dated race programme, contemporary organizer/FIA circuit plan or independently reliable period report for that year; a modern plan or archive SVG does not prove historical corner positions or numbering. Mark unavailable evidence as unavailable.
3. **Photo context:** the six photos are *venue-only candidates*. Inspect exact Commons file-page revision, original author/EXIF conflicts, capture date and rights chain independently. Never claim a photo shows the selected Grand Prix merely because the year matches.
4. **Bilingual review:** review EN and UK captions separately for implied geometry, era, event, licensing, and confidence. A translated assertion is not independent corroboration.
5. **Application safety:** verify no candidate URL, caption or research note appears in production HTML, RSC payload, client bundles or metadata. The isolated loopback preview in PR #411 is not a public production route.
6. **Revocation:** test withdrawal, stale fingerprint and incorrect circuit/race/layout context with memory-only synthetic approvals; never write synthetic approvals to `publication.json`.
7. **Human handoff:** capture dated primary/independent evidence and an explicit reviewer decision for each claim and each media asset. Keep all publication switches false until actual authorized approval.

## Known conflicts from the source observations (not independently resolved)

- **Bugatti 1967:** event record 8 turns / 4.422 km versus layout attribute 14 turns / 4.185 km. These must remain separate claims.
- **Mont-Tremblant 1968:** a 2001 comparison cannot establish 1968/1970 geometry.
- **Spa-Francorchamps:** photo captured in 2005, selected archive layout is 2025; not proof of the 2025 event.
- **Suzuka:** 2018-08-26 venue photo is not proof of the 2018 F1 race or numbered turns.
- **Bahrain:** source creator United Autosports conflicts with EXIF author/copyright JEP; photo is 2021 WEC context, not 2025 F1.

**Provenance:** [research intake](https://github.com/vlovers/grid-atlas/blob/de70e10e227dbda33b9537f0dbb31ccdc468700b/docs/media/circuit-intake-410/intake.json), [source observations](https://github.com/vlovers/grid-atlas/blob/de70e10e227dbda33b9537f0dbb31ccdc468700b/docs/media/circuit-intake-410/source-observations.json), [20-circuit report](https://github.com/vlovers/grid-atlas/blob/de70e10e227dbda33b9537f0dbb31ccdc468700b/docs/media/circuit-intake-410/REPORT.md). No additional source licenses or permissions are asserted here.
