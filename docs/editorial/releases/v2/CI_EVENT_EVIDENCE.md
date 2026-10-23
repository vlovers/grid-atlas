# Automated pinned-archive candidate evidence in CI

The `Editorial release preflight` workflow now downloads the same pinned F1DB archive used by the editorial release gate, runs the event reconciliation regression suites, produces a real year-scoped candidate report for all eleven constructor/circuit leads, validates report integrity, and uploads `editorial-event-candidates-unapproved` as a 14-day artifact.

This **does not automatically resolve a lead**. It enumerates the exact source race ID, circuit external ID and winner driver/constructor external IDs so an editor can compare the correct Grand Prix result and the canonical subject. It cannot establish layout geometry, first-ever venue races, team legal succession or editorial approval. The report deliberately retains `candidate_only_not_verified`.

The workflow triggers on changes to its own file, editorial documents, the candidate reconciliation scripts or their tests. The official ZIP download and historical-result enumeration execute in GitHub CI; **until that check passes for this revision, no real-archive execution result is claimed**. Existing source review and rights gates remain unchanged.
