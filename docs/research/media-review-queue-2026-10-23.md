# Media review queue — source-specific, no automatic publication

**Date:** 2026-10-23. Derived from repository candidate and identity registries; no new license verification or file download is claimed. This queue is actionable **research**, not a grant of rights. Published photographic registry is empty.

## Existing exact candidate triage

| Priority | Candidate ID / source | Observed license metadata | Required action / risk | Decision |
| --- | --- | --- | --- | --- |
| P0 | [Senna 1989 Belgian GP podium (cropped)](https://commons.wikimedia.org/wiki/File:Ayrton_Senna_1989_Belgian_GP_podium_(cropped).jpg), `ayrton-senna-commons-pilot` | CC BY 2.0, creator recorded as madagascarica | Reopen [original Flickr](https://www.flickr.com/photos/madagascarica/35116366790/); verify photographer/derivative crop chain, exact depiction, license revision and required attribution. Not suitable as a 1985 race photo. | **Pending** |
| P0 | [Lewis Hamilton (27333186713)](https://commons.wikimedia.org/wiki/File:Lewis_Hamilton_(27333186713).jpg), `lewis-hamilton-commons-pilot` | CC BY 2.0, creator recorded as 35mmMan | Verify [original Flickr](https://www.flickr.com/photos/35mmman/27333186713/), original photo date/subject, image rights, exact credit, local bytes and bilingual caption. | **Pending** |
| P1 | [J. M. Fangio 1957](https://commons.wikimedia.org/wiki/File:J.M._Fangio_1957.jpg), `juan-manuel-fangio-commons-pilot` | CC BY-SA 3.0 | **High-risk provenance**: derivative credits Spin2Win but parent description names Carlos Alberto Navarro. Identify original photographer and lawful licensing chain; do not publish while unresolved. Small 190×352 resolution unsuitable for large hero. | **Blocked pending provenance** |
| P1 | `monaco-4-f1db-pilot` ([pinned SVG](https://github.com/f1db/f1db/blob/3c980fd510ef97ea0de577aff7ecee193869de65/src/assets/circuits/white/monaco-4.svg)) | F1DB attribution to Jules Roy, CC BY 4.0 indicated | Verify source README/LICENSE discrepancy, exact race ID 394 and attribution. Existing separate local SVG lane already covers layouts; **do not duplicate it as a photograph**. | **Separate circuit-art lane** |
| P1 | `monaco-6-f1db-pilot` ([pinned SVG](https://github.com/f1db/f1db/blob/3c980fd510ef97ea0de577aff7ecee193869de65/src/assets/circuits/white/monaco-6.svg)) | Same | Verify exact race ID 941 and license discrepancy, preserve exact year/race attribution. | **Separate circuit-art lane** |

These are metadata as recorded in `docs/media/candidates.json` and `docs/media/commons-pilot.metadata.json`; no independent current-day license assertion is made.

## New collection priorities (discovery tasks, not identified assets)

| Era | Target subject | Needed visual | Identity check |
| --- | --- | --- | --- |
| 1950s | Fangio / contemporary constructor | High-quality period portrait and period-correct car | Photographer, car model and race/year |
| 1960s | Representative driver + constructor | Race-day photography and car | Avoid treating later museum restorations as race-day originals |
| 1970s | Lotus/Ferrari-era cars | Period or explicitly labeled museum photography | Constructor, car variant, year, livery |
| 1980s | Senna/Prost, Lotus/McLaren | Portraits and season-correct cars | 1985 vs 1988/1989 distinction |
| 1990s | Representative drivers/constructors | Race-day car + portrait | Date, championship season and model |
| 2000s | Ferrari/McLaren and contemporary drivers | Cars and portraits | Avoid modern replica confusion |
| 2010s | Hamilton and representative teams | Portrait + verified race car | Source, event, season |
| 2020s | Contemporary drivers/constructors | Recent photography with reuse rights | Copyright and source revision |
| Cross-era | Monaco, Monza, Silverstone and other documented circuits | Real venue photography | Venue, date and historic/current configuration |

Do not claim 30–50 files have been found until exact file pages, license revisions and source identity are recorded. Search by canonical subject and known season first; store candidate evidence under the **existing** registry, never in an invented parallel schema.

## Review worksheet per photo

- **Identity:** F1DB external subject ID; depicted person/car/venue; year; how the identification was verified; uncertainties.
- **Source:** original file page, upstream original if derivative, exact revision, photographer vs uploader, capture date if documented.
- **Rights:** license identifier/version/URL, copyright owner evidence, permitted transformations, ShareAlike implications, special notices/trademarks, intended site use.
- **Asset:** bytes SHA-256, actual MIME/dimensions, modifications, local path only after clearance; no remote hotlink by default.
- **Text:** independent UK/EN alt text and context-specific caption, credit, source/license links and explicit uncertainty if needed.
- **Human sign-off:** reviewer handle, date, rationale and payload fingerprint. Never manufacture reviewer identity or mark as verified automatically.

## Photo display rules

1. **Hero:** use only if correct identity, sufficient resolution, appropriate context and publication gate all pass.
2. **Archive tile:** may show a verified photo from a different year **only with the actual year visible**; never imply that it illustrates a specific event it does not.
3. **Car tile:** distinguish constructor from specific car model; if model unverified, do not label model or claim race-year match.
4. **Circuit tile:** modern photo may represent the venue, not a historical configuration; separate from exact-layout SVG.
5. **No approved photo:** retain elegant typographic/diagram fallback with no fake “photo coming soon” request.
6. **AI-generated:** if used later, label UK `AI-реконструкція · Не архівна фотографія` / EN `AI reconstruction · Not an archival photograph`; keep separate from documentary media.

## Batch approval workflow

A reviewer should first resolve the two promising CC BY portrait candidates, then Fangio's attribution chain, then add **at least one real constructor/car** and **one circuit photograph** candidate. For each asset, independent human review is required before copying bytes into `apps/web/public/media/` and entering `publication.json`. Run `pnpm audit:media --as-of YYYY-MM-DD` and the existing browser checks; no automatic “approve all Commons” script.
