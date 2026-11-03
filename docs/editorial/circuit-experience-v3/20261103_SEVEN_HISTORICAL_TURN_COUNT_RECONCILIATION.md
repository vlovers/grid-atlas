# Seven historic routes — turn-count and era reconciliation

**3 November 2026 · PR #395 · research-only; NOT FIA-numbered guides**

Twelve source-attributed count observations were checked for **four** historical venues; **three** other routes retain an explicit evidence gap. No new bend or name is asserted. The original **53 period bend studies + 13 named features** and the **71/78 candidate guides / 1,015 candidate positions** remain unchanged. BATCH_01/02 are not duplicated.

| Route | Observations | Decision |
| --- | --- | --- |
| Dallas 1984, `dallas-1` | [Lap Ledger](https://lapledger.org/circuits/dallas) F1DB layout **23** vs same-page headline **24**; [RacingCircuits](https://www.racingcircuits.info/north-america/usa/dallas-fair-park.html) **12 main corners PLUS chicanes** | Three counting conventions, no authenticated apex crosswalk. |
| Ain-Diab 1958, `ain-diab-1` | [Lap Ledger](https://lapledger.org/circuits/ain-diab) F1DB **18** vs headline **15**; [F1-Fansite](https://www.f1-fansite.com/f1-circuits/ain-diab-circuit-layout-records/) **11** | Disputed conventions; no numbered 1958 map. |
| Clermont-Ferrand / Charade 1972, `clermont-ferrand-1` | [Lap Ledger](https://lapledger.org/circuits/charade) F1DB original **48** vs headline **51**. [Official venue](https://www.charade.fr/circuit/presentation/) **18** refers to the shortened **3.975-km post-1989** course | Modern 18 **excluded** from 1972; old 8.055-km count unresolved. |
| Detroit 1982, `detroit-1` | [Lap Ledger](https://lapledger.org/circuits/detroit) F1DB 1982 **24**; later `detroit-2` F1DB **22**, page headline **17**. [RacingCircuits](https://www.racingcircuits.info/north-america/usa/detroit.html) distinguishes 1982 vs 1983–1988 | Later counts **excluded** from 1982; 24 is not FIA per-apex evidence. |
| Pescara 1957 | No additional authenticated count comparison | Continue checking historic map and Esse di Cappelle ambiguity. |
| Porto 1958–1960 | No additional authenticated count comparison | Check period-specific route and chicane geometry. |
| Sebring 1959 | No additional authenticated count comparison | Do not substitute later endurance-layout numbering. |

**EN:** A number of bends is not a sequence of independently verified apex identities. Different counts, even on one source page, are not independent corroboration. Preserve each source's counting convention and year.

**UK:** Кількість поворотів — не послідовність незалежно підтверджених апексів. Різні числа, навіть на одній сторінці, не є незалежним підтвердженням. Зберігати правило підрахунку й рік кожного джерела.

Engineering: `circuit-historical-counts.ts` stores each source URL, locator, count basis, layout, period and bilingual caveat. The existing seven-route `historicalCornerEvidenceWorklistByCircuit` now exposes `corner_count_reconciliation`; a regression test checks the 12 observations, seven fail-closed routes and excluded later layouts. No public UI or release manifest was changed.

**Media:** External source diagrams and photographs are links only; no copying, embedding or relicensing. The F1DB/Jules Roy CC BY 4.0 outline attribution does not grant rights to other publishers' images. Numbered maps, individual apex crosswalks, independent human review, image rights and publication remain **unapproved**.

Validation: `node --test tests/circuit-historical-count-reconciliation-20261103.test.mjs tests/circuit-66-evidence-worklist-and-pescara-20261103.test.mjs`. Check exact-head GitHub CI.
