# Senna and Prost — evidence-led story treatment (research draft)

**Internal only · not a publishable article · 2026-10-21**

## The story question

How did one shared McLaren season produce two different, equally visible statistical perspectives? The goal is not to turn two rivals into an invented psychological drama. Instead, lead readers through what the official **1988 results and championship classification** actually say, with links back to original tables.

## Visual journey (UK and EN)

| Scene | English microcopy / headline | Український заголовок | Evidence |
|---|---|---|---|
| Prelude: Estoril, 1985 | A victory in Portugal | Перемога в Португалії | [Official 1985 race classification](https://www.formula1.com/en/results/1985/races/483/portugal/race-result) |
| One season, two paths | 1988: two drivers, one constructor | 1988: два пілоти, один конструктор | [1988 driver classification](https://www.formula1.com/en/results/1988/drivers) |
| Sixteen race outcomes | Eight, seven, one: winners across the season | Вісім, сім, один: переможці сезону | [1988 winners table](https://www.formula1.com/en/results/1988/races) |
| The classification | 90 versus 87 in the official standings | 90 проти 87 в офіційній класифікації | [1988 driver classification](https://www.formula1.com/en/results/1988/drivers) |
| The next chapter | 1989 Japanese Grand Prix: a result is not the whole story | Гран-прі Японії 1989: результат — це не вся історія | [1989 race winners](https://www.formula1.com/en/results/1989/races) |

**Important:** headings are working editorial treatments, not individually authorized claims. The corresponding narrow statement IDs, original bilingual wordings, exact source locators and review status live in `senna-prost-source-observations.json`.

## Proposed interaction

1. Large typographic cover and 1988 season selection, without real photographs unless specifically cleared.
2. Interactive vertical race rail for all 16 Grands Prix using actual API result records (bounded server pagination if needed). A switch shows Senna, Prost or both, with legend and accessible text table. Never confuse race-win count with championship-points totals.
3. Side-by-side official standings **90 / 87**, explicitly labeled *classification*, and a source disclosure explaining this is not a raw sum of all season-result points.
4. Evidence drawer for individual races, including canonical race link and source. Do not imply those imported results alone establish contracts or official championship decisions.
5. End on a research prompt about 1989 Suzuka; do **not** narrate incident fault, intent, sanctions or detailed race circumstances without independent primary documents.

## Boundaries and publication checklist

- Reconcile official external source observations with pinned F1DB v2026.17.0 before applying narrative copy to real pages.
- Obtain independent editorial approval of each stable claim ID and both translations, with source access-date and revision trail.
- Add authoritative evidence before explaining dropped scores, Suzuka controversies or incidents.
- Photographs, helmets, cars, F1 branding and circuit diagrams need case-by-case image rights checks.
- Existing editorial approval API remains the only publication mechanism. These Markdown/JSON files are not connected to the website.

**Verification commands:** `python3 scripts/validate-editorial-source-observations.py` and `python3 -m unittest discover -s tests -p 'test_editorial_source_observations.py' -v`.
