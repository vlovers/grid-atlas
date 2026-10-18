# Silverstone lineage: edge-by-edge editorial review

**Status:** research queue only. Nothing in this document is a verified database claim, and no claims are published to the public API. Use the pinned-release identity audit before preparing an import manifest.

## Proposed relationships to investigate

| From (F1DB constructor ID) | To | Approximate year | Candidate relation | Review required |
| --- | --- | --- | --- | --- |
| `jordan` | `midland` | 2006 | `renamed_to` | Verify sale and 2006 constructor entry naming from a source covering this transition |
| `midland` | `spyker` | 2007 | `renamed_to` | Verify acquisition and the specific change in constructor name |
| `spyker` | `force-india` | 2008 | `renamed_to` | Verify the 2007 acquisition and 2008 constructor identity |
| `force-india` | `racing-point` | 2018 | **No constructor edge assigned** | Separate 2018 new entrant and asset transfer from the constructor label |
| `racing-point` | `aston-martin` | 2021 | `renamed_to` | Verify 2021 rebranding and source scope |

Candidate relations above are **hypotheses**, not asserted facts. The current schema's `renamed_to` describes a constructor name change, **not** legal corporate continuity. The 2018 boundary requires special editorial treatment and may be more faithfully represented by an `entrant` `assets_acquired_by` claim once the correct entrant IDs are established.

## Source material to inspect per edge

- F1's [team history guide](https://www.formula1.com/en/latest/article/team-guide-aston-martins-complex-f1-roots-and-how-theyre-aiming-to-fulfil.465QgZKQ9XcBDcD54VT4xR) is an overview. Do not reuse its citation for a transition it does not substantiate.
- F1's [2018 Force India reporting](https://www.formula1.com/en/latest/article/jordan-stroll-will-be-amazing-for-force-india.3B44AWiAjms6cSSiemESkk) provides context for the acquisition.
- F1's [Aston Martin rebrand report](https://www.formula1.com/en/latest/article/aston-martin-target-becoming-one-of-f1s-top-teams-after-racing-point-re-brand.7HpHDVaOm5Gr2SR1CWoKz6) is a candidate source for the 2021 name change.
- [F1DB constructor source files](https://github.com/f1db/f1db/tree/main/src/data/constructors) contain chronology but are not proof of legal succession.

## Publication gates

1. Confirm exact IDs exist **once each** in the pinned release and local imported DB.
2. For each edge, read a contemporaneous or official primary source, record a precise evidence note, and distinguish source statements from inference.
3. Prepare a proposed-only manifest with an accurate `source_url`, title, publisher, access date and year; run the validator.
4. Import into disposable PostgreSQL and inspect the proposed claims.
5. Obtain independent editorial review before setting `verified`; only verified claims appear in `/api/lineage/network`.
6. Do not connect the historic 1959–60 Aston Martin entry to the modern team merely because the name matches.

The [2021 proposed manifest](manifests/silverstone-2021.proposed.json) now exists and has passed the pinned-release/imported-identity preflight in disposable PostgreSQL. It remains proposed; no independent editorial approval or historical publication is implied. Do not manufacture verified relations to make the graph nonempty.
