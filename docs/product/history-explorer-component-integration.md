# History Explorer — Discovery Components Integration

Status: planning integration against [PR #61](https://github.com/vlovers/grid-atlas/pull/61) and [PR #60](https://github.com/vlovers/grid-atlas/pull/60). Neither is assumed merged. Do not implement route adapters until localization and these contracts stabilize.

## Component mapping

| Explorer element | Existing proposed component | Adapter responsibility |
| --- | --- | --- |
| Selected entity summary | `QuickFacts` | Translate fact labels; format real result-entry/race counts; preserve `null` vs `0`; show archive limitations |
| One-hop related entities | `DiscoveryCards` | Supply canonical, locale-aware links and accurate typed relation explanations |
| Season-scoped career history | `CareerTimeline` | Group observed `participation` rows by season; never invent missing years or employment spans |
| Three suggested next steps | `RelatedJourneys` | Choose at most three deterministic, evidenced connections; provide explainable context |
| Graph edge inspector | Existing lineage inspector pattern, **not** an existing discovery component | Show edge type, season validity, provenance and review state; accessible list equivalent required |

These components are **presentational only**. Keep data queries, locale routing, selection, time filtering and evidence validation in page/API adapters.

## Driver career adapter sketch (non-binding)

1. Fetch `/api/drivers/:id/career?locale=uk|en` after PR #60 merges.
2. Derive quick facts from `summary.races` and `summary.winning_races` with precise translated labels (“races with imported results” rather than “official starts”).
3. Group `participation` by `year`, retaining each constructor identity and a distinct link; do not collapse rows by display name.
4. For selected year, show only observed constructor links from that year.
5. Use `first_race` / `last_race` only as the observed first/last race for that constructor-season row; do not imply continuous participation.
6. Include an archive coverage note explaining result-derived evidence and its limitations.
7. Do not create biographical prose from raw numbers or imply independently verified career highlights.

## UX copy guidelines

Use concise UA/EN labels and explain historical limits only where relevant.

- `uk`: “Гонки з результатами в архіві”, “Конструктори за сезон”, “Дослідити зв'язки”.
- `en`: “Races with archived results”, “Constructors by season”, “Explore connections”.
- For empty season: `uk` “Немає зафіксованих результатів за цей сезон”; `en` “No recorded results for this season”.
- For unverified lineage: explicitly say **no independently verified connection is published**, not that no historical relationship exists.

No Russian localization or UI copy.

## Component-level and end-to-end checks

- A missing points value stays unavailable; known zero renders as zero.
- Multiple constructors in one season remain separate, even when names look similar.
- Distinct races never silently become “starts”.
- URL contains canonical IDs and selected year; switching locale preserves both.
- Keyboard and mobile list mode can complete the same exploration path as the graph.
- No fabricated related-entity links, biographies or unreviewed succession.
- Focus navigation and back button restore state.
- At most three suggestions, with stable order and reasons.

## Ownership and sequence

- Agent 3 owns `apps/web/src/components/discovery/**` and its component tests.
- Agent 1 owns locale routing/dictionaries and eventual page wiring.
- Agent 2 owns profile API/contracts.
- Explorer implementation owns **new** focus adapter and explorer route after all three branches are integrated.

The documentation PR can be reviewed independently; it must not merge implementation or edit other agents' files.
