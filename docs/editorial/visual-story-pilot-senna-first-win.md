# First visual-story pilot — Senna's recorded first victory

**Status:** editorial research package, **not** approved or published.  
**Locales:** Ukrainian and English.  
**Identity:** Ayrton Senna; resolve the canonical F1DB driver external ID and internal numeric ID from the imported archive at execution time. Do not hardcode a guessed numeric ID.

## Reader question

**EN:** What does the historical archive actually establish about Ayrton Senna's first recorded Formula 1 victory?

**UK:** Що саме історичний архів підтверджує про першу зафіксовану перемогу Айртона Сенни у Формулі-1?

This is an evidence-first microstory, not a complete biography or a retelling of race circumstances. The existing Senna editorial dossiers remain unpublished until independent review.

## Research leads to check

1. **Pinned F1DB v2026.17.0:** inspect the driver's career milestone for the first winning result, then cross-check the exact race classification row, driver ID, constructor ID, season and race links. Preserve whether the value is a winning result entry, distinct race, or official classified win.
2. **Formula 1 historical race archive:** find the exact event results and confirm driver, constructor, classification and date independently. Save the canonical result URL, publisher and date of inspection.
3. **Contemporary race report or a reputable independently authored historical account:** only needed if the story explains weather, strategy, driving performance, incidents or quotes. Capture a precise passage locator and author; do not use an unsourced retrospective as independent corroboration.
4. **Circuit record:** resolve the exact race-linked circuit and, only if present, its exact historical layout ID and attributed local SVG. Do not substitute a modern layout.

**Candidate event for verification:** 1985 Portuguese Grand Prix at Estoril. Treat the event and any race circumstances as unapproved until cross-checked against the actual pinned import and independent source. Do not silently turn this research lead into a published claim.

## Proposed chapter storyboard

| Beat | English working copy | Ukrainian working copy | Required evidence |
| --- | --- | --- | --- |
| Opening | A first win is a result, not yet a complete story. | Перша перемога — це результат, але ще не вся історія. | Editorial framing, no historical assertion |
| Orientation | Find Senna's earliest winning race entry in the pinned archive. | Знайдімо найраніший переможний запис Сенни в закріпленому архіві. | Driver career milestone and exact race ID |
| Evidence | Read the classification and identify the constructor recorded for that race. | Перевірмо класифікацію та конструктора, зазначеного для цієї гонки. | Race results and constructor profile |
| Visual | Compare the race-linked circuit layout with its source attribution. | Розгляньмо конфігурацію траси, пов’язану з гонкою, та її джерело. | Event layout ID, local SVG manifest, or fallback |
| Interpretation | What the result establishes — and what it does not. | Що підтверджує результат — і чого він не доводить. | Metric definitions and independently checked historical interpretation |
| Exit | Follow the driver, constructor and race records. | Перейдімо до записів гонщика, конструктора та гонки. | Canonical UK/EN routes |

These are editorial *instructions and framing*, not verified historical narrative paragraphs.

## Evidence checklist before writing factual paragraphs

- [ ] Resolve the exact driver external ID and race ID from the pinned archive.
- [ ] Verify first-win ordering across **all** imported driver winning results, not merely the first paginated response.
- [ ] Record classification position, constructor association, shared-car flags and source coverage.
- [ ] Confirm the event in an independently accessible official classification.
- [ ] Record date, author/publisher, URL, precise locator and any discrepancies.
- [ ] Confirm the correct circuit layout ID and its provenance, or use a text-only fallback.
- [ ] Review both languages for identical factual scope and terminology.
- [ ] Obtain an actual independent human review bound to the exact content revision.

## Candidate visual package

- **Hero:** original typographic cover: driver name, sourced season and event, with explicit archive label.
- **Evidence card:** first winning result linked to the race classification; avoid declaring an official start total.
- **Constructor context:** single event-linked constructor identity; no unsupported contract claim.
- **Circuit:** approved existing event-specific SVG if exact mapping exists; show artist and CC BY 4.0 attribution.
- **Source drawer:** per-claim links, evidence location and what remains uncertain.
- **No photo until approved:** a period-correct Senna portrait would improve the story, but must pass the existing human rights review before entering publication.json.

