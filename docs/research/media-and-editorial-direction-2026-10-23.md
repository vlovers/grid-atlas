# Grid Atlas — parallel encyclopedia media and UX research (2026-10-23)

Research-only deliverable. The active Codex task owns route reliability, catalogue redesign, media pipeline implementation and CI; **this document does not modify that code or approve any photographs**.

## Verified baseline
- `apps/web/src/components/media/registry.ts` already validates candidate vs publication lanes, canonical F1DB IDs, content SHA-256, bilingual captions, review fingerprint, and delivery rules.
- `apps/web/src/components/media/publication.json` has **zero** approved assets.
- `docs/design/visual-storytelling-v2/media-readiness.json` reports five research candidates (three portraits, two Monaco layouts) and no approved photos.
- Follow `docs/media/approved-imagery-workflow.md`; do not build a second registry.

## Sources to curate (not automatically clear)
1. Wikimedia Commons [Formula One](https://commons.wikimedia.org/wiki/Category:Formula_One): routes into people, cars, constructors, circuits, by decade/year. The [cars category](https://commons.wikimedia.org/wiki/Category:Formula_One_cars) has subcategories by constructor, season and decade. Search targeted file pages rather than selecting top search thumbnails.
2. For each candidate, consult original Commons **File:** page and revision history. [MediaWiki imageinfo](https://www.mediawiki.org/wiki/API:Imageinfo) with `iiprop=timestamp|user|url|size|sha1|extmetadata` helps gather metadata; `extmetadata` is not an independent rights determination. The [Commons machine-readable data guidance](https://commons.wikimedia.org/wiki/Commons:Machine-readable_data/en) warns that licensing and author information are not always machine-readable.
3. [Wikimedia attribution guidance](https://attribution.wikimedia.org/attribution-signals/license.html): preserve individual media license links, author, original file URL, and transformation statement.
4. Independent museum archives can be useful for research, but some openly downloadable files are **NC-ND**. Example: [Science Museum Formula One Racing](https://collection.sciencemuseumgroup.org.uk/objects/co8684198/formula-one-racing) is CC BY-NC-ND 4.0, not a safe unrestricted site hero. Do not mistake CC0 catalogue **metadata** for CC0 image bytes.

## Candidate selection matrix
Prioritize verified coverage, not arbitrary volume:
- 1950s: Fangio and era-correct car photographs; confirm race/year and photographer, do not infer it from title.
- 1970s: representative constructors and historically correct car models; separate museum photographs from period race photos.
- 1980s: Senna, Prost, Lotus and McLaren; distinguish 1985/1988 vehicle identities.
- 1990s–2000s: drivers and vehicles linked to documented season.
- 2010s–2020s: current-era drivers, constructor cars and recognizable circuits.
- Circuits: venue photography separated from existing pinned exact-layout SVGs.

For every candidate record: Commons File URL, creator vs uploader, license + URL + revision, depicted subject, confirmed car model/year and confidence, modifications allowed, intended presentation, source-of-identity evidence and unresolved rights questions. Prefer CC0/public domain, CC BY 4.0, or CC BY-SA 4.0 when terms are fulfilled. Attribution alone is **not** permission. Avoid NC as a default dependency and reject ND for planned crops/graphic composites; never assume sponsor/team marks or personality rights are automatically cleared by a photo license.

## Presentation rules
- **Documentary photography**: real, sourced and historically identified; never use it as a backdrop for an unrelated season.
- **Licensed technical artwork**: show exact layout year/race and separate attribution.
- **Original illustration**: visibly distinguish from factual photography.
- **AI visualization**: only a separately labeled reconstruction/concept, never presented as archival evidence. Exact Ukrainian label: `AI-реконструкція · Не архівна фотографія`; English: `AI reconstruction · Not an archival photograph`. Don't synthesize false events or quotes.

## Encyclopedia-first product UX

**Historical feature stories are postponed.** Complete driver biographies, constructors, circuits, canonical relationships and media first. Use the detailed [entity UX and QA acceptance checklist](encyclopedia-completion-acceptance.md) and [source-specific media review queue](media-review-queue-2026-10-23.md).

An entity page should answer: **Who/what is this?** → **What happened, according to the archive?** → **What can I explore next?** Every photo must be accurately contextualized and rights-cleared; every narrative paragraph must be separately sourced and reviewed. Data timelines and reciprocal links are navigational aids, not substitutes for human biographies.

## Acceptance criteria for an independent editorial/media review
- Build a source-specific media candidate queue across decades/subjects; **not** auto-approved assets. Existing exact pilot candidates are triaged in the linked review queue.
- A source/reuse decision for every candidate; reject unsupported or ambiguous rights.
- Prioritize source-backed UK/EN driver biographies, constructor histories and circuit descriptions; no standalone story episodes in this phase.
- Candidate coverage report with decade/subject gaps, not a vanity image count.
- No new media infrastructure, app CSS, page components or migrations in this research PR; Codex owns those.
