# History Explorer — Product and Technical Specification

Status: **Proposed, not implemented**  
Scope: local-first portfolio development; no hosting or launch work.  
Languages: **Ukrainian default, English optional**. No Russian UI or editorial localization.

## Purpose

Grid Atlas helps both first-time F1 viewers and experienced fans *discover and understand* Formula 1 history without requiring them to read long articles. The explorer is a navigable historical knowledge interface, not a visualization of arbitrary database joins.

**Product principle:** Show first. Interact second. Read deeper if interested.

## Users and jobs

1. **New viewer:** “Who was Ayrton Senna, why is McLaren important, and what should I explore next?” Needs context in seconds, clear definitions and an obvious path.
2. **Experienced fan:** “How did McLaren's driver lineup, competitors and results change across eras?” Needs accurate time-scoped connections, transparent evidence and precise navigation.
3. **Research-oriented visitor:** “Does Racing Point's 2021 rebranding imply the same entity as the 1959–60 Aston Martin constructor?” Needs distinct entity types, claims, sources and editorial status, never a visually implied unsupported equivalence.

## Three levels of engagement

- **Quick (15–30 seconds):** name, image only when rights allow, a small set of validated facts, “why it matters” only if editorially reviewed, one clear action.
- **Explore (2–5 minutes):** interactive nodes, relationship cards, year/era filtering, meaningful suggested next steps and back navigation.
- **Deep Dive:** full profiles, statistics, historical explanations and sources; optional, never a prerequisite for graph use.

Avoid infinite-feed engagement tricks, auto-playing content, fabricated narrative and gratuitous animation.

## Core interaction model

### Explorer entry points

- Driver profile → “Explore career connections”.
- Constructor/entrant profile → “Explore history”.
- Season page → “Explore this season”.
- Curated journeys → explicit, cited starting point (later editorial phase).

Each entry deep-links to a **canonical focus entity** and optional time scope. The explorer must also offer a simple accessible list view.

### Main screen

- **Focus core:** large central selected entity with name, category, period and validated quick facts.
- **Context ring:** bounded relevant neighbors, grouped by meaningful relationship type; not an undifferentiated hairball.
- **Time control:** season selector or era range; changes only visible relationships and associated context, never entity identity.
- **Inspector:** short explanation of the selected node/edge, source status, dates and a link to the full profile or race.
- **Breadcrumb trail:** supports going back through the exploration path and restoring filters.
- **“Continue exploring” suggestions:** up to three deterministic, explainable links, not an opaque recommendation engine.

Start with a **bounded ego network** (focus + one hop), not a full global force-directed graph. Offer an explicit “expand” action, enforce node/edge budgets and retain stable positions while navigating.

### Graph relationships and semantics

Separate **observed participation** from **editorial claims**:

| Relationship | Evidence / semantics | Display rule |
| --- | --- | --- |
| Driver → entrant / constructor, season | Imported race entries/results with precise date/season scope | Allowed if identity joins are verified and source release is shown |
| Driver → race | Recorded participation/results; do not equate result rows with official starts | Allowed with precise result semantics |
| Constructor / entrant → race | Imported entry/result linkage | Allowed with source and identity clarity |
| Race → circuit, season | Imported calendar and circuit identities | Allowed |
| Constructor → successor / rebrand | Editorial claim, typed, cited, independently approved | **Verified-only** public edge; proposed/rejected never shown as factual |
| Rivalry, influence, friendship, “legendary” | Editorial interpretation requiring reviewed evidence | Do not infer automatically from overlapping race entries or statistics |

Keep constructor and entrant identities separate. Do not infer corporate/legal continuity from a name or branding. Never auto-approve the proposed Racing Point → Aston Martin claim.

Every edge should expose **type, direction, time bounds, source reference, and confidence/publication status as appropriate**. Distinguish “not yet researched” from “no relationship exists.”

### Temporal semantics

A season filter changes the *context* of an entity, not its identity. Historical facts should be displayed as of the chosen season. A 1988 view must not silently attach later-career teams or championship outcomes. For cross-season relationships, show the valid interval explicitly. “Time Machine” is a later, incremental extension of this same temporal model.

### Mobile, motion and accessibility

- Mobile defaults to a **focus card + swipeable relationship groups / list**, with optional graph view. Do not squeeze an unreadable desktop graph onto a phone.
- Keyboard-operable selection, visible focus, descriptive edge labels, no color-only encoding and screen-reader relationship list.
- Respect `prefers-reduced-motion`; avoid moving nodes during reading, use short purposeful transitions, and never block navigation on animation.
- Keep data fetches bounded and graph navigation responsive. Loading, empty, error and no-verified-edges states must explain what happened.

