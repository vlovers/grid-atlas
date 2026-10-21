# 1988 — A season told through sixteen race winners

**Internal research draft, not publication-approved.** Sources opened 2026-10-21. No F1DB SQL parity or human review is claimed.

## Original story opening — English

Sixteen Grands Prix, three winning drivers and two McLaren teammates at the top of the final standings. Official race results cannot explain everything the drivers thought or why individual events unfolded. But they let us follow the season, race by race, and distinguish its sequence of winners from the final championship classification.

## Оригінальний вступ — українською

Шістнадцять Гран-прі, троє переможців і два напарники McLaren на чолі підсумкової таблиці. Офіційні результати не можуть пояснити всі думки гонщиків або причини кожної події. Але завдяки їм ми можемо простежити сезон гонка за гонкою та відрізнити послідовність переможців від підсумкової класифікації чемпіонату.

These paragraphs are drafts and require independent claim and language review.

## Five interactive chapters

1. **Early exchanges / Перші етапи:** Brazil through Mexico, four dated results.
2. **The summer sequence / Літня серія:** Canada through Belgium, seven dated results.
3. **Italy changes the pattern / Італія змінює хід подій:** Berger wins in Italy. No unsourced assumptions about mechanical causes or rivals' intentions.
4. **Closing races / Фінальні перегони:** Portugal, Spain, Japan and Australia.
5. **Final classification / Підсумкова класифікація:** Senna 90 points, Prost 87. Official championship values, not raw season result sums.

## Race winners (official table transcription)

| Round | Date 1988 | Grand Prix | Winner |
|---:|---|---|---|
| 1 | 03 Apr | Brazil | Prost |
| 2 | 01 May | San Marino | Senna |
| 3 | 15 May | Monaco | Prost |
| 4 | 29 May | Mexico | Prost |
| 5 | 12 Jun | Canada | Senna |
| 6 | 19 Jun | Detroit | Senna |
| 7 | 03 Jul | France | Prost |
| 8 | 10 Jul | Great Britain | Senna |
| 9 | 24 Jul | Germany | Senna |
| 10 | 07 Aug | Hungary | Senna |
| 11 | 28 Aug | Belgium | Senna |
| 12 | 11 Sep | Italy | Berger |
| 13 | 25 Sep | Portugal | Prost |
| 14 | 02 Oct | Spain | Prost |
| 15 | 30 Oct | Japan | Senna |
| 16 | 13 Nov | Australia | Prost |

Sources: [Official 1988 race results](https://www.formula1.com/en/results/1988/races), [Official 1988 driver classification](https://www.formula1.com/en/results/1988/drivers). Dates, rounds and winner keys are preserved structurally in `season-1988-winners.json`; no copied historical photos or third-party race narratives.

## Engineering and historical restrictions

Use exact canonical race identifiers from the pinned F1DB import before any runtime integration. No inferred driver contracts, championship calculation from raw points, race incident causation, invented quotes, photographs or unapproved prose. Existing editorial approvals and licensing gates must be preserved. The race list is a **winner-only** table, not a comprehensive race result ledger. This version is a private editor's research treatment.

Validation: `python3 scripts/validate-1988-winner-timeline.py`; `python3 -m unittest discover -s tests -p 'test_editorial_1988_timeline.py' -v`.
