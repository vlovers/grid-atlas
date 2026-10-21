# 1988 points race — chart research contract

The new chart producer computes two distinct series for each of 16 rounds:

- **Raw cumulative race points**: adds each published driver-page result, including points that are not part of the final classification.
- **Best-eleven cumulative points**: sums the eleven largest recorded race-point results *up to that round*. This is an explanatory back-calculation, **not an independently sourced real-time official championship standings series**.

At season end, official driver standings are reproduced: Senna 90, Prost 87, versus summed race scores 94 and 105. [Official Senna driver results](https://www.formula1.com/en/results/1988/drivers/AYRSEN01/ayrton-senna), [Prost driver results](https://www.formula1.com/en/results/1988/drivers/ALAPRO01/alain-prost), [Final standings](https://www.formula1.com/en/results/1988/drivers). Historic regulation corroboration with a contemporaneous FIA document and independent editorial approval are still blockers.

A future UK/EN visualization must disclose both line meanings, the dropped-score logic, source links, and the difference between a back-calculated curve and official contemporary leaderboards. No publication or rights approval is implied. Outputs currently remain local research only.

```sh
python3 scripts/build-1988-points-chart.py
python3 -m unittest discover -s tests -p 'test_editorial_1988_points_chart.py' -v
```
