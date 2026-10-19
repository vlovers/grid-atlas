# Silverstone lineage: source identity mapping

Research status: **source IDs confirmed in upstream F1DB main, not editorially verified lineage claims**. Confirm these identifiers in the pinned **v2026.17.0 split JSON archive** and in the local imported database before importing a manifest. Upstream main can change.

| Constructor era | F1DB constructor external ID | Approximate start |
| --- | --- | --- |
| Jordan | `jordan` | 1991 |
| Midland | `midland` | 2006 |
| Spyker | `spyker` | 2007 |
| Force India | `force-india` | 2008 |
| Racing Point | `racing-point` | 2018/2019: investigate identity boundary |
| Aston Martin | `aston-martin` | 2021 |

Each of the six upstream constructor YAML files has an `id` field matching the table above and includes a shared `chronology` array. **That upstream chronology is evidence of F1DB's grouping, not independent proof of legal continuity or a particular typed edge.** Do not automatically turn its adjacency into `renamed_to` claims.

Source files:
- https://github.com/f1db/f1db/blob/main/src/data/constructors/jordan.yml
- https://github.com/f1db/f1db/blob/main/src/data/constructors/midland.yml
- https://github.com/f1db/f1db/blob/main/src/data/constructors/spyker.yml
- https://github.com/f1db/f1db/blob/main/src/data/constructors/force-india.yml
- https://github.com/f1db/f1db/blob/main/src/data/constructors/racing-point.yml
- https://github.com/f1db/f1db/blob/main/src/data/constructors/aston-martin.yml

## Entrants are different identities

F1DB has separate entrant identities including `force-india-f1-team`, `racing-point-force-india-f1-team`, `sportpesa-racing-point-f1-team`, `bwt-racing-point-f1-team`, and multiple Aston Martin title-sponsored entrant IDs. These are *entry names*, not necessarily successive legal entities. Do not automatically connect them.

The 2018 Force India administration and asset purchase **must not be modeled as a simple rename**. Historical Aston Martin 1959–1960 branding also does not establish the same organizational identity.

## Next verification

1. Import the pinned F1DB archive into a disposable PostgreSQL database.
2. Run `bash packages/database/scripts/audit-silverstone-identities.sh` with `DATABASE_URL`.
3. Compare external IDs to the pinned archive, not only to upstream main.
4. Research **each** proposed relationship using its own primary reporting, choosing an accurate relation type.
5. Build a portable proposed-claim JSON manifest; import with `import-proposed-lineage.py`.
6. Independently review and verify claims before they can appear in the public lineage API.

See [historical research](silverstone-team-lineage.md) for F1 reporting and historical cautions. No claims are seeded or automatically verified here.
