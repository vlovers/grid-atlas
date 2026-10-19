# HX-01 — Driver Connections API

This endpoint is a first, bounded, one-hop **historical observation** graph, not a constructor lineage graph.

`GET /api/explorer/drivers/:id/connections?year=1950`

- `id`: positive canonical PostgreSQL BIGINT string.
- `year`: required, four-digit integer in 1950–2200.
- Returns `{data: {focus, year, nodes, edges, truncated, limit, source, limitations}}`.
- `nodes`: driver focus and up to 25 distinct constructors with result records in that season.
- `edges`: one `driver_competed_for_constructor` relation per distinct constructor and selected season. `result_entries` counts rows, `races` counts distinct races, `winning_races` counts distinct winning races.
- `truncated`: true when more than 25 constructors exist; this first slice intentionally has no pagination.
- Ordering: first recorded season round, then canonical constructor ID. Stable keys use canonical IDs and year, never translated names.
- `source`: archive's registered source attribution for the focus driver, **not per-result citations**.

The response does **not** assert official starts, employment, entrant identity, legal continuity, rivalry or independently reviewed lineage. It does not show proposed or rejected lineage claims.

A driver with no results in the requested season returns the focus node with no edges; an unknown driver returns 404. Invalid IDs/years return 400. Query and identity read inside a repeatable-read, read-only PostgreSQL transaction.

## Integration

This branch is stacked on `feat/historical-profile-api` (PR #60). After PR #60 merges, retarget this PR to `main` and rebase if needed. It changes only `apps/api/src/explorer.controller.ts`, `apps/api/src/module.ts`, API integration tests and this documentation.

This first slice deliberately excludes race expansion, constructor-focused exploration, graph UI, editorial journeys, localization and deployment. Later UI integration must preserve locale-aware routes and show the limitations next to metrics.

## Validation

Three new HTTP/PostgreSQL integration cases exercise observed season links, gaps, constructor/entrant distinction, stable keys, missing driver and invalid inputs. **These tests are committed but have not been executed in this environment**; CI and disposable PostgreSQL integration must pass before merge.
