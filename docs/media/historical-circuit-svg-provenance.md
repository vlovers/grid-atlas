# Historic circuit SVG artwork · pinned source and attribution

**Source collection:** https://github.com/f1db/f1db/tree/v2026.17.0/src/assets/circuits/white-outline

**Upstream artwork:** Jules Roy, https://github.com/julesr0y/f1-circuits-svg

**Declared license:** Creative Commons Attribution 4.0 International (CC BY 4.0): https://creativecommons.org/licenses/by/4.0/

The website vendors **160 unmodified white-outline SVG assets** from the immutable F1DB v2026.17.0 tree. A separate `circuit-layout-manifest.json` records the source path, upstream git blob SHA, artist, license and modification status for every imported SVG. `test_circuit_svg_assets.py` verifies the original Git blob hash of every byte, the exact 160-item identity set and restricted SVG tags and attributes. These assets do not contain race sectors, DRS, speed-trap coordinates or tyre information.

Attribution shown alongside each image: **Outline artwork: Jules Roy · CC BY 4.0**, linking the source and licence. Surrounding Grid Atlas CSS (gradient background and drop-shadow) is an original presentation; the SVG payloads are **unmodified**. SVG identity `austin-1.svg` matches `historical_circuit_layouts.external_layout_id=austin-1`; never substitute another layout, including when no linked race exists.

Rights caution: both F1DB and the upstream Jules Roy project publicly declare CC BY 4.0, but this is not a legal guarantee of all upstream third-party rights. Keep the per-asset provenance and verify any individual ownership exceptions before a public release. Attribution does **not** imply approval or affiliation with FIA or Formula 1.

The SVGs represent **layout shape only**, not surveyed engineering maps or independently proven geographical geometry. The on-page timeline and per-race measurements remain F1DB-sourced and tied to their historical events. Do not add manually guessed sectors, corner labels, elevation or 3D models to these images. Modern DRS terminology is not applicable to F1 2026, which uses Overtake Mode and active aerodynamics.

All SVGs are local static assets; no runtime fetch from GitHub, fonts, raster assets or external scripts. When updating the pinned F1DB release, repeat source licence review, check every SVG, update the manifest, and run Foundation, Web and real-archive CI.
