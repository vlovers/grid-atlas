# Auditing team identity mapping

Before creating lineage claims, apply the migrations and import real source data, then run:

```bash
DATABASE_URL=postgresql://... bash packages/database/scripts/audit-silverstone-identities.sh
```

The script performs **only SELECT statements** and prints source-qualified constructor and entrant identities for Jordan, Midland, Spyker, Force India, Racing Point, and Aston Martin, plus review-status counts. It does **not** establish continuity, insert claims, or promote a review status.

Review `docs/data-sources/silverstone-team-lineage.md` and check each proposed edge against its own primary source. Do not copy the local numeric IDs into portable fixtures: these vary between database installations. A production importer should resolve `(source slug, entity kind, external ID)` through `external_identities` and fail closed if zero or multiple matches exist. Current migrations intentionally contain no historical succession seed rows.

If a candidate is absent, the corresponding relationship cannot be published. The 2018 Force India transfer cannot be represented as a simple rename.
