# Dallas 1984 — 15-claim bilingual evidence gap and corner-count conflict review

**3 November 2026 · Draft PR #395 · research-only / not a public FIA turn guide**

## Verified scope of sources

- [RacingCircuits — Dallas Fair Park](https://www.racingcircuits.info/north-america/usa/dallas-fair-park.html), **Circuit History**: the **1984** Grand Prix circuit is 3.901 km, with **12 main corners and several chicanes**. The page also describes two hairpins, a paddock-side double-apex section and narrow chicanes. It separately identifies a **shorter 1988 Trans-Am layout (1.931 km)**. The historical article is venue context, not a 1984 FIA apex-numbered map.
- [Motor Sport — Alan Henry, Dallas race report](https://www.motorsportmagazine.com/archive/article/august-1984/22/dallas-grand-prix/), **Race**, final two paragraphs: the final corner is identified in the account of Mansell's last-lap loss of drive and attempted push. Elsewhere the report refers to Warwick entering **one of the tight chicanes**, without identifying which chicane. Neither passage numbers an FIA apex.
- [Formula 1 — official Dallas 1984 race result](https://www.formula1.com/en/results/1984/races/474/dallas/race-result) authenticates race results, **not** the turn sequence.
- The pinned F1DB **23-turn count** is a database layout attribute, not a supplied period FIA turn-by-turn chart. Counting 12 principal corners plus several chicanes, counting all direction changes, and counting research bends are **different conventions**. Do not silently choose one as official.
- The 1988 Trans-Am course must not be substituted for the 1984 Grand Prix route. No sourced per-apex official names or numbering have been established in this review.

## Fifteen unlocated claims — explicit EN/UK handoff

The following are **15 existing route-study descriptions**, not 15 newly verified turns. Research order is the stable claim identifier; parent section order locates the broad part of the lap, **not** a numbered apex. Each claim's bilingual `source_locator_gap` is now surfaced verbatim in the internal `historicalCornerEvidenceWorklist.review_request`, rather than being replaced by a generic instruction.

| Claim ID | EN research label | UK research label | Parent route section | Evidence status |
| --- | --- | --- | ---: | --- |
| `dallas:period:2` | Paddock-side opening right | Перший правий біля паддоку | 1 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:3` | Cotton Bowl approach left | Лівий на підході до Cotton Bowl | 2 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:4` | Sharper left onto the fairground avenue | Різкий лівий на алею комплексу | 3 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:5` | Right into the temporary inner section | Правий у тимчасову внутрішню секцію | 4 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:6` | Tightening left-hand arc | Ліва дуга зі зменшенням радіуса | 5 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:7` | Square right after the tightening arc | Прямокутний правий після дуги | 6 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:8` | Inner-section left hairpin | Ліва шпилька внутрішньої секції | 7 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:9` | Right entry to the parking-area jog | Правий вхід у зв'язку біля парковки | 8 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:10` | Left exit from the parking-area jog | Лівий вихід зі зв'язки біля парковки | 8 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:11` | Left entry to the return chicane | Лівий вхід у зворотну шикану | 9 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:12` | Right exit from the return chicane | Правий вихід зі зворотної шикани | 9 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:13` | Faster double-apex left | Швидший лівий із двома апексами | 10 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:14` | Right entry to the final parking chicane | Правий вхід в останню шикану біля парковки | 11 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:15` | Left exit from the final parking chicane | Лівий вихід з останньої шикани біля парковки | 11 | Missing individual passage and 1984 numbered crosswalk |
| `dallas:period:16` | Broad left before the closing complex | Широкий лівий перед завершальною секцією | 12 | Missing individual passage and 1984 numbered crosswalk |

The **sixteenth** Dallas study, `dallas:period:1` (final corner), has one located contemporary report passage. That makes **1/16 report-located study bends**, **15/16 missing claim-specific passages**, and **0/16 independently authenticated FIA apex numbers**. It is not a license to label the final corner with a turn number.

## Adjudication workflow / правила перевірки

1. **EN:** For each claim, find a dated 1984 primary source identifying the *specific* bend or sequence. A generic diagram or race classification is insufficient. **UK:** Для кожного твердження знайти датоване першоджерело 1984 року, що ідентифікує саме цей поворот або зв’язку. Загальна схема чи протокол гонки недостатні.
2. **EN:** Acquire a separately authenticated period numbered layout and independently reconcile every apex, including both halves of each chicane; document the counting convention. **UK:** Отримати окремо автентифіковану нумеровану схему епохи й незалежно зіставити кожен апекс, зокрема обидві частини шикан; задокументувати правило підрахунку.
3. **EN:** Record any ambiguity or competing corner counts instead of manufacturing numbers, names, or precise coordinates. **UK:** Фіксувати неоднозначності та розбіжності в кількості поворотів, а не вигадувати номери, назви чи точні координати.
4. **EN:** Review the English and Ukrainian prose against the actual cited passage before changing publication flags. **UK:** Перед зміною прапорців публікації перевірити англійський та український тексти за конкретним уривком джерела.

## Image licensing and release boundary

RacingCircuits maps, Motor Sport photographs, broadcast footage and FIA diagrams are **external references only**. This package does not copy, embed, redraw or relicense them. The existing F1DB/Jules Roy CC BY 4.0 outline attribution is a separate licensed asset and does not grant rights to third-party images. No new image has been added; `media_rights_approved: false`, `geometric_anchor_verified: false`, `numbered_apex_verified: false` and `publication_allowed: false` remain mandatory for these 16 studies.

**Validation:** `node --test tests/circuit-dallas-15-claim-specific-gap-worklist-20261103.test.mjs tests/circuit-66-evidence-worklist-and-pescara-20261103.test.mjs`. This is an engineering handoff, not an independent historical review or published turn guide. **Research inventory remains 71/78 candidate numbered guides and 1,015 candidate study positions; 7 historical routes remain without authenticated numbered crosswalks.**
