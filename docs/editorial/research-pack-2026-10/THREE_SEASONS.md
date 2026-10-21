# Three historical seasons — visual storytelling research

**Nonpublic editorial material** · Checked source links on 2026-10-21 · Human review **not** performed

This extends the five-driver pack with twelve original bilingual scene concepts and six narrowly scoped official-result observations, now covering the other three driver pilots. These are not public biographies or permissions to publish.

| Driver | Target season | Classification from Formula 1 | Recorded case study | Exact references |
| --- | --- | --- | --- | --- |
| Michael Schumacher | 2000 | 108 points, ahead of Mika Häkkinen on 89 | Japan, 8 October, position 1 | [standings](https://www.formula1.com/en/results/2000/drivers), [race-by-race driver results](https://www.formula1.com/en/results/2000/drivers/MICSCH01/michael-schumacher) |
| Lewis Hamilton | 2008 | 98 points, ahead of Felipe Massa on 97 | Brazil, 2 November, position 5 | [standings](https://www.formula1.com/en/results/2008/drivers), [race-by-race driver results](https://www.formula1.com/en/results/2008/drivers/LEWHAM01/lewis-hamilton) |
| Max Verstappen | 2023 | 575 points, ahead of Sergio Pérez on 285 | Singapore, 17 September, position 5 | [standings](https://www.formula1.com/en/results/2023/drivers), [race-by-race driver results](https://www.formula1.com/en/results/2023/drivers/MAXVER01/max-verstappen) |

Do not equate season summary standings with sum of imported result rows. The driver tables contain point allocations with distinct race/sprint rules in some eras. These records do not validate official start totals, transfer contracts, motivation, technical causes or wider championships outside the narrowly sourced season.

## Visual presentation concept

A split cover pairs the driver's original typographic artwork with a season-specific race-progress strip. Subsequent chapters use recorded event moments, with a side-by-side runner-up classification comparison and an explicit evidence drawer. The four chapter scenes and UK/EN headings are in each JSON. Their text is *not* approved prose and they are not wired into any runtime code.

## Release blockers

1. Match exact imported canonical driver keys and race identifiers using the pinned F1DB release; run SQL/API reconciliation for year, driver, race, position and team/constructor semantics.
2. Have an independent human review each source context, statement wording, translation, and whether the chosen episode is editorially meaningful.
3. Keep images under existing media-rights registry with individually checked license, creator, attribution and modifications.
4. Route approved immutable revisions through the existing editorial publication system; never simply import these JSON files as public articles.

## Verification

```sh
python3 scripts/validate-driver-season-evidence.py
python3 -m unittest discover -s tests -p 'test_editorial_season_evidence.py' -v
```

This pack is intentionally independent from the Codex Explorer/Time Machine work. It only changes editorial research documents, validators and unit tests.
