# Visual edition: ten bilingual Formula 1 stories

This PR upgrades **all ten released stories in EN and UK in one unified change** rather than fragmenting the design work across individual pages.

## Reader experience
- Ten original art directions keyed by story; distinct color, motif and graphic style, no invented archival photos or circuit geometry.
- Illustrated catalogue covers, responsive featured first card, hover/focus states and mobile stacking.
- In-story illustrated scene at the third chapter, with clear note that the art is conceptual, not a historical photograph or reconstruction.
- Existing reading progress, sticky chapter navigation, sourced result cards, archive links and licensed-photo manifest remain intact.
- Respects prefers-reduced-motion and high-contrast user settings.

## Media provenance
The existing original SVG illustration system is authored locally in source code. **No new third-party photo, team logo or car photograph was imported.** Future editorial photos must pass the existing rights manifest: creator, source file, versioned license, attribution, and reuse review. Photos are intentionally omitted from this release where not approved.

## Release acceptance
- Verify both locale routes for each of the ten slugs; desktop and mobile; keyboard tab order, reduced motion and forced colors.
- Run editorial tests, Next.js build, archive browser acceptance.
- No changes to narrative texts, article claims, source ledger or immutable AI-reviewed hashes.