### Visual direction

A distinctive premium motorsport aesthetic: dark graphite surfaces, restrained racing-red highlights, sharp readable typography and polished microinteractions. **A prominent animated central core** is a signature element, but it must encode selected focus, not imply unsupported connections. Avoid copying protected official F1 branding or bundling unlicensed logos/photos.

## Architecture and boundaries

Reuse existing Next.js routes, NestJS read API, PostgreSQL historical/provenance model and lineage explorer where practical. Before implementing, audit existing graph layout and interaction code. Prefer mature graph libraries only if actual interaction/performance needs justify adoption; compare React Flow, Cytoscape.js and Sigma/Graphology against existing SVG rather than rewriting reflexively.

Suggested conceptual API contract (not an endpoint commitment):

```ts
type ExplorerEntityType = "driver" | "constructor" | "entrant" | "race" | "circuit" | "season";
type ExplorerNode = {
  key: string; // stable, namespaced canonical identifier
  type: ExplorerEntityType;
  entityId: string;
  displayName: string;
  validSeasons?: number[];
};
type ExplorerEdge = {
  key: string;
  from: string;
  to: string;
  relationType: string; // typed registry, not arbitrary UI prose
  firstSeason?: number;
  lastSeason?: number;
  sourceIds: string[];
  provenance: "imported-observation" | "reviewed-editorial";
};
type ExplorerResponse = {
  focus: string;
  season?: number;
  nodes: ExplorerNode[];
  edges: ExplorerEdge[];
  sourceRelease: string;
  truncated: boolean;
};
```

Contracts must be refined against actual schema before implementation. UI labels are localized at the presentation boundary; IDs and relation types remain language-independent. Pagination/expansion should be explicit. Cache by focus, time scope, expansion and source version; do not cache editorial review state indefinitely.

## MVP user journeys and acceptance criteria

**Journey A — new viewer:** From a driver profile, enter explorer, see a short factual overview and up to three understandable relationships, select a constructor, understand the relationship's season and follow to its profile. No long article required.

**Journey B — experienced fan:** Focus a constructor, filter to a historical season, inspect related drivers and races, change year, and understand which relationships changed and why. Stable focus and back navigation.

**Journey C — editorial integrity:** With no independently verified lineage edges, the interface clearly explains that verified historical succession is unavailable. Proposed claims never appear as established edges or in recommendations.

**Journey D — accessibility:** Complete A and B using keyboard and list view, with reduced motion enabled and on a narrow mobile viewport.

## Test strategy

- Unit: relation classification, season scoping, stable identifiers, deterministic suggestions, node budgets, no fabricated edges.
- API/PostgreSQL: real imported identity joins, source release, review filtering, constructor vs entrant distinction, shared-car race counts.
- UI: focus changes, URL/back restoration, locale preservation, loading/empty/error states, reduced-motion behavior.
- Browser: desktop/mobile end-to-end journeys A–D with representative data; never mix synthetic fixtures into the real imported archive.
- Regression: proposed 2021 rename remains absent from verified-only explorer output.

Measure coverage but prioritize invariant and user-path tests over arbitrary percentages.

## Implementation phases and ownership

1. **Audit & contract (next):** map current lineage SVG, existing routes/API, data availability and UI components. Produce a gap list and concrete typed relationship registry. No rewrite yet.
2. **One-hop cross-entity explorer:** add a small bounded query for real imported relationships and source attribution; preserve existing verified-only lineage path.
3. **Focus experience:** prominent core, grouped context, inspector, URL state, list fallback, responsive behavior.
4. **Time filter:** season-aware relation validity and historical navigation.
5. **Curated journeys & deeper editorial context:** only after reviewed, cited content is available.

Current parallel worktrees own localization, historical profile API and reusable UX components. **Do not edit their files from this specification branch.** Integrate only after contracts and PRs are reviewed.

## Out of scope

Hosting, production deployment, monetization, accounts, analytics, live timing, AI-generated uncited biographies, automatic historical succession inference, unlicensed media, a custom graph npm package and a global graph of every F1DB row.

## Definition of done for the specification

- Product flows and interaction states are explicit.
- Historical/provenance invariants are documented.
- API sketch is clearly labeled non-binding.
- MVP acceptance and automated regression requirements are testable.
- Implementation can be split into independently reviewable PRs without conflicting with current agent work.
