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

## After the first useful beta

- Official driver/constructor standings with historical scoring rules and sprint results, distinct from race-result summaries.
- Circuit layout history, further source-backed lineage research, and better season filters when browsing evidence supports the need.
- Ukrainian/English translation review and content improvements based on user feedback.
- Broader source-schema/semantic validation and a reviewed data-update/reconciliation policy.

Keep follow-ups focused on useful, testable behavior. Never fabricate lineage edges to make the explorer look populated, infer legal continuity from naming, or overwrite editorial changes during import.

## Active delivery board (20 October 2026)

The previous list is the implemented archive foundation, not a production-release
certificate. History Explorer's two-way seasonal result graph, inspector, race
evidence, reciprocal navigation and permalinks have since merged through PR #101.
Result-context explanations are proposed in [PR #102](https://github.com/vlovers/grid-atlas/pull/102)
and are not considered shipped until its tests pass.

- **P0:** [#103](https://github.com/vlovers/grid-atlas/issues/103) real pinned F1DB import/Explorer acceptance;
  [#104](https://github.com/vlovers/grid-atlas/issues/104) branch protections, hosting, monitoring,
  backup restore and production launch controls
- **P1:** [#105](https://github.com/vlovers/grid-atlas/issues/105) Time Machine comparison contract;
  [#106](https://github.com/vlovers/grid-atlas/issues/106) accessible bilingual comparison UI;
  [#107](https://github.com/vlovers/grid-atlas/issues/107) independently reviewed biography pilot;
  [#108](https://github.com/vlovers/grid-atlas/issues/108) documentation/draft reconciliation

See [MVP release gates and implementation detail](../product/stable-experience-roadmap.md).
Tests on synthetic PostgreSQL fixtures do not independently verify historical
facts or constitute a real-production acceptance pass.
