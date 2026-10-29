# Roadmap

## Implemented

- Ukrainian-first `/uk` and English `/en` routes, locale-preserving navigation/search/language switching, translated metadata and accessible loading/error/not-found states. Historical facts, names and IDs remain source-neutral.

- Next.js frontend, NestJS read API, PostgreSQL historical/provenance schema, forward-only checksummed migrations.
- Checksum-validated, repeatable F1DB v2026.17.0 imports of seasons, drivers, constructors, entrants, circuits, races and results.
- Search and pagination for driver, constructor and circuit catalogues; career/season summaries; circuit race history; named race results linked to profiles and seasons.
- Constructor and entrant lineage stored separately, proposed-only importer and exact identity preflight; verified-only public API; interactive graph and accessible relationship list with citations.
- Mobile navigation, route loading, empty and error states, numeric-record not-found handling, source-release / attribution page.
- Frozen workspace lockfile, lint, type checks, production builds, PostgreSQL identity/review regressions and desktop/mobile browser flows in CI.

## Public beta release gates

1. Obtain independent editorial approval for each publishable lineage edge. The 2021 Racing Point → Aston Martin manifest is proposed; no verified historical graph is claimed.
2. Configure required checks and review protections for main. This audit found no branch protection / rulesets; repository settings were not changed.
3. Choose hosting and configure private database access, TLS, public traffic limits, health/readiness monitoring and backups. Rehearse restore and incremental migration in that environment. Local production processes are validated; external deployment still needs approval.
4. Review public source/licensing presentation and historical scope, and perform a maintainer acceptance pass against the imported archive. See [beta audit](../beta-audit.md).

## Current visual and editorial delivery (23 October 2026)

- Editorial Racing homepage and driver/constructor dossier redesign merged in PR #205. Responsive historical journey links merged in #206, driver reading-density improvements in #208, and bilingual driver-season visual charts in #209.
- PR #207 merged the circuit SVG rendering fix. All 160 pinned layout assets are present; independent per-asset rights review and unsupported overlays remain separate boundaries.
- Draft editorial subjects, source-located research, and manuscript gates are not public biographies or independently verified historical facts. Photography is not approved for public display merely because a candidate or registry entry exists.
- This sprint adds shared driver/constructor participation calendars, observed roster changes, source-backed milestones and rights-gated image archives. See the [implemented behavior, screenshots and limits](../design/visual-storytelling-v2/README.md) and [current audit](../sprint-audit-2026-10-23.md).
- The [unified archive batch](../design/unified-archive/README.md) extends existing editorial templates to catalogues, seasons, circuits and races, retains driver/constructor dossiers, and adds historical-context/AI provenance to the existing media registry. UK/EN navigation, reduced motion and enlarged-text reflow have dedicated cross-engine acceptance. Independent photographic approval and researched historical narratives remain separate work.

## Circuit editorial publication boundary (29 October 2026)

The [circuit editorial boundary](../editorial/CIRCUIT_PUBLICATION_BOUNDARY_20261029.md) introduces a separate circuit-specific schema and a disabled-by-default read-only API with evidence, revision and review invalidation. This is **not** an approval or public release: no researched circuit drafts have been imported, no publisher has been enabled, and independent claim-by-claim human verification remains required. The driver-specific publisher cannot be reused for circuits.

## After the first useful beta

- Expand independent scoring-rule verification and sprint coverage. Source-reported driver/constructor classifications already exist (#197), separate from result summaries; do not describe them as independently recalculated FIA classifications.
- Further source-backed lineage research and evidence-led improvements to existing circuit layout/season navigation.
- Ukrainian/English translation review and content improvements based on user feedback.
- Broader source-schema/semantic validation and a reviewed data-update/reconciliation policy.

Keep follow-ups focused on useful, testable behavior. Never fabricate lineage edges to make the explorer look populated, infer legal continuity from naming, or overwrite editorial changes during import.

## Historical delivery board snapshot (20 October 2026 — not current)

The pinned historical archive and Explorer are implemented, with reproducible
[real F1DB acceptance](../real-archive-acceptance-2026-10.md). This is **not**
independent verification of every historical claim or production-release approval.

- **Completed:** [#103](https://github.com/vlovers/grid-atlas/issues/103)
  pinned import/API/browser acceptance; [#105](https://github.com/vlovers/grid-atlas/issues/105)
  bounded Time Machine API + negative integration tests; [#115](https://github.com/vlovers/grid-atlas/issues/115)
  browse all imported connections beyond the radial graph cap.
- **In progress:** [#106](https://github.com/vlovers/grid-atlas/issues/106)
  Time Machine UI (Draft PR #118); [#108](https://github.com/vlovers/grid-atlas/issues/108)
  review historic product draft and reconcile documentation.
- **Release blockers:** [#104](https://github.com/vlovers/grid-atlas/issues/104)
  production deployment/branch protections/backup restore;
  [#107](https://github.com/vlovers/grid-atlas/issues/107)
  independently verified bilingual editorial content.

See [current product roadmap](../product/stable-experience-roadmap.md) and
[review of historic product drafts](../product/legacy-explorer-spec-review.md).
Only independently reviewed historical editorial claims may be published.
