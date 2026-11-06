# Historical map provenance and media-rights gate — seven remaining routes

**3 November 2026 · PR #395 · research only; no new authenticated FIA-numbered turns.**

This batch adds **15 individual source-role/rights records** across the seven historical routes. They are joined to the actual 66-claim engineering review worklist, not just filed as a disconnected research note. None is a certified period numbered-apex map. The 71/78 candidate guides and 1,015 research positions remain unchanged; seven historical circuits are still incomplete.

| Exact historical layout | Linked evidence and role | Map / image decision |
| --- | --- | --- |
| Ain-Diab 1958 (`ain-diab-1`) | [Motor Sport 1958](https://www.motorsportmagazine.com/archive/article/november-1958/14/grand-prix-du-maroc-2/) period race report; [Formula 1 result](https://www.formula1.com/en/results/1958/races/168/morocco/race-result) classification only | Neither numbers individual apices; no copied art. |
| Charade 1972 (`clermont-ferrand-1`) | [RacingCircuits](https://www.racingcircuits.info/europe/france/charade.html) historical outline; [official venue](https://www.charade.fr/circuit/presentation/) modern short course | Do not backdate the post-1989 18-turn circuit to 1972. |
| Dallas 1984 (`dallas-1`) | [RacingCircuits](https://www.racingcircuits.info/north-america/usa/dallas-fair-park.html) 12 main bends plus chicanes; [Formula 1 result](https://www.formula1.com/en/results/1984/races/474/dallas/race-result) classification only | Neither authenticates 15 individually unlocated bends. |
| Detroit 1982 (`detroit-1`) | [RacingCircuits](https://www.racingcircuits.info/north-america/usa/detroit.html) layout history; [Formula 1 result](https://www.formula1.com/en/results/1982/races/443/detroit/race-result) classification only | 1983–1988 and modern maps cannot be silently reused. |
| Pescara 1957 (`pescara-1`) | [RacingCircuits](https://www.racingcircuits.info/europe/italy/pescara.html) later reconstruction; [Formula 1 result](https://www.formula1.com/en/results/1957/races/156/pescara/race-result) event only | Esse di Cappelle location remains ambiguous. |
| Porto 1958–1960 (`porto-1`) | [Motor Sport 1958](https://www.motorsportmagazine.com/archive/article/october-1958/31/vii-grande/) contemporary report; [Formula 1 result](https://www.formula1.com/en/results/1960/races/185/portugal/race-result) classification only | Tramway/chicane prose does not resolve 14-vs-19 apex counts. |
| Sebring 1959 (`sebring-1`) | [Motor Sport 1960](https://www.motorsportmagazine.com/archive/article/january-1960/16/the-first-grand-prix-of-the-united-states/) period route report; [Commons 2010 map](https://commons.wikimedia.org/wiki/File:Circuit_Sebring_1959.svg) later illustration; [Formula 1 result](https://www.formula1.com/en/results/1959/races/177/united-states/race-result) classification only | 2010 map is not an FIA 1959 numbered chart. No asset imported. |

**Rights finding:** Wikimedia Commons attributes the Sebring 1959 SVG to **Oliver Pohlmann**, dated **7 February 2010**, and offers **CC BY-SA 3.0 Unported**, **CC BY-SA 3.0 Germany**, and **GFDL 1.2+** alternatives (file page, Licensing / Original upload log). This is a conditional artwork licence, **not** historical-numbering authentication, project reuse approval, or permission to reuse unrelated publishers' maps. The site still copies **zero** assets from these 15 references.

**EN:** An official race result establishes classification, not geometry. A venue's modern map establishes a different era, not a historical numbered crosswalk. A separately licensed later reconstruction is still not a period FIA source. Treat all references as links until both claim-level historical review and media-rights review are complete.

**UK:** Офіційний результат перегонів підтверджує класифікацію, а не геометрію. Сучасна схема автодрому стосується іншої епохи, а не нумерації історичних апексів. Навіть пізніша схема з окремою ліцензією не стає джерелом FIA тієї епохи. До завершення перевірки фактів і прав усі матеріали залишаються лише посиланнями.

**Engineering:** `circuit-historical-map-audit.ts` stores 15 per-source role, period, layout, licence and EN/UK limitations. `circuit-historical-review.ts` joins the audit to all seven worklist rows. `circuit-historical-counts.ts` now canonicalizes `www`, query strings, fragments and trailing slashes when grouping publisher pages, preventing false independent corroboration from URL variants. New regression tests cover these boundaries and the zero-publication gate. No BATCH_01/02 files, site assets, public API, approval flags or release manifests changed.

Run `node --test tests/circuit-historical-map-provenance-20261103.test.mjs tests/circuit-historical-count-reconciliation-20261103.test.mjs`. Full GitHub Actions must be evaluated on the **exact new head SHA** before merge.
