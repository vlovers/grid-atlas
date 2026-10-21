# 1988 archival race cards — nonpublic export

This pipeline turns a **successful real PostgreSQL/F1DB parity report** into 16 structured, bilingual *research cards*. It does not generate or approve historical narratives.

## What is new

- Real archive workflow first imports pinned checksum-verified F1DB `v2026.17.0` to disposable PostgreSQL.
- `scripts/reconcile-1988-f1db.py` checks 16 race dates and winners, canonical external race IDs and Senna/Prost result rows, then creates a JSON report.
- `scripts/build-1988-editorial-cards.py` accepts that report only if its discrepancy list is empty, the archive release matches and all 16 race records and both pilot identities are present. It exports headlines for UK/EN, row-level results, constructor external IDs and an explicit *not approved* status.
- Seven offline tests cover wrong release, missing identity, duplicate driver results, broken race and failed reconciliation.

## Manual reproduction

```sh
# After checksum-verified import into disposable PostgreSQL
DATABASE_URL=postgresql://... python3 scripts/reconcile-1988-f1db.py --output /tmp/grid-atlas-1988-parity.json
python3 scripts/build-1988-editorial-cards.py \
  --parity /tmp/grid-atlas-1988-parity.json \
  --output /tmp/grid-atlas-1988-editorial-cards.json
python3 -m unittest discover -s tests -p 'test_editorial_1988_cards.py' -v
```

The generated JSON goes to `/tmp` in CI, **never** the public Next.js asset directory. It is deliberately not imported into the runtime or used as publication permission. No numeric internal database IDs are assumed for portable URLs.

## What this does not prove

- Official driver starts, championship point totals or contracts.
- Incidents, motives, causality or race narrative history.
- Independent historical source validation, translation sign-off or photographic rights.
- That a green CI alone is enough to publish an article.

Once review is complete, map canonical race and driver references to the existing public API; pass prose and assets only through their existing editorial/media approval gates. Until then, the website remains unchanged.
