# 1988 Senna / Prost — round-by-round evidence ledger

This pack adds **16 round-level comparisons** from Formula 1's official 1988 driver results tables, including displayed finish status and listed race points for both McLaren Honda drivers.

Sources: [Ayrton Senna 1988](https://www.formula1.com/en/results/1988/drivers/AYRSEN01/ayrton-senna) and [Alain Prost 1988](https://www.formula1.com/en/results/1988/drivers/ALAPRO01/alain-prost), matched against [official final classification](https://www.formula1.com/en/results/1988/drivers).

**Important historical distinction:** adding the listed race points gives Senna 94 and Prost 105. The official championship classification says Senna 90 and Prost 87. The imported F1DB `points` column and the official championship total are not interchangeable. A careful explanatory section on the period's points-counting rule still needs an authoritative regulations citation; do not present an unsourced explanation as checked.

`DNF` is Formula 1's display status, not PostgreSQL `position_number`. The ledger is research-only, includes exact per-driver source URLs, and has no human approval or public runtime connection.

Run `python3 scripts/validate-1988-duel-results.py` and `python3 -m unittest discover -s tests -p 'test_editorial_1988_duel_results.py' -v`. No photos or licensed media were imported.
