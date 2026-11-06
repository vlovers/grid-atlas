# Dallas 1984 — definitive versus provisional maps and conflicting direction

**3 November 2026 · PR #395 · research only; zero new authenticated numbered turns.**

The [1984 Rombo periodical catalog](https://www.gdecarli.it/php2/riviste.php?var1=2&var2=1&var3=1984&var4=) records a **definitive Dallas Grand Prix map in Rombo 9 (150), 28 February 1984, p. 13**, and a **provisional map in Rombo 12 (153), 20 March 1984, p. 12**. The catalog explicitly remarks that the definitive version had already appeared when the provisional version was printed. These are **catalog records, not inspected magazine scans**, and no turn numbers or reuse rights are verified.

The [historian's Dallas page](https://www.gdecarli.it/php2/circuit.php?var1=1993&var2=2) distinguishes the red reconstructed 1984 raced layout from green early proposals with a different start line, and describes the raced course as **anticlockwise**. [Lap Ledger](https://lapledger.org/circuits/dallas) instead calls it **clockwise**; its headline also counts 24 turns while its F1DB layout row counts 23. [RacingCircuits](https://www.racingcircuits.info/north-america/usa/dallas-fair-park.html) describes 12 main bends plus chicanes. These contradictory count conventions and direction labels cannot authenticate 15 individual Dallas apex descriptions.

The [official Formula 1 result](https://www.formula1.com/en/results/1984/races/474/dallas/race-result) confirms the 8 July 1984 event, Rosberg's victory and 67 winning laps; it does not establish course direction or apex numbering.

**EN — next verification:** Obtain the original 28 February definitive map and 20 March provisional map, distinguish their start/finish locations and compare both against authenticated raced-configuration documentation. Resolve the clockwise/anticlockwise discrepancy before accepting any individual left/right turn description. All 15 Dallas claim-specific passage gaps remain open. Do not import the magazine pages, reconstructions, maps or photographs without explicit rights clearance.

**UK — наступна перевірка:** Отримати оригінальну остаточну схему від 28 лютого та попередню від 20 березня, відрізнити стартові лінії та звірити обидві з автентичними документами конфігурації перегонів. Усунути суперечність щодо напрямку до затвердження описів окремих лівих і правих поворотів. Усі 15 індивідуальних прогалин у джерелах Далласа залишаються відкритими. Не імпортувати сторінки журналів, реконструкції, карти чи фото без окремої перевірки прав.

**Engineering:** Three new source-role records join the seven-route map/rights worklist. The separate typed module records two dated magazine leads and two incompatible directional claims, with explicit fail-closed verification and media flags. A regression test checks exact periods, versions, page references, directions and no-publication state. BATCH_01/02, public API, site assets and release approvals are unchanged.

Run `node --test tests/circuit-historical-map-provenance-20261103.test.mjs` and verify CI on the exact new PR head.
