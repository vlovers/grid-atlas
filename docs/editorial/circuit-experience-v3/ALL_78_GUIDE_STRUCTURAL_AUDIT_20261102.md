# 78 circuit guides — structural audit, 2026-11-02

This audit measures repository coverage only. It does not certify facts, corner geometry, historical layouts, link availability, translations, or image rights.

- Circuit records: 78/78.
- Guide sections: 166.
- Records with fewer than three sections: 70.
- Sections missing EN/UK/source: 0.

A guide section can describe a race or a group of turns. These counts do not establish full corner-by-corner coverage.

| Circuit | Sections |
|---|---:|
| silverstone | 3 |
| monza | 3 |
| spa-francorchamps | 2 |
| suzuka | 3 |
| monaco | 4 |
| hungaroring | 4 |
| zandvoort | 2 |
| montreal | 2 |
| interlagos | 2 |
| bahrain | 2 |
| baku | 2 |
| austin | 2 |
| imola | 2 |
| jeddah | 2 |
| mexico-city | 2 |
| yas-marina | 2 |
| marina-bay | 2 |
| catalunya | 2 |
| spielberg | 2 |
| shanghai | 2 |
| istanbul | 2 |
| mugello | 2 |
| portimao | 2 |
| nurburgring | 2 |
| hockenheimring | 2 |
| aida | 2 |
| reims | 2 |
| rouen | 2 |
| buddh | 2 |
| porto | 2 |
| jerez | 2 |
| dallas | 2 |
| sirius | 2 |
| lusail | 2 |
| yeongam | 2 |
| bugatti | 2 |
| mosport | 2 |
| sebring | 2 |
| detroit | 2 |
| zeltweg | 2 |
| phoenix | 2 |
| pescara | 2 |
| montjuic | 2 |
| valencia | 2 |
| anderstorp | 2 |
| avus | 2 |
| fuji | 2 |
| dijon | 2 |
| miami | 2 |
| jarama | 2 |
| zolder | 2 |
| sepang | 2 |
| madring | 2 |
| estoril | 3 |
| kyalami | 2 |
| aintree | 2 |
| monsanto | 2 |
| ain-diab | 2 |
| adelaide | 2 |
| nivelles | 2 |
| pedralbes | 2 |
| riverside | 2 |
| melbourne | 2 |
| donington | 2 |
| las-vegas | 2 |
| long-beach | 2 |
| bremgarten | 2 |
| east-london | 2 |
| paul-ricard | 2 |
| magny-cours | 3 |
| jacarepagua | 2 |
| brands-hatch | 3 |
| watkins-glen | 2 |
| indianapolis | 2 |
| buenos-aires | 2 |
| mont-tremblant | 2 |
| caesars-palace | 2 |
| clermont-ferrand | 2 |

## Release gate

Before calling all circuits complete: review every historical claim and source; inventory every corner against period-correct layout maps; review EN/UK translations; approve 165 research scenes; clear media rights. This audit grants no approvals.


## Outstanding seven — explicit historical-numbering gate (2026-11-02)

The 69 guides integrated directly in `apps/web/src/components/editorial/circuit-corners-v3.json` contain 977 individual bilingual research entries at commit `964e69d8`. Two separate inherited guide bindings (Monaco, Spa) add 38 entries. Hence **71/78 candidate circuit guides**, **1015 candidate entries**, **7 circuits without integrated turn-by-turn guides**. Research coverage is not publication approval or historical apex validation. Recompute these counts after subsequent commits.

| Circuit ID | F1 era/layout | Existing research | Release-blocking evidence gap |
|---|---|---|---|
| `ain-diab` | 1958 / `ain-diab-1` | `REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json` (two bilingual geographic sections); F1DB records 18 turns | No authenticated 1958 per-apex numbered reference. Do not assign invented proper corner names. |
| `clermont-ferrand` | 1972 / `clermont-ferrand-1` | `REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json`; F1DB records 48 turns | A dated period map and the 48-turn F1DB count are not a validated 1:1 numbering crosswalk; other sources may count bends differently. |
| `dallas` | 1984 / `dallas-1` | `DALLAS_DETROIT_1982_1984_23_HISTORICAL_SECTIONS_20261102.json` | F1DB records 23 turns, while the research describes 13 distinct driving complexes. A complex is not an official numbered turn. |
| `detroit` | 1982 / `detroit-1` | `DALLAS_DETROIT_1982_1984_23_HISTORICAL_SECTIONS_20261102.json` | Need map-based period crosswalk; do not silently substitute another Detroit GP year or a present-day street grid. |
| `pescara` | 1957 / `pescara-1` | `PESCARA_PORTO_CAESARS_19_HISTORIC_ROUTE_SCENES_20261102.json` | Historical villages, roads, and route order do not establish individual certified turn numbers on the 1957 long circuit. |
| `porto` | 1958–1960 / `porto-1` | `PESCARA_PORTO_CAESARS_19_HISTORIC_ROUTE_SCENES_20261102.json` | Reconcile the circuit as raced in the relevant season; landmark names alone do not give a year-specific apex key. |
| `sebring` | 1959 / `sebring-1` | `SEBRING_1959_TEN_PERIOD_ROUTE_SECTIONS_20261102.json` (ten bilingual sections); F1DB records 17 turns | An original race report covers driving sections, but does not independently number every apex; modern Sebring numbers cannot be applied to 1959. |

### Required checks before closing each guide

1. Pin the year and exact F1DB layout ID; identify any variation between source map and F1 race route.
2. Match every proposed numbered apex to a period-correct, independently traceable map. If not possible, retain unnumbered descriptive route sections and `historical_numbering_unverified`; **never imply F1DB count proves an ordered FIA numbering key**.
3. Give independently authored, readable EN and UK explanations for each confirmed turn, with claim-level provenance. Keep unverified names `null`; comparative place names may be explained only as non-canonical landmarks.
4. Verify map/photo licence and attribution independently. Historical event flyers, period map PDFs and proprietary diagrams are external evidence links unless lawful reuse rights are established. Existing F1DB SVG attribution does not license other imagery.
5. Confirm the UI renders the correct historical period and clearly distinguishes numbered certified turns from provisional route-reading positions; test all source links, responsive layouts, translation coverage, and publication gate.
6. Require independent editorial review and completed CI for the exact PR HEAD. No release or merging while queued/failed.

**Current outcome:** the seven gaps are explicitly inventoried and research material linked, but **no additional integrated turn guides or approvals are claimed by this audit**.
