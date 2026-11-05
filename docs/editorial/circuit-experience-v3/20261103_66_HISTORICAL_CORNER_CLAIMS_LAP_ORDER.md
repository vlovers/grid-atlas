# Historical corner claim handoff — 3 November 2026

**Status: research only. No independent review, period FIA apex map, release receipt or media-rights approval.**

This change does not create 66 verified corners. It makes **66 already researched bilingual EN/UK claims** inspectable in one fail-closed editorial queue, and gives **53 period-bend studies** an unambiguous geographical lap reading order. All records retain their original source insertion order for provenance.

| 1957–1984 historical circuit | Individually described period bend studies | Named historical features | Period FIA apex crosswalk |
| --- | ---: | ---: | --- |
| Ain-Diab (1958) | 1 | 0 | Not authenticated |
| Clermont-Ferrand / Charade (1972) | 0 | 11 | Not authenticated |
| Dallas (1984) | 16 | 0 | Not authenticated |
| Detroit (1982) | 17 | 0 | Not authenticated |
| Pescara (1957) | 4 (including 2 complexes) | 2 | Not authenticated |
| Porto (1958–1960) | 7 | 0 | Not authenticated |
| Sebring (1959) | 8 | 0 | Not authenticated |
| **Total** | **53** | **13** | **0 authenticated** |

## Editorial correction: source insertion order is not lap order

Earlier batches appended evidence as it was located. As a result, the first Dallas record described the **final corner before the finish**. In Pescara, the pre-pit complex appeared fourth; in Porto, a second opening left appeared after a later street section. Those are source research sequences, **not** correct route-reading sequences.

The non-public `candidateUnnumberedPeriodBendsInLapOrder` projection sorts by each record's existing `parent_route_section_order` and then its original `reading_order`. It retains `source_research_order` and adds a separate `lap_study_order` with EN/UK labels explicitly saying **not an FIA turn number**. No source JSON was rewritten and no new apex positions or corner names were inferred.

Examples: Dallas route-study order now begins with the paddock-side opening right and ends with the previously first-researched final corner; Pescara's pre-pit complex comes before the westward departure; Porto's two opening features stay together. A source's descriptive order is **not** proof of the exact numbered FIA geometry.

## Review queue and required adjudication

`candidateHistoricalCornerReviewQueue` is a read-only derived projection of the 53 period studies and 13 named features. Every record has a stable claim ID, pinned historical layout ID, EN/UK explanation, geometry kind, source URL roles, and explicit false values for geometric anchoring, numbered-apex verification, media rights and publication. The queue does not feed the public corner-guide digest.

To promote any item, a separate editor must compare a **dated period layout** to the actual feature, resolve the turn-to-apex correspondence and handedness, review both language claims, document the exact source locator, and separately clear any media. Official race-result tables verify classification, not corner geography.

## Evidence and image rights

- **Ain-Diab 1958:** [Motor Sport historical reconstruction](https://www.motorsportmagazine.com/archive/article/october-2026/25/ain-diab-the-road-circuit-that-hosted-mosss-last-gasp-1958-title-bid/) describes the 18-corner public-road circuit; it does **not** number 18 apexes on a certified period map.
- **Pescara 1957:** [Denis Jenkinson's race report](https://www.motorsportmagazine.com/archive/article/september-1957/16/xxv-gran-premio-pescara/) describes the mountain villages, coastal return, and bends before the pits. It does not enumerate all apexes.
- **Sebring 1959:** [Motor Sport's contemporary race report](https://www.motorsportmagazine.com/archive/article/january-1960/16/the-first-grand-prix-of-the-united-states/) gives an unusually detailed sequence of runway and road bends, but no authenticated FIA turn numbering.
- **Clermont-Ferrand:** [Circuit de Charade's venue history](https://www.charade.fr/galerie-photos/charade-dans-le-retro/) is evidence for local historical names, not a numbered 1972 FIA chart.
- **Dallas / Detroit / Porto:** the already linked period Motor Sport reports and historical layout references are retained as source-role-specific research inputs, not approvals.

**Media:** no third-party maps, period reports, photographs, screenshots or FIA diagrams were copied into the repository by this batch. Existing F1DB layout outlines keep their Jules Roy CC BY 4.0 attribution. External links do not grant reuse rights; the rights flags remain false.

## Deterministic verification

The new regression suite checks all **53** bend records, all **66** claim IDs, complete bilingual copy, chronological parent sections, preservation of original research IDs, source roles and the fail-closed publication boundary. GitHub Actions on the **exact latest SHA** remains the authoritative CI result.

**Coverage accounting is unchanged:** 71/78 candidate numbered guides and 1,015 candidate study positions in the separate corner model; seven historical circuits still lack complete authenticated period numbered guides. This change adds **0 new independently verified FIA-numbered corners**, **0 new published guides** and **0 media licenses**.
