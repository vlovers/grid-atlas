# Content and media gap triage — first executable batch

Run `node scripts/audit-content-media-coverage.mjs --json` from repository root. This reports checked-in evidence, not a claim that the full F1DB catalogue has been audited.

## Immediate finding
- Ten drivers have bilingual long-form research dossiers, but **none is a published article**.
- The public photographic publication registry is empty. Five or more research candidates are not substitutes for verified images.
- Constructor and circuit image gaps cannot be solved by using the driver portraits or by repurposing unrelated photos.
- Historical circuit SVG layouts are a separate collection; use them prominently for circuits without implying they are photographs.

## Delivery batches
1. **Circuit visual pass**: ensure every applicable circuit profile exposes its exact historical layout with year/configuration context, attribution and an explicit unavailable state for unsupported eras. Add responsive screenshots across Monaco, Silverstone and a no-layout case.
2. **Constructor and driver archive storytelling**: surface existing verified API season timelines, records, race results, driver/constructor relationships and track maps as visible, navigable modules in both locales. These are data-driven modules, not human-approved biographical claims.
3. **First photograph publication batch**: use the existing Commons candidate register and rights workflow. For each selected asset independently verify creator, exact file revision, license and restrictions, historical identity, byte checksum and bilingual alt/caption; obtain actual human approval before adding to `publication.json`. Never publish candidate URLs directly.
4. **Broader catalogue coverage**: audit full imported F1DB driver/constructor/circuit lists and rank missing profile sections by page traffic or editorial priority. The pinned media identity snapshot is intentionally not a complete catalogue.

## Done means visible
A change is complete only when an EN and UK browser screenshot shows a materially improved driver, constructor and circuit profile, links work, media provenance is visible, and the relevant lint, typecheck, build and browser tests pass. Documentation or empty gallery placeholders alone are not delivery.
