# First editorial case: the Silverstone-based team

Status: sourced research, **not imported database claims**. IDs must be resolved against the F1DB importer before any verified edge is inserted.

## Documented history

- Jordan Grand Prix debuted in 1991 and was sold to the Midland Group in 2005.
- The team competed as Spyker in 2007 and Force India from 2008.
- In 2018 Force India entered administration. A Lawrence Stroll-led consortium acquired the business and assets, but **Racing Point Force India competed as a new entity**, forfeiting the previous entrant's constructor points. Do not represent this as a mere rename.
- Racing Point competed under that name in 2019–2020, then the current team took the Aston Martin name from 2021.
- Aston Martin's 1959–1960 F1 entry is historically distinct from the current Silverstone-based operation; shared branding does not prove organizational continuity.

## Primary reporting / references

1. Formula 1, *TEAM GUIDE: Aston Martin's complex F1 roots* (2023): https://www.formula1.com/en/latest/article/team-guide-aston-martins-complex-f1-roots-and-how-theyre-aiming-to-fulfil.465QgZKQ9XcBDcD54VT4xR
2. Formula 1, *Jordan: Stroll will be amazing for Force India* (2018): https://www.formula1.com/en/latest/article/jordan-stroll-will-be-amazing-for-force-india.3B44AWiAjms6cSSiemESkk
3. Formula 1, *Racing Point set sights on top 3 after Aston Martin re-brand* (2020): https://www.formula1.com/en/latest/article/aston-martin-target-becoming-one-of-f1s-top-teams-after-racing-point-re-brand.7HpHDVaOm5Gr2SR1CWoKz6

## Required identity mapping before publication

For each named era, inspect actual `historical_constructors` and `historical_entrants` records and their external IDs. Confirm whether each era has a distinct constructor record and whether the source identity represents a team or chassis constructor. In particular, do not assume that Racing Point Force India and Racing Point are separate constructor IDs.

The current `historical_lineage_claims` table connects **constructor records only**. It cannot faithfully represent ownership transfers between legal organizations or a new entrant inheriting assets. The 2018 change must remain editorial-only until a typed entrant/organization model is implemented. Do not insert misleading `renamed_to` or `operations_succeeded_by` claims just to draw a graph.

## Publication checklist

- [ ] Resolve exact source-backed constructor IDs for every proposed edge
- [ ] Separate entrant/organization continuity from constructor naming
- [ ] Cite evidence for each specific edge, not only the overall chain
- [ ] Record the relevant year without inventing an exact date
- [ ] Independently review every claim before setting `verified`
- [ ] Test the verified-only API with actual imported records

No verified claims or seed rows are introduced by this document.
