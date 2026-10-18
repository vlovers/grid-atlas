# Archive discovery components

Four server-compatible React components for facts, context, career entries and the next related record. Import from `@/components/discovery`. No dependency, font, image asset, client directive, API request or production route is added.

## UI audit

At base commit `9ace21f`, the archive already uses dark neutrals, restrained coral accents and responsive catalogue grids. Driver statistics are static article tiles, contextual discovery is mostly links in tables, and career entries use an all-years horizontal grid. The reusable module keeps the established palette and adds semantic fact definitions, optional explanations, explicit relationship context and a vertical timeline that fits phones. The lineage graph remains outside this module.

## Integration with Agent 1

Ownership agreed with Agent 1: this directory and `tests/browser/discovery.spec.ts` belong to this change. Agent 1 owns localized app routes, dictionaries, locale-aware navigation, existing `catalogue.tsx`, middleware and config. Integrate these components from route/server adapters after both branches are reviewed; this PR does not wire app pages.

| Export | Required props | Optional props |
| --- | --- | --- |
| `QuickFacts` | `label`, `facts`, `unavailableLabel`, `emptyLabel` | `note` |
| `DiscoveryCards` | `label`, `items`, `emptyLabel` | — |
| `CareerTimeline` | `label`, `entries`, `emptyLabel` | `note` |
| `RelatedJourneys` | `label`, `items`, `emptyLabel` | — |

All record shapes and prop types are exported from `index.ts`. Arrays accept readonly data. Each record has a stable caller-supplied `id`. Each link is `{ href, label }`:

- `QuickFact`: `id`, `label`, `value: string | null`, optional `detail`.
- `DiscoveryItem`: `id`, `kind`, `title`, `summary`, `relationship`, `destination`, optional `fact: { label, value }`.
- `CareerEntry`: `id`, `period`, `title`, `summary`, optional `destination`, `detail`, `entities: ArchiveLink[]`.
- `RelatedJourney`: `id`, `kind`, `destination`, `relationship`, optional `context`.
- `Disclosure`: `label`, `text`, optional `source: ArchiveLink`.

Pass localized labels, summaries and complete locale-prefixed hrefs from the route adapter. Format numbers/dates with the active locale before passing strings. `null` means unavailable; a formatted `"0"` stays visible as a real value. Empty data uses the explicit caller-provided message. Pass archive coverage in `note` so the scope stays visible before any disclosure is opened.

```tsx
import { QuickFacts } from '@/components/discovery';

// `driver`, `copy`, `format` and `coverageNote` come from the route's data/i18n adapter.
<QuickFacts
  label={copy.careerStats}
  facts={[
    { id: 'starts', label: copy.starts, value: format(driver.starts) },
    { id: 'wins', label: copy.wins, value: format(driver.wins) },
  ]}
  unavailableLabel={copy.unavailable}
  emptyLabel={copy.noStatistics}
  note={coverageNote}
/>
```

Career entries render in supplied order. Group team-season rows in the adapter and pass multiple constructor links through `entities`. The component inserts no missing seasons, sorts nothing and infers no historical identity, relationship or milestone. Keep entrants and constructors distinctly labeled. A connecting line is a reading aid, never a lineage claim. Only pass source links backed by actual records; explanations and sources are optional.

Place these components beneath an `h2`; card and career-entry titles use `h3`. `label` names the section/navigation landmark. Keep `RelatedJourneys` outside any existing `nav`. Links use native anchors to preserve supplied destinations and work without hydration; locale prefixing and destination validation belong to the adapter. No text is injected as HTML.

CSS is scoped in `discovery.module.css` and automatically imported. Use on a dark parent background (current archive default `#0d1116`); typography inherits from the parent. Native details/summary supports Enter/Space, links have visible keyboard focus and minimum 44px targets, long text wraps, and the timeline needs no horizontal scrolling. Only hover colors transition, and only when reduced motion is off. Forced colors retains focus and timeline markers.

## Isolated preview and tests

Install the existing workspace dependencies, then run from the repository root with Node 24:

```sh
node apps/web/src/components/discovery/preview/server.cjs
```

Open `http://127.0.0.1:3354`. The preview has default, empty, long-content and French-value variants. All records, statistics, source notes and destinations are visibly marked **synthetic fixtures**; none are archive claims. French props demonstrate formatting and label passthrough. The preview is static HTML with scripts blocked by CSP, includes the current app stylesheet to expose cascade conflicts, and is never registered with Next routing. Its small development-only TypeScript loader uses the existing TypeScript/React dependencies.

```sh
pnpm exec playwright install chromium
pnpm exec playwright test --config apps/web/src/components/discovery/preview/playwright.config.ts
pnpm lint
pnpm --filter @grid-atlas/web typecheck
```

The component spec also runs automatically under the existing `Next.js web` CI browser suite. Standalone execution needs no database/API. It verifies native keyboard disclosure and focus, navigation, zero/missing values, source disclosure, caller order and multiple constructors, empty states, French formatting, escaped text, 320px layout at 200% text size, 44px link targets, 4.5:1 text contrast, reduced motion and forced colors. Default desktop/mobile and long-content screenshots are written under `test-results/discovery/` for review. The preview is component evidence; localized production-route integration still belongs to Agent 1.
