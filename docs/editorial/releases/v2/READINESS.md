# Current editorial research coverage and archive readiness

The pinned F1DB v2026.17.0 real-archive audit in [encyclopedia coverage](../../encyclopedia-coverage.md) measured **917 drivers, 187 constructors, 78 circuits, 77 seasons, 1,172 races and 27,665 result rows**. All 1,182 driver/constructor/circuit identity pages had source-bound identity details. **57 drivers and one constructor have no imported race-result evidence**; do not invent a career or interpret an empty archive as nonparticipation.

## Editorial research as of 22 October 2026

The machine-readable [coverage inventory](coverage.json) now reconciles **all four research datasets**, not the stale initial five-pilot snapshot: **25/25 subjects** now have at least a narrow source-located research lead and **42 atomic source-located claims**. Five have short chapter drafts; nine have researched season introductions; eleven constructor/circuit subjects have **one event-result anchor each**, which is not a verified full historical narrative. None are independently approved or published.

This is not an audit of field-level historical completeness. Identity fields are broad, but official championship scoring, chassis/engine timelines, constructor legal continuity, precise circuit geometry and per-race narrative evidence need independent sources. The 160 SVG layouts are credited illustrations, not measured maps, and still require the documented per-asset publication review.

## Editorial release priority

1. Verify the eleven event anchors against exact F1DB race, constructor and venue identities; then expand them into genuinely sourced histories.
2. Independently corroborate all source-located claims; a URL or table locator is a research lead, not verified human signoff.
3. Write long-form bilingual histories with citations at chapter level, link to canonical archive records, then use the existing independent exact-revision approval and media rights workflow.

The new `scripts/audit-editorial-coverage-current.py` verifies that the inventory stays synchronized with all four research files and fails closed on fake approvals or publication flags. The older `scripts/audit-editorial-coverage.py` validates the **original 5-pilot + 20-framework structural split** and should not be interpreted as current research coverage.
