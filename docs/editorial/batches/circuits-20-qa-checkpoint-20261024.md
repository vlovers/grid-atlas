# Circuit Batch QA — verified observations and publication blockers (24 October 2026)

This note audits a bounded sample of the existing 20-circuit editorial research pack in PR #296. It is **not** independent approval of the remaining statements or a published citation manifest. Do not include it in public copy.

## Verified by opening an official source

| Item | Exact source | Observation | Status |
| --- | --- | --- | --- |
| Istanbul Park, inaugural Grand Prix | https://www.formula1.com/en/results/2005/races/784/turkey/race-result | F1's official 21 Aug 2005 race result gives Kimi Räikkönen (McLaren Mercedes) first place, Fernando Alonso second, Juan Pablo Montoya third. | Directly corroborated |
| Istanbul Park, early circuit history | https://www.formula1.com/en/racing/2027/turkey | The F1 circuit text states work began in 2003 and the first GP was on 21 Aug 2005, won by Räikkönen; Turn 8 is described as a fast multi-apex left-hander. | Historical explanatory text observed, but a 2027 event landing page is **not** the primary source for the 2005 result |
| Zandvoort editorial context | https://www.formula1.com/en/latest/article/circuit-guide-everything-you-need-to-know-about-circuit-zandvoort.3yxmn4LiWkbNTKpad7IRSo.3yxmn4LiWkbNTKpad7IRSo | Actual F1 article, dated 20 Aug 2026; it contains present-day circuit data. | Page exists. **Do not** use its present-day length as 1952 or 1985 geometry |

## Corrections and blockers

- **Sepang:** batch 04 referenced `/en/racing/2026/bahrain` as supporting evidence. This is unrelated to Sepang/1999 and has been **removed from the source list**, with an explicit missing-source marker. Replace with a correctly located official 1999 Malaysian GP result before approving winner/team claims.
- **Istanbul:** `/en/racing/2027/turkey` mixes historical circuit copy with an event page for a different year. For the 2005 winner/date, use `/en/results/2005/races/784/turkey/race-result` instead; independently review Turn 8 and construction context.
- **Original claim locators:** many manuscripts supply general URLs without paragraph or event-result locators. Before publication, each factual assertion needs a source and passage/row locator; article landing pages are not enough.
- **No broad approval:** untested URLs, event names, dates, championship claims, circuit lengths, layout descriptions, and disputed sporting incidents in batches 01–04 remain **pending review**.
- **F1DB crosswalk:** not yet executed. This includes all 20 F1DB circuit external IDs and any event-to-layout assumptions, especially renamed or redesigned venues.
- **Publication model:** current approved-driver-article pipeline is driver-specific. Do not claim that these circuit drafts can already publish through it. An independently reviewed circuit editorial read/write path may need a separate scoped implementation after verifying current architecture.
- **Safety/rights:** linked website images and maps are not licensed for Grid Atlas merely because we cite the associated historical text.

## Human review worklist

1. For each circuit, resolve canonical pinned F1DB circuit identity and any renamed circuit/grouping distinctions.
2. Break manuscripts into individual historical assertions, with exact source URL, article section or result row, verification date, and conflicting evidence if any.
3. Mark the claim verified, qualified, disputed, or blocked only after actual evidence inspection; distinguish a source-backed fact from an author's commentary.
4. Independently proofread English and idiomatic Ukrainian against the user's preference for clear, lively, non-academic copy.
5. Check that each year-specific diagram and technical datum applies to that event, not merely to the venue today.
6. Confirm actual circuit content publication architecture and design a proper reviewed circuit pipeline if it does not yet exist.
7. Keep everything in Draft pending independent source/editorial approval and actual test logs.

**Measured scope of this QA:** three source/page observations and one invalid reference corrected. This is not a 20-circuit fact-check, nor evidence of successful lint, build, integration, browser or CI.
