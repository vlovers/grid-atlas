# Circuit vertical — reader-first completion audit (25 October 2026)

## What is actually built

- Pinned F1DB v2026.17.0: 78 circuit identities, historical event/results navigation, 160 historical circuit SVG layouts across different configurations. An archive identity is not evidence that the same physical layout persisted.
- Every circuit page in this PR now gets a guided visitor introduction, using the actual earliest observed event, linked driver and available layouts. Avoids claiming the first archived F1 event was the circuit's first race.
- First 25 identities have bilingual source-linked editorial anecdotes: five with two moments each and twenty with one. **This does not equal 25 full-feature narrative dossiers**; independent claim-by-claim editorial approval is pending and the UI says so.
- Media publication registry is empty for public photographs. No historic photograph should be inferred from approved SVGs.

## Gap audit, ranked by actual visitor value

| Layer | Current | Complete when |
| --- | --- | --- |
| Immediate identity | Page name, location identity and archive information | One engaging, concise EN/UK proposition of why the circuit matters, historically grounded for *all 78* |
| Beginner explanation | New newcomer journey in this PR, grounded in recorded archive | Tested on all 78 circuits with screen reader / mobile and accurate empty states |
| Historical writing | 25/78 have a short narrative, 53 missing | 78/78 have individually researched, different EN/UK histories with claim-level evidence |
| Depth | 5 circuits have 2 moments; 20 have 1 | Every circuit has 3–5 genuinely distinctive verified moments **where source evidence exists**; do not pad sparse circuits |
| Visuals | Historic SVG configurations and existing circuit panels | Selectable historical visual matched to the correct event/layout; media rights/provenance visible |
| Photography | 0 approved public photo assets in publication registry | Independently cleared original image, attribution and contextual era; no copyrighted external F1 reuse |
| Explore paths | Events, winners, seasons, lineages, layouts | Visible 3-click journey for a first-time visitor; avoid racing record tables as the first thing they see |
| Trust | F1DB archival provenance, AI-reviewed disclosure and official sources on 25 stories | Every editorial statement with an exact source locator, broken link audit, translation check, distinction between scheduled and completed events |
| Release | PR #298 not on main | Green full CI, browser approval for EN/UK, merge into main and direct local verification |

## Prioritized coherent releases

**1. Circuit Stories Launch / current PR #298:** source fixes, AI reviewed labels, responsive newcomer guide and correct positioning before technical sections. Target 25 narrative subjects plus 78 first-time-reader guides, not a dummy story for every circuit. Merge only after full current-head CI.

**2. Circuit Narrative Completion:** 53 missing personalities with source-backed bilingual histories; deepen first 25 so that all 78 have reason-to-care, characteristic and concise era-shaping moments. Build a coverage matrix from F1DB IDs; use AI-review transparency for this lane without inventing human signatures. Prioritize exact years, names, results and independent claims.

**3. Historical Media Release:** match layout artwork to periods and add only rights-cleared photography through official media registry. Dedicated browser visual acceptance and media attribution gates.

## Editorial format for every circuit

1. **Why it matters (30–60 words):** distinct hook, track character, not race counts.
2. **How racing feels here:** venue-specific track geography, corners and constraints only when sourced.
3. **Three historical moments:** early landmark, turning point, recent/late legacy *where evidence exists*.
4. **Then vs now:** actual historical configurations, with recorded differences and provenance.
5. **Follow the story:** connected driver, constructor and race result, with full archival statistics lower down.
6. **Evidence/AI review:** claim-level source links and honest publication labels, no invented primary evidence.

A beginner should understand each component without knowing what F1DB, canonical IDs or an archive row are. Historical records remain available for curious specialists, but not the lead copy.
