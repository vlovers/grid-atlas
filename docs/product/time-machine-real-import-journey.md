# Time Machine — real-import review journey

This is a human review checklist for the UI against the pinned F1DB import. The automated browser suite uses explicitly synthetic fixtures and does not establish historical correctness.

## Run against a genuine import

Use the ephemeral database and pinned archive setup from the [real-archive workflow](../../.github/workflows/real-archive.yml). Start the API and web application with that database, then open `/uk/time-machine` or `/en/time-machine`.

1. Search for a driver or constructor and select its canonical archive identity.
2. Compare two different imported seasons. Include at least one pair of adjacent seasons and one pair with a gap.
3. Confirm every association shown is present in the Time Machine response for the selected focus and seasons. Check `added`, `removed`, and `unchanged` against the API’s `from` and `to` values.
4. For each association with records in a season, open its season graph and race evidence. Confirm the evidence page lists the same driver, constructor, season and imported race-result records.
5. Repeat in the other locale and use browser Back to confirm the focus and both years are restored.
6. Check a focus with no imported rows in either selected season. The page must show an empty result state and must not describe the association as historically impossible.

The comparison reports imported result entries, distinct races and races with a winning result. None of these counts means official starts. Missing rows do not establish absence; constructors and championship entrants remain distinct identities. The API release and SQL-to-Explorer cross-check are documented in [the comparison contract](../api/time-machine-comparison.md).

The current real-archive CI journey validates API output against the pinned archive and tests Explorer evidence navigation. The Time Machine screen itself is covered by the synthetic UK/EN desktop/mobile browser suite; this checklist records the separate visual and evidence review to perform against the genuine import.
