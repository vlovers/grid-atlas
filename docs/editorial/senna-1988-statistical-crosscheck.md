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

The 1988 championship used an 11-best-results counting rule. [The Race's historical analysis](https://www.the-race.com/formula-1/what-happened-last-time-f1-used-dropped-scores/) reports **105 raw points for Prost and 94 for Senna**, reduced to **87 and 90 championship-counted points** respectively. Formula 1's [McLaren champions retrospective](https://www.formula1.com/en/latest/article/the-elite-group-norris-joins-as-a-mclaren-world-champion.5zxR12eN0M4IM0onxSXR0F.5zxR12eN0M4IM0onxSXR0F) independently confirms the best-11 rule and the 90–87 standings. These figures remain secondary-source observations pending exact calculation from the pinned F1DB race rows and editorial sign-off.

## Required F1DB reconciliation

1. Download the **pinned** audited F1DB release asset and validate its SHA-256.
2. Resolve Ayrton Senna and Alain Prost to their canonical driver IDs.
3. Extract 1988 race-result rows and independently calculate wins and poles under documented race-result and qualifying semantics.
4. Compare season classification and counted points to the Formula 1 tables above.
5. Record any mismatches (including disqualifications, non-starts and dropped scores) explicitly; do not overwrite the source data.
6. Have a named human editor review the resulting claim evidence and approve only the precisely supported wording.

No new claim has been marked `verified`; this note must not be automatically ingested into published biography content.

## Additional independently published source

- [The Race — What happened last time F1 used dropped scores?](https://www.the-race.com/formula-1/what-happened-last-time-f1-used-dropped-scores/): detailed explanation of the 1988 best-11 rule and raw-vs-counted totals. The Race is a separate publisher from Formula 1; this is corroboration, not proof that the pinned F1DB data has been reconciled.
- [Ayrton Senna historical archive — 1988 season](https://ayrton-senna.com/seasons/1988/): a further research candidate listing eight wins and thirteen poles; inspect provenance before treating it as independent.
