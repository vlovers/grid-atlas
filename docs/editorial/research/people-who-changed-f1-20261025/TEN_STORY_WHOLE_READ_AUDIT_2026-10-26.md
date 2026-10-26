# Ten F1 stories — whole-read editorial audit (26 October 2026)

**Status:** Editorial diagnosis, not source validation, historical approval, or a release decision. Based on PR #309 manuscripts at commit `cf49584335c5674cd10e665d1db49bd3bcad2b11`. The working draft has 10 bilingual stories and 98 chapter sections total (49 EN + 49 UK). These are **short sketches**, not yet full-length literary nonfiction.

## Core finding

Most stories open by announcing the result, revisit that same result midway and repeat its significance in the ending. Passing phrase-overlap tests does not establish original scenes or compelling narrative development. Length checks also measure characters rather than narrative quality. Stop optimizing prose to match thresholds as an editorial goal.

**Required structure for publication:** cold open with one specific situation and an unresolved question → rewind to the necessary context → a succession of distinct, documented events (not generic reflections) → decisive action → consequences that alter what comes next. The first paragraph may tease the outcome but should not settle every question.

## Story-by-story structural diagnosis

| Story | What works | Main repetition / missing narrative turn | Next research assignment |
| --- | --- | --- | --- |
| Lauda/Hunt 1976 | Fuji's contrasting decisions and Hunt's recovery | Lauda's comeback versus risk is repeated; almost no chronology of the summer title swing | Build a dated Nürburgring–Monza–Fuji timeline, verify the point swings, check Fuji tyre incident with contemporary coverage |
| Senna/Prost 1988–89 | Counted points versus raw total; Suzuka road finish versus disqualification | 1988 totals and 1989 classification keep returning without advancing character/team tension | Trace the 1988–89 teammate relationship through sourced qualifying/race episodes, contracts or public statements only if original records available |
| Villeneuve/Arnoux 1979 | Winner Jabouille distinguished from fight for P2 | Every chapter restates the two simultaneous stories | Reconstruct final laps from original coverage or cleared footage descriptions; explain Renault turbo progress from verifiable earlier races |
| Vettel/Monza 2008 | Toro Rosso identity; wet pole; win by 12.512s | Rain, team badge and pit stops are repeated, little concrete race progression | Qualifying positions, race lead and actual pit-stop sequence; check original F1 report and official lap chart |
| Button/Canada 2011 | Late-race reversals and decisive final-lap mistake | Middle/closing acts recount the same three passes | Map first-half contacts, penalties, the red-flag interruption and tyre choices from official timing and reliable reports; give each chapter its own phase |
| Pérez/Sakhir 2020 | Recovery P18 → P11 (lap 15) → P10 (lap 20) versus Russell | The Mercedes mix-up and lost counterfactual occupy multiple chapters | Reconstruct mid-race gains between lap 20 and late Safety Car; verify race-control and Mercedes stop chronology |
| Kubica/BMW 2008 | Pit-exit red light and BMW 1–2 | **Four chapters** describe the 42-point June lead and warn it was not a guaranteed title | Find documented season progression after Canada, later BMW podiums/points, and contemporaneous team development comments; don't infer alternate champion |
| Schumacher/Ferrari 1996–2000 | Different setbacks in 1997/98/99 | 1999 team survival and inevitable-success warning repeat; little 2000 race sequence | Separate chapters by years with verified turning races and the Suzuka title decider, including Häkkinen and Irvine |
| Massa/Brazil 2008 | Two simultaneous finishes, weather/tyres | Fifth-place calculation and Glock return throughout; post-finish aftermath thin | Official final-lap order and contemporary driver/team responses; avoid invented radio or conspiracy |
| Brawn 2009 | Preseason survival and early/late contrast | **Two winter survival chapters**, **two defending-lead chapters**; few specific weekends beyond Turkey/Valencia/Monza/Brazil | Establish BGP 001 design/engine chronology, Melbourne early season, rivals' midseason gains and Brazil race context from sources |

## Recommended chapter roles (without mechanically adding chapters)

- **Lauda:** (1) Fuji cold open; (2) summer accident and recovery; (3) Hunt's tightening points pursuit; (4) Fuji late-race tyre trouble; (5) decision and aftermath.
- **Senna/Prost:** (1) 1988 in-team battle; (2) 1988 points and rules; (3) what changed by Suzuka 1989; (4) collision, chase, ruling; (5) championship and rivalry consequences.
- **Villeneuve/Arnoux:** (1) last-lap duel; (2) how Renault arrived as a contender; (3) Jabouille building the lead; (4) verified wheel-to-wheel sequence; (5) the differing legacies.
- **Vettel:** (1) wet Saturday; (2) Toro Rosso context; (3) Sunday pace/strategy; (4) the final stint; (5) what this win meant to the team.
- **Button:** (1) near-impossible position; (2) early incidents, weather and stoppage; (3) restart and tyre decisions; (4) measured closing pursuit; (5) last-lap result.
- **Pérez:** (1) first-lap setback; (2) recoveries while Russell leads; (3) mid-race milestones; (4) double pit-stop problem and puncture; (5) actual podium and consequences.
- **Kubica:** (1) pit-exit incident; (2) race and BMW team result; (3) June lead in context; (4) documented second-half trajectory; (5) meaning without counterfactual title.
- **Schumacher:** (1) the stakes at Ferrari; (2) 1996/97; (3) 1998; (4) 1999 and Irvine; (5) 2000/Suzuka as earned payoff.
- **Massa:** (1) title equation; (2) changing weather; (3) decisive last laps; (4) celebrations, final championship and aftermath.
- **Brawn:** (1) Honda withdrawal; (2) securing the operation and debut; (3) Button's opening streak; (4) rivals' pursuit and Barrichello; (5) Brazil titles and Mercedes transition.

## Historical and editorial gates

1. For each of the ten articles, build a **claim-by-claim ledger**: claim, exact EN/UK passages, source URL/primary document, publication/date, verification confidence, ambiguity and independent reviewer.
2. Do not insert precise laps, quotations, tyre compounds, steward rationales, points or chronology from memory. Resolve unclear events against primary documents; if evidence differs, state the uncertainty or omit the specificity.
3. No cleared photography yet. Do not equate an online image or footage with licensed site use.
4. Copyedit EN and UK independently for natural language, not word-for-word translation; agree on verified facts.
5. Run manuscript tests, source ledger review, locale parity, local desktop/mobile reader inspection, noindex check and all required CI **on the same head SHA**.
6. Maintain Draft PR #309 until independent historical and editorial sign-off. Do not merge with failed or incomplete CI.

## Definition of editorial done

A reader can state *what changed in each chapter* without repeating the same answer five times. Each major scene has dated, sourced event support. The ending changes the meaning of the opening rather than summarizing it again. If evidence for a dramatic detail is missing, the prose stays transparent rather than filling the gap with imagined thoughts or dialogue.
