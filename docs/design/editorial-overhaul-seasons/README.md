# Seasons, media & final visual QA — PR 3

Independent base: current `main` after the 26–27 October research refresh. No dependency on PR 1 or PR 2 is required to build this branch. Editorial Racing, the pinned F1DB release, database schema and publication policies remain intact.

## Experience

Seasons have a source championship cover, one complete Grand Prix calendar, the two full championship tables and the recorded driver/constructor field. Removed both automatic first/middle/last selections, the duplicate race list and the generic archive portrait/constructor-win ranking. No chronological sampling is described as historical significance.

The optional **Stories from this season** section uses explicit season associations and the existing exact bilingual manuscript-digest publication check. It links only to already released `/stories/moments/:slug` editions. A changed or unreviewed manuscript fails closed. No new article, approval record or photograph is published. Years without a released associated story omit the section entirely.

The pinned 2026 season is explicitly provisional. Its cover displays provisional standings, never a champion or completed-season retrospective; the calendar may include races without results. Championship totals retain source standings instead of summed race points.

Empty media collections now occupy a single native disclosure. It explains the absence on demand and links to sources. Approved media still use the existing rights/context/digest selector and LicensedMedia renderer. Withdrawn, mismatched or unapproved images remain excluded. Removed the large decorative empty-gallery panel. Media licensing/provenance details stay available; no Box Box/F1.com image, generated historical photograph, AI portrait or new font was added.

## Media audit

The publication registry has zero approved assets. The 160 existing F1DB/Jules Roy CC BY 4.0 outlines remain the available source-backed circuit artwork, with their existing attribution and independent rights-review boundary. Real photos and historical car galleries cannot be claimed complete without rights approval. Existing original code illustrations remain labelled as illustrations. This PR changes the absence state, not those approval decisions.

## Verification

Per-command results and final CI are recorded in verification.md and the PR. The shared capture checks UK/EN across 1440/768/390 px against the genuine checksum-verified archive in a new disposable PostgreSQL database (localhost 55466). Selected screenshots compare the same archive, viewport, locale and reduced-motion setting; lazy images are scrolled into view before capture.

Dedicated browser tests traverse season → published story, verify one calendar/no automatic highlight sections, retain provisional 2026 wording, and open the compact media disclosure by keyboard. The final route sweep covers home, all catalogues, driver/constructor/circuit profiles, 1988/2026 seasons, Time Machine, Atlas and History Explorer. No-JS core browsing and existing map/list alternatives are checked separately.

Merge and release remain maintainer actions; CI does not grant historical-content, media, real-origin or #104 operational acceptance.

[Combined three-PR validation](combined-verification.md) records the detached composition, source SHAs,354 unit/434 Python/528 browser passes,78-page final visual report and full encyclopedia coverage audit. This temporary composition does not merge the PRs.
