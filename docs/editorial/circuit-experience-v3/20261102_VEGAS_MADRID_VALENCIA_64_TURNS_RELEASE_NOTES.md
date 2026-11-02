# Las Vegas, Madring and Valencia: 64 individually numbered EN/UK corners

**2 November 2026 — Draft candidate data, independent review pending.** This batch extends the **existing** `apps/web/src/components/editorial/circuit-corners-v3.json` and `circuit-narratives-v3.json` in PR #395. It does not duplicate the four 20/20/20/18 historical reading-note packages.

| F1DB circuit ID | F1DB outline | Edition | Individual turns | Numbering and location evidence |
| --- | --- | --- | ---: | --- |
| `las-vegas` | `las-vegas-1` | 2025 | 17 | [FIA 2025 event circuit map](https://www.fia.com/system/files/decision-document/2025_las_vegas_grand_prix_-_event_notes_-_circuit_map_v2_pit_lane_drawing_emergency_map_exits_quarantine_zone_and_red_zones.pdf), [official Las Vegas GP turn guide](https://www.f1lasvegasgp.com/2025/07/the-las-vegas-strip-circuit-turn-by-turn-guide/) |
| `madring` | `madring-1` | 2026 | 22 | [FIA 2026 Spanish GP document index](https://www.fia.com/documents/circuit-maps), [Formula 1 circuit guide](https://www.formula1.com/en/racing/2026/spain), [2026 technical corner breakdown](https://sport.sky.it/formula-1/2026/09/08/f1-gp-spagna-madrid-madring-foto) |
| `valencia` | `valencia-1` | 2012 | 25 | [FIA 2012 event preview](https://www.fia.com/event-2012-european-grand-prix), [historic 25-corner lap description](https://en.wikipedia.org/wiki/Valencia_Street_Circuit), [F1DB-derived layout inventory](https://lapledger.org/circuits/valencia) |

The three guides contain **64 distinct numbered sections**, each with original English and Ukrainian explanation, source keys, layout ID and dated numbering. Madring has five sourced proper corner names: T3 Curva de Hortaleza, T8 El Búnker, T12 La Monumental, T18 Curva Norte and T22 El Parque. Other turns have `name: null` where a verified individual proper name is unavailable; **a turn number is not itself a proper name**.

Three bilingual biographies and six source-linked historical moments were also added: Las Vegas 2023/2025, Madrid 2026 qualifying/race, Valencia 2011/2012. The 2025 Vegas post-race McLaren disqualifications are included in the **final** race result; Madrid's winner-to-second gap (4.351s) is not confused with second-to-third (0.738s). Valencia's 2011 record shows 24 classified starters, while Alonso won from eleventh in 2012.

## Review boundaries

- **Las Vegas** is the modern Strip circuit, not the 1981–1982 Caesars Palace venue. **Madring** is the 2026 22-turn layout, not the obsolete 2024 proposed 20-turn plan or the older Jarama circuit. **Valencia** is the 2008–2012 harbour circuit, not Circuit Ricardo Tormo.
- The Madrid FIA URL currently points to the official **document index**, not a pinned exact PDF. An editor must retrieve the 10 September 2026 Doc 6 map and compare the numbered geometry before publication. The 22-turn count is separately supported by F1's current circuit guide and dated 2026 coverage.
- For Valencia, the FIA 2012 preview establishes the event and broad track characteristics; the detailed 1–25 sequence is supported by period-derived and secondary lap descriptions rather than an individually inspected FIA turn map. Turns 18–24 particularly require a higher-resolution dated map and editorial fact check. Do not describe the whole guide as FIA-map-verified.
- These are **candidate** explanations (`source_checked_ai`), not independent fact review, release receipts or public approval. `review_status: independent_review_pending` and the existing release gate remain unchanged.
- **No images or FIA/F1 maps have been copied, embedded, redrawn or relicensed.** External URLs are evidence, not reuse permission. Existing F1DB outline SVGs remain unchanged and attributed to Jules Roy under CC BY 4.0; that license does not cover Formula 1 photographs, branding, third-party articles or FIA maps. No coordinate overlay was generated.
- Local browser and database integration tests were not executed in this environment; CI on the PR head is the verification gate. The new `tests/circuit-three-2025-2026-2012-64-numbered-turns.test.mjs` checks numbering, layout identity, distinct bilingual copy, sources, names and six moments.

**Next priority:** add individual era-specific guides for other archived venues using period FIA maps and verified circuit sources; no publication or merge until editorial approval and green CI.
