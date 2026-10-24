# Circuit Release Batch 01 — evidence review and owner decisions

**2026-10-25 · PR #298 · 25 subjects / 50 language-specific renditions · NOT SIGNED OFF**

This is an evidence-review handoff, not a human editorial approval. CI pass does not establish truth. The first five entries have two historical timeline events each (10), the other twenty have one anecdote each (20). Names/counts/identity selection come from pinned F1DB v2026.17.0 and belong to a separate archive-data gate.

## Directly inspected official sources (partial verification, not comprehensive sign-off)

| Circuit | Source | What the source concretely establishes | Boundary |
| --- | --- | --- | --- |
| Monza | https://www.formula1.com/en/results/1971/races/299/italy/race-result | Gethin ahead of Peterson by 0.010 s, Italian GP 1971 | Source covers the 1971 finish, not unrelated architectural claims |
| Monza | https://www.formula1.com/en/latest/article/gasly-takes-maiden-win-in-monza-thriller-from-sainz-as-penalty-leaves.2wjQyiSgOy8ggwcJlWHhsi | Gasly's first win, ahead of Sainz, 2020 | 2020 race only |
| Spa-Francorchamps | https://www.formula1.com/en/results/1950/races/98/belgium/race-result | Fangio first, Belgian GP 1950 | Original long-course description separately corroborated against FIA's 2018 Belgian GP historical brochure; exact configuration requires archived F1DB/layout evidence |
| Nürburgring | https://www.formula1.com/en/latest/article/moments-in-time-the-german-grand-prix.2FaVX5yf48IUr6cLe1Lnyd.2FaVX5yf48IUr6cLe1Lnyd | Fangio's final F1 victory in Germany 1957 and pit-stop recovery | Retrospective, not primary race classification |
| Hockenheimring | https://www.formula1.com/en/latest/article/vital-statistics-the-german-grand-prix.mEQsGRNBOiiPrIMeqT0Gm.mEQsGRNBOiiPrIMeqT0Gm | First F1 World Championship GP at Hockenheim in 1970 won by Rindt | Road layout changes need distinct evidence |
| Sepang | https://www.formula1.com/en/latest/article/1999-oral-history-part-3-stewart-spring-a-surprise-schumacher-returns-and.6N2mWADjGWFHQHB75kl23B | Retrospective on Schumacher returning during 1999 title battle | Source context supports return; precise circuit construction details require a track history |
| Kyalami | https://www.formula1.com/en/results/1967/races/244/south-africa/race-result | Rodríguez first, Love second, Surtees third in South African GP 1967 | Distinguish first *championship* win from all motorsport wins |
| Buenos Aires | https://www.formula1.com/en/results/1955/races/135/argentina/race-result | Fangio in Mercedes-Benz wins, race time 3:00:38.600 | Source proves result/duration, not subjective conditions |
| Indianapolis | https://www.formula1.com/en/results/2005/races/779/united-states/race-result | Only six cars raced; all Michelin teams withdrew after formation lap | Replaced an irrelevant source link in PR #298 |
| Watkins Glen | https://www.formula1.com/en/latest/article/miami-is-coming-but-where-else-has-f1-raced-in-the-usa.62oTelm2rpEueOVaQfFNh | Official retrospective covers history of USA venues including Watkins Glen | Specific Lotus-first-work-team-win claim needs pinpointed passage independently rechecked |

The checks above establish **specific claims only**. No whole-dossier sign-off, verified translation approval, or media licence follows from them.

## Source/claim review queue (remaining, not approved)

These subjects have bilingual copy and a URL, but no documented sentence-by-sentence source check in this release:
- Monaco: first Grand Prix (1929) and 2003 no-overtakes; existing links point to **2026 event page**, not targeted historical evidence. Replace with specific historical citations.
- Suzuka: 1988 championship race and 1989 Senna/Prost disqualification; verify race result and adjudication detail independently.
- Silverstone: 1950 Farina and 1987 Mansell; confirm exact cited pages and source passages.
- Montréal: 1978 Gilles Villeneuve victory, Expo island and 1999 Wall of Champions.
- Interlagos: 1973–1975 win chronology and exact first championship race.
- Hungaroring: nine-month build, 1986 Piquet/Senna move.
- Zandvoort: 1948 origin and 1952 Ferrari 1–2–3.
- Melbourne: 1996 Brundle crash and track setting.
- Bahrain: 2002 start, 2004 Ferrari 1–2.
- Shanghai: 2004 first Chinese GP, Barrichello result.
- Imola: 1980/1981 event naming and consequences of 1994.
- Spielberg: 1969 origin, 1970 GP and shortening into A1-Ring.
- Catalunya: 1991 Mansell/Senna battle and 1992 Olympic relationship.
- Paul Ricard: historical funding/building and 1971 Stewart.
- Mexico City: naming of Rodríguez brothers, 1959/1963 timeline.
- Magny-Cours: Schumi win count, copied-corner concept.
- The broader statements in reviewed subjects (Spa's 1983 layout; Nürburgring's original location; Hockenheim's forest-road evolution; Sepang construction-era claim; Watkins Glen's Lotus distinction) also require passage-level corroboration.

## Corrections made during this review

1. **Indianapolis**: the original link to an unrelated 2016 article about races where every starter finished was replaced by the **official 2005 United States race classification**, which explicitly states that seven Michelin teams withdrew after the formation lap.
2. **Buenos Aires**: a generic 1955 race-list link was replaced by the **official 1955 Argentine Grand Prix classification**. The 3h duration and winner can now be checked exactly.
3. No changes were made to historic prose based solely on a URL loading successfully; resolving a link is not claim validation.

## Concrete remaining owner decisions

**Decision 1 — publication standard:** The existing independent publication policy requires a real human editorial sign-off tied to an exact reviewed revision for historical prose. An AI-authored verification report does not meet this. The owner must designate an independent accountable human editor or explicitly change the project's written policy through its normal review process. Do **not** invent a named reviewer or backdate approval.

**Decision 2 — publication format:** PR #298 renders history straight from React source rather than through the established reviewed-article publication adapter, which is driver-scoped. Decide whether human-approved circuit stories can be merged as source-managed web content with a reviewed PR, or whether circuit-scoped versioned editorial publication is required first. Until agreed, treat story publication as blocked.

**Decision 3 — selected media:** Photo/publication registry contains zero licensed/approved assets. Publish as **text + licensed historical F1DB SVG only**, or conduct a separate independent photo rights review (issue #290). Unreviewed photographs must not enter the release.

**Decision 4 — factual gaps:** Narrow/remove every unsupported statement in the queue rather than accept unverifiable copy. Approval is by exact EN/UK revision; neither language inherits approval from the other.

## Technical release conditions

- PR #298 previously had all six CI runs green at commit `6d121343`; this review commits changed the source content, so check **the new head's full CI** again.
- After review edits, confirm the exact 25 external IDs on actual archive data, browser render 25 EN/UK pages, responsive accessibility, and absence of dead/irrelevant source links.
- Merge only after these tests and editorial sign-off are complete; then inspect local main. No public deployment or real licensed photography is claimed.

**Summary:** 25 bilingual source-bearing historical stories are implemented, **not 25 independently approved histories**. Nine concrete source result/retrospective checks are recorded above; remaining source-to-claim and human approval work is explicit rather than silently marked complete.