## Acceptance and publication gate

Do not add this story to public pages, media publication registry, or database. Reuse the existing Senna editorial pilot and approved-release pipeline once sources and reviewers are ready. The chapter can first be previewed privately using the existing preview tool. A green CI check or successful source download is **not** editorial approval.

**Next editorial action:** verify the candidate event and archive race ID; populate the per-claim ledger with exact evidence URLs and independent review status. Do not invent race statistics, dialogue or atmospheric detail.

## Independently checkable official result references (research notes, not approval)

- Formula 1, Portuguese Grand Prix 1985 race result: https://www.formula1.com/en/results/1985/races/483/portugal/race-result
- Formula 1, historical article about Senna's first win: https://www.formula1.com/en/latest/article/he-obliterated-the-opposition-remembering-sennas-first-f1-win.1nwtFllIepudRwA7iesUaj

The race-result page identifies Senna as the winner for Lotus Renault, car 12, with 67 laps and 2:00:28.006. The classification lists Alboreto second and Tambay third. Treat these as source-reported facts requiring editorial review and pinned-import reconciliation. Both references belong to Formula 1 and are not independent publisher groups. The Formula 1 URL race ID is not a Grid Atlas race ID. No media rights are conveyed by these URLs.

## Existing editorial dossier reuse — verified repository references

The current research release already contains a Senna claim for this exact event. Reuse it instead of creating a competing content record:

- `docs/editorial/pilots/senna/en.dossier.json`: claim `ayrton-senna-portugal-1985-p1`, evidence source `senna-portugal-1985-result`, locator `21 April 1985 result, position 1 Senna / Lotus Renault`.
- `docs/editorial/pilots/senna/uk.dossier.json`: check the paired claim and translation against the same event before editing either dossier.
- `docs/editorial/releases/v1/manifest.json`: `ayrton-senna` already points to the existing EN/UK dossiers and review sidecars; release status is `research_only`.
- `docs/editorial/APPROVED_RELEASE_PIPELINE.md`: existing revision-bound human approval, export and explicit operator publication remain mandatory.

**Deduplication decision:** the visual story is a presentation of the existing researched event, not a new independently approved biography or new CMS entity. The added Formula 1 result link is already present in the English dossier; do not duplicate it there. The supplementary retrospective is a candidate research source, not an approved replacement for the dossier's evidence. The published story must read approved claim text through the existing release path once a human reviewer approves the exact revision.

## Confirmed bilingual dossier parity (repository audit, 23 October 2026)

Both canonical dossier files were inspected directly in `main`:

| Locale | Canonical dossier | Claim ID | Current status |
| --- | --- | --- | --- |
| English | `docs/editorial/pilots/senna/en.dossier.json` | `ayrton-senna-portugal-1985-p1` | `needs_review` |
| Ukrainian | `docs/editorial/pilots/senna/uk.dossier.json` | `ayrton-senna-portugal-1985-p1` | `needs_review` |

Both claims assert the 21 April 1985 Portuguese Grand Prix victory for Lotus-Renault. Both use source ID `senna-portugal-1985-result`, the same official Formula 1 classification URL and the same result-row locator. This confirms **research record and translation coverage**, not independent historical review. Do not change either claim to `approved` or treat matching translations as a reviewer signature.

### Reuse decision for visual storytelling

- The first visual-story chapter can be scoped to this **one existing claim**; later chapters about weather, qualifying, fastest lap or tactics must wait for separately sourced, independently reviewed claims.
- A public statistics/evidence view can continue to use the archive read API without implying that this unpublished claim has been editorially approved.
- The story reader must not import the research JSON into public frontend bundles. Use the existing approved publication read model only after review and explicit publication.
- Preserve the UK/EN claim pairing and do not duplicate the same claim under a second ID merely to power the visual design.
