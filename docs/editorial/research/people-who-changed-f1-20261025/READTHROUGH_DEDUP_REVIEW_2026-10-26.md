# Ten-story read-through and repetition audit — 26 October 2026

**Status:** Editorial draft-review record, not permission to publish. Bilingual manuscript passages remain subject to independent claim-level review. This audit checks *story structure* and three revised sequences, not all 98 chapters' factual truth.

## Reader-first standard

A chapter must add something the prior chapter did not: a new decision, a change in running order, a change in championship arithmetic, or a direct consequence. Historical names and the final result can recur, but whole explanatory paragraphs must not. No invented cockpit thoughts, radio chatter, quotes, telemetry or eyewitness descriptions.

## Three important corrections

1. **Vettel / Monza 2008:** Separate the qualifying upset from the race. After two Safety Car laps, Vettel led, made his first stop on lap 18, and recovered the lead as others stopped. This supports the transition from *surprise pole* to *controlled race*, without suggesting rain automatically awarded victory. Evidence: [Motor Sport Magazine's 2008 Italian GP report](https://www.motorsportmagazine.com/articles/single-seaters/f1/2008-italian-grand-prix-report/) and [Formula 1 official classification](https://www.formula1.com/en/results/2008/races/838/italy/race-result).
2. **Schumacher / Ferrari 1996–2000:** Do not repeat Jerez in two consecutive chapters. The revised fourth chapter instead covers the different 1999 outcome: Schumacher missed six rounds after his Silverstone injury, Ferrari won the constructors' title, and Eddie Irvine narrowly missed the drivers' title. That provides a distinct bridge to Suzuka 2000. Evidence: [Formula 1, Ferrari year by year](https://www.formula1.com/en/information/ferrari-year-by-year.61yfcjhl05vSlmNJB1SIJ0), and [Ferrari's own 1997 history](https://www.ferrari.com/en-US/formula1/year-1997) for the earlier Jerez chapter.
3. **Brawn GP / 2009:** Do not say *six wins in the opening seven rounds* again after the introductory chapters. Instead show the turning point: Button did not win again after Turkey, while Barrichello subsequently won at Valencia and Monza. The chapter before the Brazil title conclusion is now about *protecting a lead*, not repeating the opening success. Evidence: [Formula 1, Barrichello's race engineer looks back at 2009](https://www.formula1.com/en/latest/article/barrichellos-brawn-gp-race-engineer-on-why-the-brazilian-lost-out-on-the.5OG9vsd52kufWvgADYjkwK.5OG9vsd52kufWvgADYjkwK), and [Formula 1, Button's Brazilian title drive](https://www.formula1.com/en/latest/article/ten-of-the-best-buttons-finest-grand-prix-drives.5mmH7wOPRLiDSREK8YJNRV).

## Automated guardrail

The Node editorial test tokenizes Unicode letters and numbers and compares four-word sequences between every pair of chapters in each EN and UK manuscript. More than five shared four-word sequences between a chapter pair fails the test. This detects copy/paste-style repetition while allowing unavoidable repeated names and terminology. It **cannot** detect all semantic paraphrasing or judge literary quality; human read-through is still necessary.

## Remaining release gates

- Verify the source URLs and exact passages independently against the pinned archive and primary race documentation where possible
- Edit remaining awkward UK expressions with a fluent human-style language pass and compare meaning with EN
- Check on actual mobile and desktop pages whether the many supporting panels bury the main narrative; coordinate any layout work with Product Experience V3 rather than duplicating that PR
- Confirm workflows pass on the exact merge candidate commit; do not merge draft text or approve unlicensed media

**Do not treat this audit as publication approval.**
