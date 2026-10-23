# Cross-era motorsport media research brief

Research handoff for an independent curator. This document lists **discovery entry points**, not verified images. No external file was downloaded or approved in preparing this brief.

## Authoritative discovery entry points

- [Wikimedia Commons Formula One](https://commons.wikimedia.org/wiki/Category:Formula_One) — starting taxonomy; inspect individual File pages.
- [Commons Formula One cars](https://commons.wikimedia.org/wiki/Category:Formula_One_cars) — navigate by constructor/model/year.
- [Commons Formula One drivers](https://commons.wikimedia.org/wiki/Category:Formula_One_drivers) — locate portraits; distinguish archive and modern photos.
- [Commons Formula One circuits](https://commons.wikimedia.org/wiki/Category:Formula_One_circuits) — venue photographs; exact layouts are separate.
- [Wikimedia Commons licensing](https://commons.wikimedia.org/wiki/Commons:Licensing) — individual file conditions, public domain and jurisdictional nuances.
- [Creative Commons BY 4.0](https://creativecommons.org/licenses/by/4.0/) and [BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) — attribution and ShareAlike terms; don't assume all images use these versions.
- [F1DB pinned historical SVG provenance](../media/historical-circuit-svg-provenance.md) — existing geometry and attribution; not photographic coverage.

## Concrete subject and era search briefs

Each line describes what to find, **not a confirmed licensed file**.

| Era | Driver | Constructor/car | Circuit/venue | Editorial risk |
| --- | --- | --- | --- | --- |
| 1950–1959 | Juan Manuel Fangio | Mercedes W196 / Maserati 250F | Monaco / Nürburgring | Historical photographer and copyright term, reconstructed museum cars |
| 1960–1969 | Jim Clark | Lotus 25 / Lotus 49 | Monza / Silverstone | Car variant and season mismatch |
| 1970–1979 | Niki Lauda | Ferrari 312T family / Lotus 79 | Monaco / Monza | Period vs restoration photo |
| 1980–1989 | Ayrton Senna, Alain Prost | Lotus 97T / McLaren MP4/4 | Estoril / Monaco | 1985 vs 1988 car/year, photographer rights |
| 1990–1999 | Michael Schumacher | Benetton B194 / Ferrari F310 | Spa / Suzuka | Constructor identity and model-year accuracy |
| 2000–2009 | Fernando Alonso | Renault R25 / Ferrari F2004 | Barcelona / Monza | Exact model and season, logo/trademark context |
| 2010–2019 | Lewis Hamilton | Mercedes W05 / Mercedes W10 | Silverstone / Spa | Attribution and date; modern copyrighted photos |
| 2020–2026 | Max Verstappen | Red Bull RB19 | Zandvoort / Suzuka | Recent rights, model-year, current venue photo |

**Model names are search terms**, not claims that a particular candidate depicts that model. Verify each result against source and era. The source photograph's context determines the caption; never force an image into a preselected season.

## Source review workflow (per discovered file)

1. Open exact Commons `File:` page and inspect `Special:Redirect/file` metadata, uploader/creator, revisions and upstream original.
2. Record file page revision, file SHA-1, original source and any crops/derivatives; resolve contradictory attribution.
3. Check exact license and allowed modifications, including whether the license applies to photo **bytes** rather than just metadata. A Commons license tag is a starting claim, not legal clearance.
4. Identify person, car model, constructor, year and venue from reliable evidence; mark uncertainty rather than guess.
5. Record candidate in the existing `docs/media/candidates.json` format with nulls for unknown values, and extend pinned identities only with checksum-backed source records.
6. Require an independent human rights/identity review before any delivery path, bytes or `publication.json` record is added.

## Prioritized first publication batch

Aim for a **balanced approved** set, not a large unverified scrape:
- Three portraits (Senna, Fangio, Hamilton), but only where provenance is resolved; Fangio's existing crop remains blocked.
- At least two constructor/car photos from different decades with verified models and context.
- At least two circuit venue photos; use the existing SVGs for historical configuration geometry.
- A representative 1970s and 1990s photograph to avoid a media library that only covers 1980s and current F1.

There are **no confirmed new image candidates** in this brief. The existing three Commons portrait candidates remain research-only; the two Monaco diagram candidates remain in the separate circuit artwork lane. No image has been approved or published.

## Visual consistency without falsifying history

Use a consistent aspect-ratio and frame system, captions, photo-year badges and source/author credits. Keep actual period photography's natural visual character; do not colorize black-and-white archival imagery without documenting that transformation. A photograph of a modern restored car must say so. Don't use AI reconstructions as replacements for an undocumented specific race moment.
