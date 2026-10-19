# Senna 1988 — source-to-statistic cross-check

Status: research note, not human editorial approval.

## Data provenance

Grid Atlas's existing audit pins F1DB **v2026.17.0** and asset `f1db-json-splitted.zip`, SHA-256 `0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`. See `docs/data-sources/f1db-v2026.17.0-results.md`.

**Not yet done:** extract Senna's individual race rows from that pinned artifact and compare them field by field. Do not describe the following Formula 1 website comparison as a completed F1DB reconciliation.

## Direct official table observations

| Metric | Ayrton Senna | Alain Prost | Source / interpretation |
| --- | ---: | ---: | --- |
| 1988 championship position | 1 | 2 | [Formula 1 official final standings](https://www.formula1.com/en/results/1988/drivers) |
| 1988 championship points | 90 | 87 | Same table; counted points, not necessarily raw season sum |
| Race wins | 8 | 7 | Counted winner names in the [16-round 1988 race results table](https://www.formula1.com/en/results/1988/races) |
| 1988 pole positions | 13 | 2 | Counted winner names in the [official pole-position awards table](https://www.formula1.com/en/results/1988/awards/pole-positions) |

The remaining race win was Gerhard Berger at the Italian Grand Prix; the remaining pole was Gerhard Berger at the British Grand Prix.

## Scoring nuance to verify before publication

The 1988 championship used an 11-best-results counting rule. A comparison of season points must distinguish total earned points from points counted in the official championship standings. Confirm the exact rule from period regulations or a reliable historical rules reference before including any explanatory numeric comparison in a published article.

## Required F1DB reconciliation

1. Download the **pinned** audited F1DB release asset and validate its SHA-256.
2. Resolve Ayrton Senna and Alain Prost to their canonical driver IDs.
3. Extract 1988 race-result rows and independently calculate wins and poles under documented race-result and qualifying semantics.
4. Compare season classification and counted points to the Formula 1 tables above.
5. Record any mismatches (including disqualifications, non-starts and dropped scores) explicitly; do not overwrite the source data.
6. Have a named human editor review the resulting claim evidence and approve only the precisely supported wording.

No new claim has been marked `verified`; this note must not be automatically ingested into published biography content.
