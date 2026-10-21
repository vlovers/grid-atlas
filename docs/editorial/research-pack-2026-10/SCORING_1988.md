# 1988 — how the championship points differ from race points

**Internal fact-check/research explainer, not approved editorial copy.**

## English

Alain Prost accumulated 105 race-result points, compared with Ayrton Senna's 94, but the official drivers' championship finished Senna 90, Prost 87. Under the historical *best eleven race results* scoring convention, points from only a driver's eleven highest-scoring finishes were counted toward the championship. Recalculating from the sixteen official driver-result rows gives exactly those two final totals. This matters: a cumulative chart based on every race point would incorrectly suggest the championship's final order.

## Українською

Ален Прост набрав 105 очок за результатами окремих перегонів, тоді як Айртон Сенна — 94. Проте в офіційному заліку чемпіонату Сенна здобув 90 очок, а Прост — 87. За історичним правилом *одинадцяти найкращих результатів* у залік чемпіонату входили лише одинадцять найрезультативніших фінішів кожного пілота. Перерахунок шістнадцяти результатів відтворює офіційні підсумки. Графік, побудований із простої суми всіх очок, помилково показував би інший порядок лідерів.

Both paragraphs are original **drafts**, not published or human approved.

## Calculated figures

| Driver | Points across races | Counted best eleven | Discarded |
| --- | ---: | ---: | ---: |
| Senna | 94 | 90 | 4 |
| Prost | 105 | 87 | 18 |

Primary **classification** evidence: [Official 1988 F1 drivers' standings](https://www.formula1.com/en/results/1988/drivers).
Race-row inputs: [Senna results](https://www.formula1.com/en/results/1988/drivers/AYRSEN01/ayrton-senna) and [Prost results](https://www.formula1.com/en/results/1988/drivers/ALAPRO01/alain-prost).
The historical best-eleven rule is widely documented in secondary chronologies, but a period FIA regulations primary text has **not been independently reviewed here**. Do not mark the regulatory explanation as source-approved.

Run `python3 scripts/calculate-1988-counted-points.py` and `python3 -m unittest discover -s tests -p 'test_editorial_1988_counted_points.py' -v`.

For a future visualisation, label *race points earned* and *championship points counted* separately. The model deliberately calculates without producing public runtime content or changing any editorial approval flags.
