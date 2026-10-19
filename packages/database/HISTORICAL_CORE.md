# Historical read model

The implemented model separates drivers, constructors, entrants, circuits, seasons, races and race-result rows. Every named entity references a namespace-scoped external identity; season/round pairs and race-result display orders are unique. BIGINT keys remain local implementation identifiers.

Five migrations also implement provenance and separate cited constructor/entrant lineage claims. Verified status requires review metadata, and public queries exclude proposed/rejected claims. Independent editorial approval is required beyond database constraints.

The pinned F1DB release has been imported twice into disposable PostgreSQL with stable counts; see the [beta audit](../../docs/beta-audit.md). The checksummed migration runner supports repeated and incremental application. The legacy clean-database helper is only for early constraint tests.

Chassis, engine suppliers, circuit configurations, legal-organization identity, full championship standings and an update/reconciliation policy remain outside this read model. Driver-result aggregates do not establish contracts, official start counts or championship totals. Constructor win summaries count a shared-car victory once per race.
