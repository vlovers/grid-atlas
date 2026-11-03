# Seven historic routes — turn-count and era reconciliation

**3 November 2026 · PR #395 · research-only; NOT FIA-numbered guides**

Seventeen source-attributed count observations now cover **all seven** historical venues. Five venues have competing same-layout numbers; two have only one recorded count. None has an authenticated period-numbered apex map. No new bend or name is asserted. The original **53 period bend studies + 13 named features** and the **71/78 candidate guides / 1,015 candidate positions** remain unchanged. BATCH_01/02 are not duplicated.

| Route | Observations | Decision |
| --- | --- | --- |
| Dallas 1984, `dallas-1` | [Lap Ledger](https://lapledger.org/circuits/dallas) F1DB layout **23** vs same-page headline **24**; [RacingCircuits](https://www.racingcircuits.info/north-america/usa/dallas-fair-park.html) **12 main corners PLUS chicanes** | Three counting conventions, no authenticated apex crosswalk. |
| Ain-Diab 1958, `ain-diab-1` | [Lap Ledger](https://lapledger.org/circuits/ain-diab) F1DB **18** vs headline **15**; [F1-Fansite](https://www.f1-fansite.com/f1-circuits/ain-diab-circuit-layout-records/) **11** | Disputed conventions; no numbered 1958 map. |
| Clermont-Ferrand / Charade 1972, `clermont-ferrand-1` | [Lap Ledger](https://lapledger.org/circuits/charade) F1DB original **48** vs headline **51**. [Official venue](https://www.charade.fr/circuit/presentation/) **18** refers to the shortened **3.975-km post-1989** course | Modern 18 **excluded** from 1972; old 8.055-km count unresolved. |
| Detroit 1982, `detroit-1` | [Lap Ledger](https://lapledger.org/circuits/detroit) F1DB 1982 **24**; later `detroit-2` F1DB **22**, page headline **17**. [RacingCircuits](https://www.racingcircuits.info/north-america/usa/detroit.html) distinguishes 1982 vs 1983–1988 | Later counts **excluded** from 1982; 24 is not FIA per-apex evidence. |
| Pescara 1957, `pescara-1` | [Lap Ledger](https://lapledger.org/circuits/pescara) F1DB **24**; same-page headline also **24** | Single derivative page, not independent confirmation. Esse di Cappelle geometry remains unresolved. |
| Porto 1958–1960, `porto-1` | [Lap Ledger](https://www.lapledger.org/circuits/porto) F1DB layout **19** vs same-page headline **14** | Competing conventions on one publisher's page. No numbered period crosswalk; check tramway and chicane geometry. |
| Sebring 1959, `sebring-1` | [Lap Ledger](https://lapledger.org/circuits/sebring) F1DB **17** vs same-page headline **12** | The 1959 8.36-km airfield layout must not be conflated with the later ~3.7-mile course or its modern Turn 17. |

**EN:** A number of bends is not a sequence of independently verified apex identities. Different counts, even on one source page, are not independent corroboration. Preserve each source's counting convention and year.

**UK:** Кількість поворотів — не послідовність незалежно підтверджених апексів. Різні числа, навіть на одній сторінці, не є незалежним підтвердженням. Зберігати правило підрахунку й рік кожного джерела.

Engineering: `circuit-historical-counts.ts` stores each source URL, locator, count basis, layout, period and bilingual caveat. Its per-route projection also exposes `distinct_source_pages`, `same_page_count_conflicts`, and a permanently false period-map authentication flag. The seven-route `historicalCornerEvidenceWorklistByCircuit` exposes this review; regression tests cover **17 observations**, seven fail-closed routes, five same-page conflicts, and excluded later layouts. A source family label does **not** make two numbers on the same page independent. No public UI or release manifest was changed.


## 3 November follow-up — three missing circuits closed as *count observations*, not guides

**EN:** Pescara has one reported 24-turn count; Porto has **14 vs 19** and Sebring has **12 vs 17** on their respective single Lap Ledger pages. These are disagreements between fields or counting conventions, **not** two independent corroborations. Dallas, Ain-Diab and Charade also contain same-page disagreements; Detroit's later-era counts are excluded rather than merged. There are now **five unresolved count disagreements across seven routes**, and **zero authenticated FIA turn-number sequences**.

**UK:** Для Пескари знайдено один показник — **24 повороти**; для Порту на одній сторінці наведено **14 і 19**, а для Себринга — **12 і 17**. Це розбіжності між полями або правилами підрахунку, **а не два незалежні підтвердження**. Для Далласа, Айн-Діаба та Шаради також зафіксовано внутрішні суперечності джерел; пізніші конфігурації Детройта не змішуються з 1982 роком. П'ять із семи трас мають невирішені суперечності щодо кількості, **жодна не має незалежно підтвердженої нумерації поворотів FIA**.

### Official race evidence is not geometry evidence

The official [1957 Pescara result](https://www.formula1.com/en/results/1957/races/156/pescara/race-result) dates the Grand Prix to **18 August 1957**; the official [1960 Portuguese result](https://www.formula1.com/en/results/1960/races/185/portugal/race-result) dates the Boavista race to **14 August 1960**; the official [1959 US starting grid](https://www.formula1.com/en/results/1959/races/177/united-states/starting-grid) dates the Sebring event to **12 December 1959**. These establish event and venue context only. **None** certifies a 24-, 19-, 17-, 14- or 12-turn FIA chart. Beware erroneous sources that place the 1959 Sebring F1 race in March.

**UK:** Офіційні результати Формули-1 підтверджують дати перегонів і місця проведення, але **не** підтверджують кількість чи нумерацію апексів. Зокрема, Гран-прі США в Себрингу відбувся **12 грудня 1959 року**, а не в березні.

**Rights:** We retain source URLs and original EN/UK research notes only. No external map, photograph, screenshot, tracing, or other publisher's copyrighted artwork was copied. F1DB/Jules Roy outline attribution cannot authorize reuse of Lap Ledger screenshots, RacingCircuits maps or modern venue photography.

**Media:** External source diagrams and photographs are links only; no copying, embedding or relicensing. The F1DB/Jules Roy CC BY 4.0 outline attribution does not grant rights to other publishers' images. Numbered maps, individual apex crosswalks, independent human review, image rights and publication remain **unapproved**.

Validation: `node --test tests/circuit-historical-count-reconciliation-20261103.test.mjs tests/circuit-66-evidence-worklist-and-pescara-20261103.test.mjs`. Check exact-head GitHub CI.
