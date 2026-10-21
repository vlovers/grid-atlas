# Research batch: 2021 Grand Prix circuit configurations (UNPUBLISHED)

**Audit date:** 2026-10-21 · **Scope:** sixteen 2021 event pages · **Status:** `needs_review` · **Media:** none.

This is a source-located factual research register, **not** an approved/public dataset, SVG map, or database seed. Official Formula 1 event pages may change their lap-record labels retrospectively: only the 2021 event's explicitly displayed circuit length and scheduled race laps are transcribed. A calendar/venue identity is not sufficient to prove a historical circuit layout; assign reviewed layout versions and pinned imported entity IDs only after reconciliation with F1DB v2026.17.0. Conversion: kilometers × 1000 = integer meters. Cross-source values from race classifications **do not** independently establish track length. No image reuse rights are implied by the cited pages.

| 2021 venue | Event | Length, m | Scheduled laps | F1 official event source | Exact locator | Cross-check / limitation |
|---|---|---:|---:|---|---|---|
| Silverstone | Great Britain | 5891 | 52 | [Formula 1](https://www.formula1.com/en/racing/2021/great-britain) | Circuit > Circuit Length (5.891km); Number of Laps (52) | [FIA classification](https://www.fia.com/events/fia-formula-one-world-championship/season-2021/british-grand-prix/race-classification); FIA Race Classification 2021: leader Lewis Hamilton 52 laps; this confirms race completion, not independent geometry |
| Monaco | Monaco | 3337 | 78 | [Formula 1](https://www.formula1.com/en/racing/2021/monaco) | Circuit > Circuit Length (3.337km); Number of Laps (78) | FIA independent geometry cross-check pending |
| Monza | Italy | 5793 | 53 | [Formula 1](https://www.formula1.com/en/racing/2021/italy) | Circuit > Circuit Length (5.793km); Number of Laps (53) | FIA independent geometry cross-check pending |
| Spa-Francorchamps | Belgium | 7004 | 44 | [Formula 1](https://www.formula1.com/en/racing/2021/belgium) | Circuit > Circuit Length (7.004km); Number of Laps (44) | Listed scheduled laps are NOT actual completed laps at the rain-affected 2021 race; do not interpret as race distance achieved |
| Imola | Emilia Romagna | 4909 | 63 | [Formula 1](https://www.formula1.com/en/racing/2021/emiliaromagna) | Circuit > Circuit Length (4.909km); Number of Laps (63) | FIA independent geometry cross-check pending |
| Red Bull Ring | Austria | 4318 | 71 | [Formula 1](https://www.formula1.com/en/racing/2021/austria) | Circuit > Circuit Length (4.318km); Number of Laps (71) | Circuit's historic Österreichring and later A1-Ring identity/configurations must not be conflated |
| Hungaroring | Hungary | 4381 | 70 | [Formula 1](https://www.formula1.com/en/racing/2021/hungary) | Circuit > Circuit Length (4.381km); Number of Laps (70) | Verify 2021 layout identity and event schedule independently; no geometry reuse permission. |
| Zandvoort | Netherlands | 4259 | 72 | [Formula 1](https://www.formula1.com/en/racing/2021/netherlands) | Circuit > Circuit Length (4.259km); Number of Laps (72) | Restored 2021 event, do not infer 1950s circuit geometry from this page. |
| Baku City Circuit | Azerbaijan | 6003 | 51 | [Formula 1](https://www.formula1.com/en/racing/2021/azerbaijan) | Circuit > Circuit Length (6.003km); Number of Laps (51) | Street circuit: 2021 layout and source geometry licensing remain unverified. |
| Istanbul Park | Turkey | 5338 | 58 | [Formula 1](https://www.formula1.com/en/racing/2021/turkey) | Circuit > Circuit Length (5.338km); Number of Laps (58) | Exact layout revision and independent FIA confirmation pending. |
| Circuit of The Americas | United States | 5513 | 56 | [Formula 1](https://www.formula1.com/en/racing/2021/united-states) | Circuit > Circuit Length (5.513km); Number of Laps (56) | Independently verify configuration/year and avoid assuming licensed source drawings. |
| Circuit Paul Ricard | France | 5842 | 53 | [Formula 1](https://www.formula1.com/en/racing/2021/france) | Circuit > Circuit Length (5.842km); Number of Laps (53) | F1 event circuit section; explicitly for France 2021; independently reviewed FIA layout evidence pending. |
| Autódromo Hermanos Rodríguez | Mexico City | 4304 | 71 | [Formula 1](https://www.formula1.com/en/racing/2021/mexico) | Circuit > Circuit Length (4.304km); Number of Laps (71) | 2021 track path through Foro Sol differs from original 1960s circuit; independently reviewed FIA layout evidence pending. |
| Lusail International Circuit | Qatar | 5380 | 57 | [Formula 1](https://www.formula1.com/en/racing/2021/qatar) | Circuit > Circuit Length (5.380km); Number of Laps (57) | 2021 source length differs from Formula 1 2026 Qatar event listing (5.419 km); cannot infer geometry lineage; independently reviewed FIA layout evidence pending. |
| Jeddah Corniche Circuit | Saudi Arabia | 6174 | 50 | [Formula 1](https://www.formula1.com/en/racing/2021/saudi-arabia) | Circuit > Circuit Length (6.174km); Number of Laps (50) | 2021 street-circuit geometry cannot be assumed stable in later seasons; independently reviewed FIA layout evidence pending. |
| Yas Marina Circuit | Abu Dhabi | 5281 | 58 | [Formula 1](https://www.formula1.com/en/racing/2021/united-arab-emirates) | Circuit > Circuit Length (5.281km); Number of Laps (58) | 2020 event lists 5.554 km and 55 laps: historical configuration clearly differs; independently reviewed FIA layout evidence pending. |

## Cross-year configuration evidence

| Venue | Earlier/late event | Displayed length | Planned laps | Official source | Status |
|---|---|---:|---:|---|---|
| Yas Marina | 2020 Abu Dhabi | 5,554 m | 55 | [2020 Formula 1 event](https://www.formula1.com/en/racing/2020/united-arab-emirates) | Distinct from 2021 5,281 m / 58; version and effective-date confirmation needed. |
| Lusail | 2026 Qatar | 5,419 m | 57 | [2026 Formula 1 event](https://www.formula1.com/en/racing/2026/qatar) | Distinct from 2021 5,380 m; no assumption about exact year/change date. |

## Publication gates (not satisfied)

1. Reopen every source and verify the **2021** configuration against time-stamped FIA technical/circuit material; in particular, laps listed on a pre-race event page do not necessarily equal completed laps.
2. Resolve internal `historical_circuits` and `historical_races` integer IDs against checksum-verified F1DB imports, and assign year-specific `layout_version`. Do not guess IDs, use present-day geometry for old seasons, or assume a source's `first Grand Prix` proves the exact present layout.
3. Separate fields into validated records: `circuit_layout.length_m` and `race_event.scheduled_laps` (pending reconciliation and independent review). Each claim should carry precise publisher, title, HTTPS URL, locator, retrieval date, human reviewer and review date.
4. Require named human approval, conflict reconciliation and separate publication authorization before database import or public API exposure; merely passing the validator is insufficient. No SVG/photograph/circuit drawing is authorized for reuse from these links.
5. Validate that layout direction, corners and other unsupported numbers remain unknown, not `0`.
