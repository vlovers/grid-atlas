# 2025 FIA turn guides — 2 November 2026 candidate batch

**Status:** research/candidate UI only. Do **not** publish, approve, or merge as a production editorial release based solely on these automated checks. The independent exact-edition approval flow in `circuit-release.ts` remains authoritative.

## Delivered in the existing PR #395

The directly imported `apps/web/src/components/editorial/circuit-corners-v3.json` now has **14 circuits / 223 individually numbered EN/UK corner sections**, compared with **6 circuits / 97** at the start of this batch. Eight new complete current-layout guides contributed **126 individual turns**:

| Circuit | F1DB layout | FIA numbering | Turns | Names / historical scope |
| --- | --- | --- | ---: | --- |
| Hungaroring | `hungaroring-3` | 2025 | 14 | **2026** official names; do not backdate |
| Zandvoort | `zandvoort-5` | 2025 | 14 | Official venue names, shared Scheivlak/Hans Ernst sections; unnamed T9/T10/T13 |
| Baku | `baku-1` | 2025 | 20 | Castle Turns 8–10, blind Turn 15; unnamed turns remain unnamed |
| Melbourne | `melbourne-2` | 2025 | 14 | **2022+** layout; former T9/T10 chicane removed |
| Mexico City | `mexico-city-3` | 2025 | 17 | Foro Sol and remaining Peraltada, not the historic full sweep |
| Barcelona-Catalunya | `catalunya-6` | 2025 | 14 | **2023+** chicane-free final sector |
| Montréal | `montreal-6` | 2025 | 14 | Turn 13/14 Wall of Champions; the wall is not an official turn name |
| Imola | `imola-3` | 2025 | 19 | Modern Tamburello/Villeneuve, Acque Minerali, Gresini Variante Alta, Rivazza |

The complete per-turn EN/UK text and its two source keys live **in the candidate UI JSON**, not in another research-only prose batch. The FIA map is the source for numbering, and the venue/F1 source is the starting point for historical names and driving context. `source_checked_ai` is not an independent fact approval. Where a named complex covers multiple FIA numbers, every number has its own original explanation but retains the shared complex name. Where no established name was found, `name: null` is intentional.

## Evidence and image-rights boundary

- **FIA maps:** external links in `sources[*-map]`, **not copied or rehosted**. The map PDFs carry Formula One World Championship Limited copyright notices. Linking them is not a licence to embed or redraw their copyrighted artwork.
- **Historical corner names:** linked F1.com editorial articles and Circuit Zandvoort's official corner directory; the 2026 Hungaroring renaming is expressly separated from the 2025 map's numbering. Source prose is paraphrased, not reproduced.
- **Local outline SVGs:** existing `apps/web/src/components/circuit-layout-manifest.json` attributes F1DB's pinned v2026.17.0 white-outline assets to **Jules Roy, CC-BY-4.0**. These pre-existing assets were not modified in this batch; their licences and attribution remain attached to the manifest. Do not infer that FIA/F1 photography is covered by the SVG licence.
- **Photographs:** none added. No claim of photo-rights clearance.
- **Diagram turn anchors:** none generated. `layout_id` links the historical layout identity; it does **not** establish coordinates for a visual numbered overlay. Those require independent placement review.

## Checks and remaining work

`tests/circuit-four-2025-fia-corner-ui-integration.test.mjs` checks 14 candidate guides and 223 numbers. New tests cover 79 turns across the first five circuits and 47 more across Barcelona, Montréal and Imola. Structural validation checked every guide's contiguous numbering, distinct EN/UK descriptions, source keys, existing SVG layout, and publication gate. GitHub CI results must be checked on the **final** PR head before merge.

There are **64 F1DB circuits without a current-layout turn guide in this candidate JSON** (Monaco and Spa are additionally inherited from their own sourced manuscript files, so the UI candidate model covers 16 distinct circuits overall). Many remaining circuits have multiple historical layouts, and should not receive today's numbering by default. For those, obtain the period map, race-year crosswalk and names before claiming a complete turn-by-turn guide. Independent EN/UK claim review and human release approval remain pending for every candidate.
