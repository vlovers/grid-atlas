# Lineage editorial review queue

The public lineage graph deliberately contains **only verified claims**. A proposed record is not published merely because its source URL is present.

## Inspect pending work

After applying database migrations and importing F1DB and a proposed-only manifest, run:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/database/scripts/lineage-editorial-queue.sql
```

This **read-only** query lists proposed constructor and entrant claims together with their publisher, source, year, evidence note and local IDs. It neither approves nor modifies anything. Review records in a trusted local database; do not expose this queue in the public API.

## Review each claim

1. Open the linked primary source and check whether the *specific typed relationship* and effective year are actually supported.
2. Check subject and object against imported F1DB identities, not names alone. Distinguish constructors, entrants, legal entities and asset purchases.
3. Compare the evidence note with the source. Confirm source title, publisher and access date; note ambiguity explicitly.
4. Have an independent human editor record their review decision and identity. A URL alone is not approval.
5. If evidence is insufficient, leave the claim `proposed` or mark it `rejected` using a separately audited review process. **Do not directly edit status just to populate the graph.**
6. Verify that only approved records appear in `/api/lineage/network`. Keep rejected/proposed claims private.

The first test case is `docs/data-sources/manifests/silverstone-2021.proposed.json` (Racing Point → Aston Martin, 2021). It is still **proposed**, not automatically verified. The 2018 Force India asset transfer must not be represented as a simple rename. The 1959–1960 Aston Martin entry is distinct from the modern operation.

## Scope

This PR adds a review *queue*, **not** an approval endpoint, automatic promotion, or a claim that editorial review has occurred. A future reviewed mutation workflow should record reviewer identity, timestamp and evidence and be tested on disposable PostgreSQL before use.
