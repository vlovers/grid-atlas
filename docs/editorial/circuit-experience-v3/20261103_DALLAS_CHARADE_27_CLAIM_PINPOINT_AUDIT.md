# Dallas 1984 / Charade 1972 — 27-claim source pinpoint audit (3 November 2026)

**Research-only handoff. Not a certified turn-number guide, independent review, media clearance, release receipt or public publication.**

## Dallas Fair Park, Grand Prix layout 1984 — 16 study bends

The historical [RacingCircuits 1984 venue account](https://www.racingcircuits.info/north-america/usa/dallas-fair-park.html) describes **12 main corners plus several chicanes**, not an authenticated 16-turn FIA chart. The 16 records below are individually written *route-study descriptions* inferred from the period layout; the 1988 Trans-Am course is a different, shorter layout. The [contemporary Motor Sport race report](https://www.motorsportmagazine.com/archive/article/august-1984/22/dallas-grand-prix/) directly locates **Mansell's final-corner incident**, but does not provide bend-specific proof for the other 15 study slots. [Formula 1's official 1984 result](https://www.formula1.com/en/results/1984/races/474/dallas/race-result) verifies the race/classification, not the route geometry.

| Original research order | EN study label | Evidence grade |
| ---: | --- | --- |
| 1 | Final corner before the Dallas finish line | Contemporary report: final bend, **not** apex number |
| 2 | Paddock-side opening right | Visual reconstruction; **no** individual pinpoint |
| 3 | Cotton Bowl approach left | Visual reconstruction; **no** individual pinpoint |
| 4 | Sharper left onto the fairground avenue | Visual reconstruction; **no** individual pinpoint |
| 5 | Right into the temporary inner section | Visual reconstruction; **no** individual pinpoint |
| 6 | Tightening left-hand arc | Visual reconstruction; **no** individual pinpoint |
| 7 | Square right after the tightening arc | Visual reconstruction; **no** individual pinpoint |
| 8 | Inner-section left hairpin | Visual reconstruction; **no** individual pinpoint |
| 9 | Right entry to the parking-area jog | Visual reconstruction; **no** individual pinpoint |
| 10 | Left exit from the parking-area jog | Visual reconstruction; **no** individual pinpoint |
| 11 | Left entry to the return chicane | Visual reconstruction; **no** individual pinpoint |
| 12 | Right exit from the return chicane | Visual reconstruction; **no** individual pinpoint |
| 13 | Faster double-apex left | Visual reconstruction; **no** individual pinpoint |
| 14 | Right entry to the final parking chicane | Visual reconstruction; **no** individual pinpoint |
| 15 | Left exit from the final parking chicane | Visual reconstruction; **no** individual pinpoint |
| 16 | Broad left before the closing complex | Visual reconstruction; **no** individual pinpoint |

**Outstanding for all 16:** a dated, independently authenticated 1984 FIA numbered chart; explicit mapping of each directional change to a period apex; independent review of EN/UK prose and individual source locators. The final-corner report supports a historical bend **only**, not its official number. The other 15 records now have bilingual `source_locator_gap` instructions rather than invented report quotations or numbered map citations. Source insertion order remains separate from lap-study order.

## Clermont-Ferrand / Charade, 8.055 km old course — 11 named features

The operator's [Charade historical archive](https://www.charade.fr/galerie-photos/charade-dans-le-retro/) gives a specific old-lap name sequence in **#23, “Long comme… une belle histoire”**. Additional venue sections locate Ferme (#46), Petit Pont (#16), and the Rosier namesake (#40). These are operator-attested *names/sections*, not individual FIA-numbered 1972 apexes. Some names refer to complexes or sectors, not a single bend.

| Feature | Venue archive section(s) | Feature geometry |
| --- | --- | --- |
| Manson | #23 | single_bend |
| Gravenoire | #23, #26 | route_sector |
| Belvédère | #23 | named_feature_unresolved |
| Jumeaux | #23, #26 | multi_bend_complex |
| Carrière | #23 | named_feature_unresolved |
| Champeaux | #23 | route_sector |
| Ferme | #46, #23 | multi_bend_complex |
| Petit Pont | #16, #23 | single_bend |
| Marlboro hairpin | #23 | single_bend |
| Thèdes | #23 | multi_bend_complex |
| Rosier | #40, #23 | single_bend |

**Source correction:** the earlier Rosier EN/UK description said the venue did not explicitly establish the namesake. Section **#40** does: it explains Louis Rosier's involvement in proposing the course and explicitly says the bend leading to the finish bears his name. Both languages and the `name_origin` field now reflect that evidence. This does not validate a 1972 FIA number.

## Source and media controls

- Contemporary race prose, historical circuit diagrams, venue naming histories and official results have **different evidentiary roles**. A report describing the last corner cannot validate the other 15 bends.
- Charade #23 describes **51 historic directional changes** on the 8.055 km circuit; its modern short layout has a different count and geometry. The 11 named features must not be mistaken for 11 verified individual FIA turns.
- No FIA map, RacingCircuits map, venue photograph, period magazine image, screenshot or other third-party artwork was copied. All are external links; no reuse license has been granted. Existing F1DB/Jules Roy CC BY 4.0 SVG attribution remains unchanged.
- The derived editorial queue now carries the 11 Charade source locators, one report-specific Dallas locator, and 15 explicit bilingual missing-locator records. All 27 claims remain `numbered_apex_verified: false`, `publication_allowed: false`.

## Coverage accounting

This batch improves **27 existing claims** (16 Dallas + 11 Charade) and corrects one historical namesake. It adds **0 authenticated FIA turn numbers** and **0 published guides**. The wider research model still has **71/78 candidate circuit guides and 1,015 candidate turn-study positions**; seven historic circuits still lack complete independently authenticated numbered guides. The source-pinpoint gap in the 53 period-bend records falls from **16 to 15**, because only the Dallas final corner gained a defensible report locator. The 11 named Charade features now have venue-section locators; the two Pescara names still require individual pinpoint review.

Run `node --test tests/circuit-66-source-role-and-numbering-evidence-gate-20261103.test.mjs tests/circuit-dallas-charade-pinpoint-evidence-20261103.test.mjs` under the repository's Node 24 environment. Full GitHub Actions on the **exact latest head** remain authoritative; no merge/publication is authorized by this research audit.
