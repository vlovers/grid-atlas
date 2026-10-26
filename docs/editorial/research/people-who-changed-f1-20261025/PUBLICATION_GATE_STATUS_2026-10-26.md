# Ten-story release gate — verified status, 26 October 2026

**Decision:** HOLD — no merge/publication from PR #309 yet. Owner requests `AI-reviewed` label without a description and an AI-only editorial workflow. That does not authorize falsifying review records or dropping build/release protections.

## Verified against Formula1.com results
- 1976 Japanese GP official classification: Andretti P1, Depailler P2, Hunt P3, Lauda retired after 2 laps: https://www.formula1.com/en/results/1976/races/373/japan/race-result
- 1988 official championship: Senna 90, Prost 87 counted points: https://www.formula1.com/en/results/1988/drivers
- 2008 official championship: Hamilton 98, Massa 97, Kubica fourth on 75 points: https://www.formula1.com/en/results/2008/drivers
- 2008 race winner sequence: Kubica Canada, Vettel/STR Ferrari Italy, Massa Brazil: https://www.formula1.com/en/results/2008/races
- 2020 Sakhir classification: Perez P1, Ocon P2, Stroll P3: https://www.formula1.com/en/racing/2020/sakhir

These checks cover exact recorded outcomes **only**, not all narrative claims in EN/UK prose. Continue claim-by-claim source checking before legitimately asserting the entire articles were AI-reviewed.

## Required before publication
1. Evidence ledger must match **each final manuscript revision**; don't mark historical claims reviewed solely because their story appears in a search result.
2. Bilingual editorial pass must remove disputed, invented or repetitive passages and check both language versions.
3. A specific AI-reviewed publishing lane must be implemented and tested without forging human `review_method` or human sign-offs.
4. Required CI must pass on **the same final HEAD**; local/mobile reading QA must complete.
5. Current story preview routes return `robots.index: false` and openly describe manuscripts as drafts. They are **not published** even if a label says `AI-reviewed`. The label is already present, but no editorial verification gate has been satisfied by it.

The existing independent-human release policy remains operative until the actual publication contract and release workflow are changed safely. Do not silently bypass it.
