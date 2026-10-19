# HX-02 — Explorer UI contract and release gate

Status: proposed adapter boundary; stacked on PR #62, which itself depends on PR #60. No localization or route files are changed here.

## Verified mismatch

The existing web helper `getData<T>()` accepts only `{data: T[]}`. HX-01 returns `{data: {focus, year, nodes, edges, truncated, limit, source, limitations}}`. Calling `getData()` for HX-01 will reject a valid response as malformed. The UI must use a separate typed object reader or deliberately extend the helper without breaking catalogue arrays.

## Exact edge semantics

Only `driver_recorded_result_for_constructor` may be rendered as an observed relationship. This is a **result record association**, not proof that a driver started a race. The old `driver_competed_for_constructor` name is misleading for DNS rows and must be fixed in PR #62 before a UI integration.

Use `result_entries` for imported rows and `races` for distinct races; neither is official starts. Show `truncated` and `limit` explicitly when true. Show source attribution as the **focus entity's registered source**, not row-level evidence.

## Contract acceptance

1. Reject a response with `data: []`, unknown edge type, duplicate node/edge key, mismatched focus/season, or an edge to a nonexistent neighbor.
2. Preserve string BIGINT IDs and stable namespaced keys; never coerce canonical IDs to JS Number.
3. A season without result rows returns the focus node and an honest empty state.
4. Use an explicit locale-prefixed route and URL `year` query; Browser Back restores the same focus/year. UI copy is `uk` or `en` only.
5. Do not render editorial lineage edges from observed results. Verified-only lineage remains separate.
6. Render keyboard-operable, responsive list first. Optional SVG graph is an enhancement, not a requirement to discover relationships.
7. Test the first driver→constructor→Back journey with an imported archive fixture; synthetic browser fixtures must be labeled synthetic.

## Integration order

1. Correct HX-01 semantics and cap tests (prepared patch from prior review).
2. Merge reviewed career API (#60), discovery components (#61), and localization independently.
3. Add a pure typed response parser with unit tests; then a separate Next route adapter using locale-aware links.
4. Add a real archive browser golden-path test before a polished graph.
5. Only then extend to reciprocal constructor connections and race evidence.

No deployment, public launch or speculative source claims.
