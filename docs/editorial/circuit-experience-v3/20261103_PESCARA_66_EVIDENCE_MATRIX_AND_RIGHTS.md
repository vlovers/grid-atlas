# Historical corner evidence matrix — 66 claims, seven circuits (3 November 2026)

**Research-only, unpublished PR #395.** This is an actionable EN/UK claim-level worklist, not a period FIA numbered map, independent human approval, or a license for media reuse. No BATCH_01/02 content is repeated.

| Circuit and period | Claims | Source passages located | Missing passages | Verified numbered apexes |
| --- | ---: | ---: | ---: | ---: |
| Ain-Diab 1958 | 1 | 1 | 0 | 0 |
| Clermont-Ferrand / Charade 1972 | 11 | 11 | 0 | 0 |
| Dallas 1984 | 16 | 1 | 15 | 0 |
| Detroit 1982 | 17 | 17 | 0 | 0 |
| Pescara 1957 | 6 | 6 | 0 | 0 |
| Porto 1958–1960 | 7 | 7 | 0 | 0 |
| Sebring 1959 | 8 | 8 | 0 | 0 |
| **Total** | **66** | **51** | **15** | **0** |

The TypeScript `historicalCornerEvidenceWorklist` now attaches the original source roles, historical period, geometry scope, evidence priority, external-link-only rights status, and a distinct English/Ukrainian next action to **each of the 66 records**. P1 means a missing claim-specific passage (all 15 are Dallas); P2 means a named complex/sector or plural bends need disambiguation; P3 means a passage for a single bend is located but the numbered-map crosswalk remains missing. None of these labels means a turn is approved.

## Pescara: two source-specific corrections

1. [40mila, 4 September 2019, “La Esse di Cappelle”](https://www.40mila.it/2019/09/04/pescara-si-vince-correndo-coppa-acerbo-aneddoti-e-curiosita/): the article **does** contain a named S-complex passage. The author explicitly cannot choose between the double bend by the village entrance monument and the double bend in the centre. The name passage is now located, while the geometry, exact 1957 apex count and any FIA number remain unverified.
2. In the same article, **“Il Chilometro Lanciato”** describes the final turn opposite Montesilvano station, about a kilometre beyond the speed-measurement section. This has been added as a local 2019 recollection to the existing Montesilvano bend description and its EN/UK provenance; it does not authenticate a 1957 apex.

The original [1957 Motor Sport report](https://www.motorsportmagazine.com/archive/article/september-1957/16/xxv-gran-premio-pescara/) remains the contemporary race source. [Official Formula 1 classification](https://www.formula1.com/en/results/1957/races/156/pescara/race-result) establishes results only, not geometry. The local 2019 account is not a contemporary 1957 FIA map. Its photos, the maps of RacingCircuits and other third-party media are **outbound links only**, with no copied assets and no implied license.

## Remaining release blockers

- Dallas 1984: 15 diagram-inferred study bends lack individual report passages; 1988 Trans-Am must not be conflated with 1984 Grand Prix.
- All seven: dated period numbered plans and independently reviewed turn-to-apex crosswalks remain absent.
- Complexes and sectors (including Esse di Cappelle) cannot be converted to one official numbered apex without evidence.
- Media reuse requires separately established permission or a verified applicable license; no such rights are claimed here.

**Counts:** 71/78 candidate guides; 1,015 candidate turn-study positions in those guides; **66** additional unnumbered historic claims reviewed; **0** newly authenticated FIA-numbered apexes; **7** historic circuits without complete verified numbered guides. No merge or publication.

Validation: `node --test tests/circuit-66-historical-claim-triage-20261103.test.mjs tests/circuit-66-source-role-and-numbering-evidence-gate-20261103.test.mjs tests/circuit-66-evidence-worklist-and-pescara-20261103.test.mjs`. Exact-head GitHub Actions must pass before any further integration decision.
