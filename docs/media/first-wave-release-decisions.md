# Media Batch 01 — release decision matrix (research-only)

This checklist is **not publication approval**. It helps a human reviewer process the eight currently recorded image candidates in one coherent wave. Baseline on 2026-10-24: `apps/web/src/components/media/publication.json` contains zero assets. None of these candidates has a signed review, verified final delivery bytes, or complete public-ready bilingual caption.

| Candidate ID | Subject | Priority | Provenance/license review | Original-binary observation | Publication class | Decision |
| --- | --- | --- | --- | --- | --- | --- |
| `ayrton-senna-commons-pilot` | Senna | P0 | Flickr crop lineage and CC BY 2.0 obligations open | No published verified original SHA-256 in publication registry | `portrait` | BLOCK |
| `lewis-hamilton-commons-pilot` | Hamilton | P0 | Flickr credit and source-date context open | No verified publishable bytes | `portrait` | BLOCK |
| `research-schumacher-portrait-2007` | Schumacher | P0 | Confirm original Gunnar Richter CC BY-SA 3.0 conditions | Private SHA-256 source observation exists; NOT rights clearance | `portrait` | BLOCK |
| `research-alonso-2024` | Alonso | P0 | Confirm original Peter Menzel CC BY-SA 2.0 conditions | Private SHA-256 source observation exists; NOT rights clearance | `portrait` | BLOCK |
| `research-mclaren-mp44-2007` | McLaren | P1 | John Chapman/Pyrope, CC BY-SA 3.0 and museum/display date | Original content SHA-256 pending | Requires supported `photograph` class and correct museum caption | BLOCK |
| `research-ferrari-f2004-2004` | Ferrari | P1 | Storem CC BY-SA 2.0; verify depicted car and event | Original content SHA-256 pending | Requires supported `photograph` class and exact car context | BLOCK |
| `research-silverstone-2019` | Silverstone | P1 | Harvey Milligan CC BY-SA 4.0; vantage and 2019 date | Original content SHA-256 pending | Requires supported `photograph` class (not a diagram) | BLOCK |
| `juan-manuel-fangio-commons-pilot` | Fangio | P2 | **Photographer/derivative chain conflict unresolved**; 190×352 candidate | Original binary and parent attribution not cleared | `portrait` | BLOCK |

## Minimal reviewer packet for each image

- Source page, immutable description revision, original author/photographer, derivative parent, exact license and restrictions, reuse context.
- Human visual inspection of actual original with subject, car, event/date and image modifications; no false depiction or season attribution.
- Local original bytes checked against source SHA-1, actual SHA-256, MIME, dimensions and source revision, with the complete binary located only in owner-controlled storage until approved.
- English and Ukrainian final alt, historical caption, media credit and rights links; drafted alt from `first-wave-review-queue.md` is only a research proposal.
- Human reviewer identity and dated rationale on the exact `mediaFingerprint`, plus independent technical/CI review.
- Only then atomically add image bytes and reviewed metadata to `apps/web/public/media` and `publication.json` in a separate publication PR.

## Grouped release plan

1. **Wave A — driver portraits (P0):** prioritize Senna, Hamilton, Schumacher and Alonso as hero-ready subjects. Keep Fangio blocked until authorship is resolved. Preserve existing source observations rather than re-downloading verified binary for no reason.
2. **Wave B — constructor/car image context (P1):** independently confirm actual vehicle models, photograph dates and license; never caption a later museum photo as in-period race reportage. Supported `photograph` kind is not evidence of a racing scene.
3. **Wave C — circuit venue (P1):** Silverstone archival venue photography is separate from the already attributed F1DB historical SVG circuit outline.
4. **Wave D — expansion to twelve:** source four additional candidates **only after** first-eight rights evidence and inspection bottlenecks have been assessed; do not repeat ineffective speculative searches.

**Release gate:** if any blocking criterion remains unresolved, leave that asset unpublished and document why. `0` published is a legitimate result of a defensible audit; fabricated human approvals are not.
