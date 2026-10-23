# Media candidate handoff — publication blockers and image UX

**23 October 2026.** This handoff is scoped to the existing `docs/research/commons-photo-research-index.csv` (16 research entries), not the strict public media registry. It documents concrete editorial decisions still needed; it is **not** human copyright approval. No image bytes were imported.

## First proposed seven-file pilot (review queue, not publication)

| Order | Candidate | Intended use | Before accepting |
| --- | --- | --- | --- |
| 1 | Schumacher 2007 portrait | Driver dossier hero | Verify photographer/rights and real capture year; no 1990s claim |
| 2 | Alonso 2024 | Driver dossier card/hero | Verify exact event and author; caption the 2024 context |
| 3 | McLaren MP4/4 at Donington | Constructor/car panel | Confirm model and photographer; visibly label **museum display, 2007** |
| 4 | Ferrari F2004, 2004 photo | Constructor/car panel | Confirm exact subject/year, original Flickr license and author |
| 5 | Silverstone, 2019 | Circuit hero | Venue photo only, not an older track configuration |
| 6 | Monaco harbour, 2023 | Circuit hero | Resolve **exact license version**, image authorship and event context |
| 7 | Senna, Belgium 1989 portrait | Driver dossier | Review original Flickr/crop chain; never label it as Portugal 1985 |

These seven are prioritized for *review effort*, not approved publication. The existing `docs/media/candidates.json` includes Senna; the remaining candidate research is in `docs/research/commons-photo-research-index.csv`. Do not create duplicate assets without checking both inventories.

## Explicit hold queue

- **Fangio 1957 crop:** unclear original photographer and low resolution; not hero-ready.
- **Verstappen 2016:** contradictory description references a victory after the recorded image date; verify original event and do not claim it shows the later win.
- **Lauda 1976:** historical event claim vs 2017 image date; source chain unresolved.
- **Schumacher Ferrari 1997:** event year and file date disagree; verify original Flickr record.
- **Lotus 97T 2007:** small derivative image; use only if source and usable original resolved.
- **McLaren chassis-specific claim:** do not print chassis number without independent evidence.

## UI integration contract for Codex after human approval

- One hero photo only when the publication registry says verified for the correct subject and context; no auto-promotion from research CSV.
- Mobile crops must preserve faces, car number and historic sponsor context without misleading composition. Store modification notes and license-compliant credit.
- Hero, car image, circuit venue photo and historic SVG have different semantic roles. No generic “image available” boolean.
- Accessible credit visible with author, original file page, license/version and any modifications. Avoid tiny or hover-only attribution.
- If photo is unavailable, render the current high-quality typographic/diagram fallback; don't hotlink Commons thumbnails.
- Distinguish venue photos from precise historic layout diagrams. Distinguish period race photos from modern museum/restoration photos.
- Recheck UK/EN captions and alt text separately. A translated caption must not add an unverified year/model/event.

## Reproducible research check

Run `node scripts/audit-commons-research.mjs` and `node --test tests/commons-research.test.mjs`. The checker enforces uniqueness, file-page URL shape and `not_approved` state; **it does not verify live licenses or historical identity**. Existing `pnpm audit:media --as-of YYYY-MM-DD` remains authoritative for the media publication pipeline.

## Acceptance before merging the research PR

1. Check all CSV URLs resolve to the intended Commons files; some URL spellings and page capitalization still need a live check.
2. Confirm all 16 rows are metadata-only and no review/approval fields were fabricated.
3. Run the research Node tests and docs link checker; record actual CI results.
4. Reconcile with any Codex branch touching the same media docs or registry.
5. Leave the PR Draft until review is complete. Merge does **not** approve images.
