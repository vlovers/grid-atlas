# PR 2 verification

Node24.21.0 / pnpm10.18.3 in isolated `/private/tmp/grid-atlas-ux2`. New content is research-only; registry approval count remains zero. Existing Monaco/Spa research from upstream is reused and preserved.

| Check | Actual outcome |
| --- | --- |
| `pnpm check` / `pnpm lint` / `pnpm typecheck` | PASS |
| `pnpm test` | PASS,354 after final upstream refresh, including four new model/gate/preview tests |
| Python unittest discovery | PASS,434 after replacing obsolete template assertions with one-archive/exact-unambiguous-race checks |
| `GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build` | PASS |
| Full synthetic browser suite |488 pass;20 stale expectations for removed chronology/cover/leader blocks. Updated checks preserve source/winner/navigation safeguards and use visible Radix options. |
| Final changed-route browser set |104 PASS: archive identity/search, source portraits, circuit/layout selection,30-cycle hydration/reload per locale/project, local outlines, entity completion and200%/tablet/mobile/table navigation. An intermediate replay selected a hidden technical-detail link; scoped the journey to the visible single GP archive. No timeout was raised or assertion disabled. |
| Genuine-archive circuit/identity scenarios | PASS,24 tests across desktop/mobile and both locales, including SVG/year selection and paginated archive navigation. |
| Real archive visual sweep |18 pages, UK/EN ×1440/768/390, allHTTP200 and no page errors/overflow. [Report](visual-audit.json). |
| Coverage audit |PASS:78 circuits,4 numbered guide candidates,5 narrative collections/27 candidates,0 approved editions. [Report](coverage.json). |
| Private map / no-JS inspection |No marker intersections at1440/768/390.44px targets retained by an internally scrollable labelled map; separate number index remains available. [Report](private-and-no-js-audit.json). |
| Docs / whitespace |0 unresolved links / `git diff --check` PASS |
| API integration/migrations |N/A new API/schema work: none. Real UI uses a new checksum-verified import; synthetic suite owns random fixture schemas. |

Independent review found and resolved: wrong IdentityFacts prop, missing page-two structured-data path, unapproved research appearing as public prose, and equal SVG stroke widths obscuring the private outline. The final gate is empty and cannot be overridden by an environment flag. Neither an AI review nor a passing test becomes a human approval.

The private preview reuses `startReview` with explicit opt-in, exact loopback Host/path/method enforcement, no-store/noindex and a temporary opaque URL. It cannot approve or publish. The numbered Monaco illustration uses the already-bundled F1DB/Jules Roy asset; FIA’s protected diagram is cited for numbering, never bundled. Coordinates remain approximate editorial annotations requiring independent review.

Current release limitations: new numbered guides and27 source-linked stories await exact bilingual, historical naming, layout, copyright and annotation review; they remain absent from ordinary public pages. Source-backed legacy summaries remain available. Existing per-asset SVG rights and #104/real-origin release gates are unchanged. Final SHA and candidate CI are tracked in the PR.

The archive CI audit now verifies the always-present `circuit-dossier` marker and retained identity facts. The retired result-leader section is not a profile-completeness contract. No canonical, pagination, source or full-archive coverage assertion was removed.

Full encyclopedia audit PASS against the genuine import:917 drivers,187 constructors,78 circuits;2406 pages,11504 API requests,1172 calendar events and27665 result rows compared. The remaining real-profile visual test now checks that the single GP archive is immediately visible rather than trying to open its retired disclosure; all metadata, row-count, nav-target,44px, width and forced-colors checks remain.
