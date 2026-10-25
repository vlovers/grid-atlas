# Race turning points · Unpublished editorial research

**Status:** 10 original EN/UK three-act race manuscripts, **zero approved or published race stories**. Drafted 25 October 2026. Human historical review and native-language Ukrainian review are still required. The research is separate from the open driver biography PR #274 and constructor PR #289.

## Read the stories

- [Volume I · 1957–1998](turning-points-volume-01.en-uk.md): Fangio's Nürburgring comeback (1957 Germany); Renault's first turbo victory and the Villeneuve–Arnoux duel (1979 France); the impossible Monaco finish (1982); Senna's wet-weather Donington masterpiece (1993); Jordan's first win at Spa (1998).
- [Volume II · 2005–2021](turning-points-volume-02.en-uk.md): Räikkönen's last-lap Suzuka move (2005); Button's Montreal comeback (2011); the Hockenheim rain lottery (2019); Pérez and Russell's diverging Sakhir stories (2020); Ocon and Alonso's two-part Hungary victory (2021).

These stories are **not** another championship summary. Each starts with a race-level paradox, follows the changing decisions, and connects the outcome to a driver, team, circuit and season. The linked `/en/seasons/<year>` and `/uk/seasons/<year>` are existing season routes; unpublished race pages are not fabricated. A future published edition should use verified canonical race IDs from the pinned F1DB archive.

## Reader trails

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

`python3 -m unittest tests/test_race_story_research.py -v` checks exactly ten distinct race years, 200+ words per language per story, three narrative acts, both language routes, and complete evidence markers. It cannot establish historical truth or legal publication rights.
