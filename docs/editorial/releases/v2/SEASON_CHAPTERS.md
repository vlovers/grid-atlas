# Five expanded historical season chapters (UK/EN)

This batch creates **15 three-part editorial sections across five seasons**: 1976, 1988, 2008, 2012 and 2021. Each chapter cites claim IDs already recorded in the source-located research dossiers; it does not add unverified historical facts or invent quotes, radio traffic, strategy or circuit details. The emphasis is the distinction between an official championship classification and the individual events behind it.

- **1976:** the one-point Hunt–Lauda classification and the documented Japanese DNF, without inferring motives.
- **1988:** official Senna–Prost championship points versus raw race-result sums, with Monaco and Japan as separate event anchors.
- **2008:** Massa's Brazilian Grand Prix victory versus Hamilton's title, without inventing a lap-by-lap account.
- **2012:** Vettel–Alonso's three-point final margin, without assigning a single unverified turning point.
- **2021:** the official classification and the exceptional half-points Belgian Grand Prix.

Run `python3 scripts/audit-editorial-season-chapters.py` and `python3 -m unittest discover -s tests -p 'test_editorial_season_chapters.py'`. The guard checks bilingual completeness and source-claim links, **not** independent factual verification. All drafts remain unpublished and pending independent human editorial review. Further research must add contemporary reporting and official event chronology before these can become long-form public features.
