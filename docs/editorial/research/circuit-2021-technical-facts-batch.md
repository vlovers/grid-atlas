# Research batch: 2021 Grand Prix circuit configurations (UNPUBLISHED)

**Audit date:** 2026-10-21 · **Scope:** six 2021 event pages · **Status:** `needs_review` · **Media:** none.

This is a source-located factual research register, **not** an approved/public dataset, SVG map, or database seed. Official Formula 1 event pages may change their lap-record labels retrospectively: only the 2021 event's explicitly displayed circuit length and scheduled race laps are transcribed. A calendar/venue identity is not sufficient to prove a historical circuit layout; assign reviewed layout versions and pinned imported entity IDs only after reconciliation with F1DB v2026.17.0. Conversion: kilometers × 1000 = integer meters. Cross-source values from race classifications **do not** independently establish track length. No image reuse rights are implied by the cited pages.

| 2021 venue | Event | Length, m | Scheduled laps | F1 official event source | Exact locator | Cross-check / limitation |
|---|---|---:|---:|---|---|---|
| Silverstone | Great Britain | 5891 | 52 | [Formula 1](https://www.formula1.com/en/racing/2021/great-britain) | Circuit > Circuit Length (5.891km); Number of Laps (52) | [FIA classification](https://www.fia.com/events/fia-formula-one-world-championship/season-2021/british-grand-prix/race-classification); FIA Race Classification 2021: leader Lewis Hamilton 52 laps; this confirms race completion, not independent geometry |
| Monaco | Monaco | 3337 | 78 | [Formula 1](https://www.formula1.com/en/racing/2021/monaco) | Circuit > Circuit Length (3.337km); Number of Laps (78) | FIA independent geometry cross-check pending |
| Monza | Italy | 5793 | 53 | [Formula 1](https://www.formula1.com/en/racing/2021/italy) | Circuit > Circuit Length (5.793km); Number of Laps (53) | FIA independent geometry cross-check pending |
| Spa-Francorchamps | Belgium | 7004 | 44 | [Formula 1](https://www.formula1.com/en/racing/2021/belgium) | Circuit > Circuit Length (7.004km); Number of Laps (44) | Listed scheduled laps are NOT actual completed laps at the rain-affected 2021 race; do not interpret as race distance achieved |
| Imola | Emilia Romagna | 4909 | 63 | [Formula 1](https://www.formula1.com/en/racing/2021/emiliaromagna) | Circuit > Circuit Length (4.909km); Number of Laps (63) | FIA independent geometry cross-check pending |
| Red Bull Ring | Austria | 4318 | 71 | [Formula 1](https://www.formula1.com/en/racing/2021/austria) | Circuit > Circuit Length (4.318km); Number of Laps (71) | Circuit's historic Österreichring and later A1-Ring identity/configurations must not be conflated |

## Publication gates (not satisfied)

1. Reopen every source and verify the **2021** configuration against time-stamped FIA technical/circuit material; in particular, laps listed on a pre-race event page do not necessarily equal completed laps.
2. Resolve internal `historical_circuits` and `historical_races` integer IDs against checksum-verified F1DB imports, and assign year-specific `layout_version`. Do not guess IDs, use present-day geometry for old seasons, or assume a source's `first Grand Prix` proves the exact present layout.
3. Separate fields into validated records: `circuit_layout.length_m` and `race_event.scheduled_laps` (pending reconciliation and independent review). Each claim should carry precise publisher, title, HTTPS URL, locator, retrieval date, human reviewer and review date.
4. Require named human approval, conflict reconciliation and separate publication authorization before database import or public API exposure; merely passing the validator is insufficient. No SVG/photograph/circuit drawing is authorized for reuse from these links.
5. Validate that layout direction, corners and other unsupported numbers remain unknown, not `0`.
