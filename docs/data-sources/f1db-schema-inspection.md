# F1DB schema inspection — verified examples

Date: 2026-10-18. Source repository: [f1db/f1db](https://github.com/f1db/f1db).

Historical inspection notes below describe that stage of the project. The archive-retrieval and PostgreSQL blockers at the end have since been resolved; see [current measured evidence](../beta-audit.md) and [pinned release results](f1db-v2026.17.0-results.md). Independent editorial approval and full semantic verification remain outstanding.

## Actual upstream files inspected

- [Constructor chronology JSON Schema](https://github.com/f1db/f1db/blob/main/src/schema/current/splitted/f1db-constructors-chronology.schema.json), schema ID `v6.5.0`.
- [Entrant JSON Schema](https://github.com/f1db/f1db/blob/main/src/schema/current/splitted/f1db-entrants.schema.json), schema ID `v6.5.0`.
- [Red Bull constructor YAML](https://github.com/f1db/f1db/blob/main/src/data/constructors/red-bull.yml).
- [Jaguar constructor YAML](https://github.com/f1db/f1db/blob/main/src/data/constructors/jaguar.yml).

Note: these are source files at the repository default branch at inspection time, **not verified contents of the pinned v2026.17.0 release zip**. The latter still requires downloaded-archive/checksum testing.

## Observed structures

Constructor chronology is an array with required `parentConstructorId`, `positionDisplayOrder`, `constructorId`, `yearFrom`, `yearTo` (nullable); IDs are strings and display order is >= 1.

Entrants have required string `id` and `name`. Entrant identity must not be conflated with constructor identity.

F1DB's `red-bull.yml` explicitly includes the following **dataset-supplied constructor chronology**:

| Constructor | Start | End |
| --- | ---: | ---: |
| stewart | 1997 | 1999 |
| jaguar | 2000 | 2004 |
| red-bull | 2005 | null |

`jaguar.yml` also lists that complete sequence. This validates a *chronology display chain* present in F1DB, **not** corporate ownership, trademark continuity, or unequivocal legal successor status.

## Implications for Grid Atlas

1. Import source chronology as source-attributed chronology **without converting it to `acquired_by` or legal succession**.
2. Model separate entrant and constructor identities and use typed relations with provenance.
3. Version imported facts so source updates and reviewed editorial corrections can coexist.
4. Present unknown end year as open-ended, not the release date.
5. Do not define production migration tables until real release data keys and cardinalities are measured.

## Remaining blockers

- Release archive retrieval and SHA-256 verification are not yet complete; the local execution environment cannot reach public GitHub release binaries, and the repository connector handles UTF-8 GitHub resources, not zipped archive extraction.
- Historical data counts, duplicate-key rates, nullability observations and foreign key orphan rates remain **unmeasured**.
- Example lineage cases need independent evidence for organization/ownership changes.
- Real PostgreSQL import and integration testing have **not** run.

These are explicit blockers to marking the audit finished, not signs that the data itself is defective.
