# Source-backed circuit cover artwork

Circuit dossier covers now prefer a **real historical layout outline** from the already-bundled F1DB v2026.17.0 artwork manifest instead of a generic decorative illustration.

## Selection and historical scope

The circuit API supplies the layouts belonging to the requested circuit. The cover selector intersects those IDs with the locally shipped `CIRCUIT_ARTWORK` manifest, prefers a source-marked effective layout, and otherwise uses the first matched historical layout. If no source-backed match exists, the previous decorative cover remains.

The cover is an **illustration of a particular recorded layout**, not a claim that the same configuration was used for every race, not an engineering-scale map, and not a substitute for the interactive year-specific Circuit Experience below the fold. Historical races and measurements remain attached to their own API records.

## License and delivery

Each image is a local SVG from `apps/web/public/circuit-layouts/`, mapped by `apps/web/src/components/circuit-layout-manifest.json`. The source, author Jules Roy and CC BY 4.0 license are linked directly from the bilingual cover. No new photographs or remote image hotlinks are introduced. The existing source-backed SVG provenance and safety audit remain authoritative.

## UX and checks

The cover includes English/Ukrainian alt text, responsive styling, forced-colors support, keyboard-visible attribution links and a no-JavaScript fallback to the ordinary decorative cover. Regression tests assert the manifest paths, pinned source metadata and wiring into the circuit page.

Run `node --test tests/circuit-cover-artwork.test.mjs` and the repository's usual `pnpm check`, `pnpm test`, `pnpm typecheck`, `pnpm build`, and browser checks before release. This document is not deployment evidence.
