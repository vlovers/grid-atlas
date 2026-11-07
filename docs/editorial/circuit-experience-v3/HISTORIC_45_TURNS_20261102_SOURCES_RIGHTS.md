# Historic turn-guide production batch — 2 November 2026

**Status:** unpublished candidate content. Do not merge or release as independently approved. This is **not** a replacement for the two existing BATCH_01/BATCH_02 reading-note registers.

## Delivered to the actual candidate model

| Circuit | F1 layout ID | Period | New individual turn cards | Numbering basis |
| --- | --- | --- | ---: | --- |
| Brands Hatch | `brands-hatch-2` | 1986 | 9 | F1DB historical turn count, named Grand Prix sequence; exact period FIA-numbered map pending |
| Donington Park | `donington-1` | 1993 | 12 | Circuit owner: 12 turns; contemporary race layout; named guide groups the Esses |
| Estoril | `estoril-2` | 1995 (1994–1996 layout) | 13 | F1DB count and contemporary 1995 Autosport driver lap; exact period FIA numbering pending |
| Watkins Glen | `watkins-glen-3` | 1980 (1975–1980 layout) | 11 | F1DB count, historic Scheckter Chicane and Boot accounts; period FIA numbering pending |
| **New total** | | | **45** | **Historical mapping, not certified FIA turn-number positions** |

Also: **38 existing Monaco and Spa turns** now have separate focusable UI sections. Spa's repeated complex prose was rewritten into 19 distinct EN/UK explanations. Monaco already had 19 distinct EN/UK descriptions; they now render as 19 individual cards rather than collapsed complex cards.

Four bilingual biographies and eight source-linked race moments accompany the four new circuit guides.

## Period-sensitive corrections and evidence

- **Brands Hatch:** The 1986 route used **Dingle Dell**, not the later **Sheene Curve**. The latter replaced the old chicane in 2003. Sources: [2003 renaming report](https://www.abc.net.au/news/2003-03-18/brands-hatch-renames-curve-after-sheene/1818564), [circuit naming guide](https://oversteer48.com/brands-hatch-corner-names/), [1986 F1 result](https://www.formula1.com/en/results/1986/races/506/great-britain/race-result).
- **Donington:** The 1993 F1 race used the **Grand Prix** layout and Melbourne Loop, not the National shortcut. The owner lists 12 bends; an instructor's named guide lists 11 groups, because a two-part chicane is one named section. This batch assigns two distinct cards to the Esses but does not claim FIA-1993 certified number-to-apex coordinates. Sources: [circuit owner](https://www.donington-park.co.uk/about/circuit-layouts), [corner-by-corner driving guide](https://saloneevents.co.uk/how-to-drive-donington-circuit/), [1993 official race result](https://www.formula1.com/en/results/1993/races/592/europe/race-result), [F1 retrospective](https://www.formula1.com/en/latest/article/he-was-walking-on-water-sennas-magical-donington-lap-of-the-gods-remembered.2cYFK0Zr1J9z8fypFxnZRi).
- **Estoril:** The 1994–1996 F1DB layout has 13 turns; the 1984–1993 layout has 11. Contemporary [Autosport 21 September 1995, p.32](https://porschecarshistory.com/wp-content/old/lib/magazines/autosport/1995/AS21.09.95.pdf) includes Mark Blundell's firsthand lap description. The original magazine **expressly prohibits reproduction** without permission: only a link and original paraphrases are used, **no image reuse**. [1995 F1 classification](https://www.formula1.com/en/results/1995/races/633/portugal/race-result).
- **Watkins Glen:** The 1975–1980 Grand Prix layout included the **Scheckter Chicane in the Esses**, not the **Inner Loop** installed in 1992. Sources: [RacingCircuits history](https://www.racingcircuits.info/north-america/usa/watkins-glen.html), [F1 1980 result](https://www.formula1.com/en/results/1980/races/93/usa-east/race-result), [F1 1979 result](https://www.formula1.com/en/results/1979/races/421/usa-east/race-result).

## Release and rights

- All guides and race stories are **AI source-checked / independent editorial review pending**. No new release approvals were granted.
- **No new photographs or maps were copied or embedded.** External FIA, F1, magazine and track-guide URLs are citations only. No implied permission to reuse third-party maps, images, or F1 branding.
- Existing local F1DB circuit SVG attribution remains unchanged; no claim is made that third-party diagrams share its CC BY 4.0 licence.
- The corner UI now distinguishes a genuine `www.fia.com` map from a historical research reference, and uses the guide's own year rather than hardcoding 2025.
- Historical number-to-apex mapping must be reviewed against authenticated **period** numbered maps before release. The `numbering_basis` and per-corner status fields retain that limitation.

## Regression gates

`tests/circuit-two-historic-21-corners-and-inherited-38.test.mjs`, `tests/circuit-estoril-1995-thirteen-turns-period-sources.test.mjs`, `tests/circuit-watkins-glen-1980-eleven-turns.test.mjs`, and the updated `tests/circuit-experience-v3.test.mjs` enforce count, individual anchors, EN/UK, source keys, historical names and fail-closed publication.

**Remaining:** 78 total F1DB circuits minus 42 directly modelled circuit guides = **36 without a directly integrated full candidate turn guide**. Monaco and Spa are now separately rendered through the inherited candidate source. This is **not** 42 approved/published circuits.
