# Historical technical facts: storage phase

This forward-only migration creates a **research-only** table for verified-source candidates:
driver seasons, constructor seasons, circuit layout versions, and race-event facts.
No source values, images, geometry or public endpoints are shipped.

Each claim retains its exact source locator and access date. A review state is recorded,
but `reviewed` is **not** a public publication flag. Conflicting source claims remain
distinct rows and must be reconciled before any API exposes a value. A circuit layout
always needs an explicit version; absence means unknown, not zero.

The table intentionally does not use a polymorphic foreign key: `entity_kind` selects
one of several existing historical entity tables. The future write service must resolve
`entity_id` to the correct entity table before insert, and must enforce the Python
contract in `packages/historical-facts/validate.py`. The database checks provide
defense in depth, not full URL/JSON/SVG or media-license validation.

Run the migration in a disposable database first:

```sh
DATABASE_URL=postgresql://... python3 packages/database/scripts/migrate.py
DATABASE_URL=postgresql://... bash packages/database/scripts/test-historical-facts-storage.sh
```

The test inserts only synthetic examples inside a rollback transaction. It still runs
the normal migration runner first; **never point it at production**. Migration
`0007_ci_temp.sql` is reserved by the existing versioned-migration regression test;
this change uses `0008_historical_facts.sql` and must be checked against all migration
files before merge. No import, API route, UI, or public release is authorized by this PR.
