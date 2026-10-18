# Competitive landscape and product differentiation (19 October 2026)

Status: public-page research and product interpretation, **not** an exhaustive interactive usability audit. The specifically mentioned Formula1DB team-season URL was intentionally **not** opened. Claims below come from linked public pages, not from invented hands-on sessions.

## What competitors already do

| Product | Verified publicly described capabilities | What Grid Atlas should learn / not copy |
| --- | --- | --- |
| [F1DB](https://github.com/f1db/f1db) | Open-source historical dataset: drivers, constructors/chassis, engines, tyres, circuits, seasons, entrants, practice/qualifying/race results, standings; CSV/JSON releases. | Compete on the *experience of understanding* rather than raw completeness. Our pinned release is a data foundation, not a unique feature. |
| [Lap Ledger](https://lapledger.org/) | Search, drivers/constructors/cars, local-in-browser SQL, downloadable data, provenance levels, explicit disagreements and open gaps, digest-based citations. | Evidence and uncertainty are already a differentiator elsewhere. Never claim source transparency alone is unique; use it directly in explainable journeys. |
| [Pitwall](https://pitwalldata.net/en/acerca) / [statistics explorer](https://pitwalldata.net/explorador) | F1DB-backed archive, driver comparisons, charts, statistics explorer with filters and CSV export; stated policy of stopping publication on incomplete ingest. | Do not build a generic filter-and-table statistics explorer as the MVP. Borrow the import quality-gate principle. |
| [RacingHub](https://racinghub.net/) | Driver career arcs, racecraft heatmaps, pit-stop lab, qualifying breakdown, era-normalised comparisons. | Generic career charts and era comparison are not a unique wedge. Do not promise sophisticated derived metrics before historical methodology is audited. |
| [Racemate driver network](https://racemate.io/network/) | Whole-history teammate graph, strict same-race vs same-season association modes, shortest driver-chain path, time-oriented layout and explained scoring. | **A graph or shortest path is already done.** Differentiate with focus-first cross-entity exploration, temporal context, readable evidence, and beginner usability; do not infer teammates from same constructor-season alone. |
| [STATS F1](https://www.statsf1.com/en/carlos-sainz.aspx) | Deep historical per-driver statistics and breakdowns by season, chassis, engines, tyres and result/grid position; multiple languages. | Raw granularity is hard to surpass. Make historical terms understandable and relationships navigable. |
| [ChicaneF1](https://www.chicanef1.com/) | Wide entity coverage (entrants, engines, tyres, cars, sponsors), historical results and non-championship races. | Avoid claiming that unusual historical entities are unexplored. Preserve constructor/entrant distinctions and add richer entity types only when imported and validated. |
| [Motorsport Stats](https://motorsportstats.com/) | Broad motorsport results and analytics business/data service; individual F1 event statistics pages also available. | Not the direct focus-first history journey target; do not pursue breadth across championships. |
| [RaceOptiData](https://www.raceoptidata.com/F1_dashboard.html) | Historical dashboard and scoring-rule what-if simulations. | Alternate scoring is already a known product direction; historical championship rules require separate authoritative modeling. |
| [Dominus Machina](https://dominusmachina.com/) | Graphite-sketch-led visual archive and historical browsing. | A premium visual identity alone is not enough; visuals must drive comprehensible interaction. |
| [Race Archive](https://www.racearchive.net/) | History with seasons, champions, drivers, constructors, circuits, memories and games. | Discovery and playful entry points are not novel in isolation. |
| [Formula Stats](https://www.formula-stats.com/) | 3D race replays, learning content and recent-season archive. | Avoid telemetry/3D replays in first stable historical release. |

### Research limits

- “F1 Almanac” was not reliably resolved to a specific current official project in this research. Do not attribute capabilities without a verified page.
- Formula1DB the *website* is distinct from the F1DB open-source dataset. This audit relies on the F1DB project's repository for confirmed data scope and makes no claim to have inspected the specific Formula1DB page.
- Motorsport Stats' current homepage emphasizes B2B data; do not assume an accessible consumer feature set beyond the observed pages.
- Public descriptions are evidence of claimed features, not proof of UX quality, accuracy or performance. Counts and current-season facts vary by update cutoff, source and entity definition; do not compare counts naively.
- The research has not tested login-only features, mobile gestures, keyboard navigation, accessibility trees, load time or paid tiers.

## Product wedge: explainable time-scoped historical journeys

**Positioning:** “Follow a real historical connection, understand why it exists, and discover what changed in another season.” Not “the biggest F1 database,” “the first F1 graph,” or “the only source-backed archive.”

1. **Quick:** One entity, three defensible facts, a plain-language archive coverage note and a clear **Explore connections** action.
2. **Explore:** A *bounded* one-hop neighborhood centered on a canonical driver/constructor/race; selected year changes observed relationships without rewriting identity. Clicking an edge answers **what connects these entities, when, and from which imported records?** No hairball.
3. **Deep Dive:** The exact season/race/profile result and source release behind an edge; verified editorial lineage is a separate category from imported result associations.
4. **Discovery:** Two or three deterministic “continue from here” paths with an explicit reason (“This constructor recorded results with this driver in 1988”), not AI-invented biographies or opaque recommendations.
5. **Trust:** Unknown ≠ zero; result row ≠ official start; constructor ≠ entrant ≠ legal company; proposed lineage ≠ verified lineage. If no reviewed evidence exists, explain the gap without fabricating a connection.

This is a **combination and execution hypothesis**, not a claim that no competitor has any part of it. Validate against users once the vertical slice is working.

## Concrete 5-minute benchmark journey

For each available competitor and Grid Atlas, ask: “Start from a historic driver; find a constructor they actually recorded results for in a selected season; explain the relation; navigate to the constructor; change the season; return to the same context.”

Record:
- First meaningful fact visible within 15 seconds (manual observation).
- Number of actions until the relation's **meaning** and **year** are clear.
- Whether the connection is an observed result, season roster, entrant or editorial succession.
- Whether a specific source/release is visible and whether claims exceed its scope.
- Browser Back preserves context; narrow viewport and keyboard-only path remain usable.
- Unknown/missing results and empty verified lineage are honestly labeled.

Do not assign competitor scores before actually performing the same task on each site.

## Explicitly deferred

- Global force-directed teammate graph / shortest-path game (Racemate already does this).
- Full SQL analytics studio (Lap Ledger and Pitwall already cover this).
- 3D race replay, live timing, telemetry and AI narration (other tools already exist; unrelated to initial value).
- Unsourced team lineage, cross-era normalized driver rankings, historical championship recalculation without scoring-rule provenance.
- Unlicensed logos, photographs, quotes and F1 official branding.

## Sources checked

- F1DB repository: https://github.com/f1db/f1db
- Lap Ledger: https://lapledger.org/
- Pitwall: https://pitwalldata.net/en/acerca and https://pitwalldata.net/explorador
- RacingHub: https://racinghub.net/
- Racemate: https://racemate.io/network/
- STATS F1: https://www.statsf1.com/en/carlos-sainz.aspx
- ChicaneF1: https://www.chicanef1.com/
- Motorsport Stats: https://motorsportstats.com/
- RaceOptiData: https://www.raceoptidata.com/F1_dashboard.html
- Dominus Machina: https://dominusmachina.com/
- Race Archive: https://www.racearchive.net/
- Formula Stats: https://www.formula-stats.com/
