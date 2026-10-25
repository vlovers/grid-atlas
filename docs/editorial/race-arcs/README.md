# Race turning points · Unpublished editorial research

**Status:** 20 original EN/UK three-act race manuscripts, **zero approved or published race stories**. Drafted 25 October 2026. Human historical review and native-language Ukrainian review are still required. The research is separate from the open driver biography PR #274 and constructor PR #289.

## Read the stories

- [Volume I · 1957–1998](turning-points-volume-01.en-uk.md): Fangio's Nürburgring comeback (1957 Germany); Renault's first turbo victory and the Villeneuve–Arnoux duel (1979 France); the impossible Monaco finish (1982); Senna's wet-weather Donington masterpiece (1993); Jordan's first win at Spa (1998).
- [Volume II · 2005–2021](turning-points-volume-02.en-uk.md): Räikkönen's last-lap Suzuka move (2005); Button's Montreal comeback (2011); the Hockenheim rain lottery (2019); Pérez and Russell's diverging Sakhir stories (2020); Ocon and Alonso's two-part Hungary victory (2021).
- [Volume III · 1967–2003](turning-points-volume-03.en-uk.md): Clark's impossible Monza recovery and Surtees' Honda win (1967); Brabham's final-corner Monaco mistake (1970); Panis' rain-soaked Monaco breakthrough (1996); Herbert and Stewart reading the Nürburgring weather (1999); the delayed Fisichella verdict in Brazil (2003).
- [Volume IV · 2006–2020](turning-points-volume-04.en-uk.md): Button's first victory for Honda (2006); Vettel winning for Toro Rosso at Monza (2008); Maldonado and Williams at Barcelona (2012); Hamilton–Rosberg's Bahrain duel (2014); Gasly and AlphaTauri's Monza surprise (2020).

These stories are **not** another championship summary. Each starts with a race-level paradox, follows the changing decisions, and connects the outcome to a driver, team, circuit and season. The linked `/en/seasons/<year>` and `/uk/seasons/<year>` are existing season routes; unpublished race pages are not fabricated. A future published edition should use verified canonical race IDs from the pinned F1DB archive.

## Reader trails

**Underdogs across teams and generations:** 1967 Surtees/Honda → 1996 Panis/Ligier → 1999 Herbert/Stewart → 2006 Button/Honda → 2008 Vettel/Toro Rosso → 2012 Maldonado/Williams → 2020 Gasly/AlphaTauri. The 2008 and 2020 Monza stories are particularly useful companions; they do not imply identical constructor identities.

**Rivalries without a title finale:** 1970 Rindt–Brabham at Monaco → 2014 Hamilton–Rosberg at Bahrain → 2021 Ocon's win protected by Alonso's defence. The season title can be explored separately.

**When the favourite does not win:** 1957 Fangio (strategy failure and recovery) → 1998 Jordan (favourites retire) → 2020 Pérez (Mercedes errors) → 2021 Ocon (a team-mate's defence).

**When a great race is not a title decider:** 1979 Dijon (the duel for second) → 1993 Donington (Senna versus the faster Williams) → 2005 Suzuka (title already decided) → 2011 Canada (a Button victory inside Vettel's dominant season).

**Why results need context:** 1982 Monaco (classified finishers versus on-road finish) → 2019 Germany (post-race penalties change the table) → 2021 Hungary (Vettel's disqualification changes the podium).

## Editorial acceptance gates

1. Verify chronology, overtakes, technical details and race outcome against the linked sources. A classification establishes results, **not** tyre strategy, motives or accident mechanisms. Several entries currently rely on the Formula 1 publisher family; an independent source is preferable before public release.
2. Resolve season/race IDs from the pinned F1DB release before creating clickable race links. Driver, constructor and circuit cross-links are conceptual until their canonical identity is checked.
3. Have an independent reviewer validate English and a native Ukrainian editor validate terminology and nuance. Do not mark any story `approved` on the basis of CI or AI review.
4. Use no third-party photos without a documented license, author credit, subject verification and approval. These Markdown drafts contain **no images**.
5. Preserve the original three-act prose; do not auto-convert it into generic archival-statistic filler.

## Validation

`python3 -m unittest tests/test_race_story_research.py tests/test_race_story_underdogs.py -v` checks the first ten distinct race years plus ten additional distinct race/year pairs, 200+ words per language per story, three narrative acts, both language routes, and complete evidence markers. It cannot establish historical truth or legal publication rights.
