# Golden Page — First Driver Experience

Status: **proposed acceptance fixture and product brief**, not historical editorial content.  
Depends on PRs #60 (career API), #61 (discovery components), and localized routing.

## Candidate

**Ayrton Senna** is a compelling first *candidate*, subject to confirming his canonical F1DB identity and available imported records in a real PostgreSQL fixture. Do not hardcode a numeric ID, biography, image, career total or unsupported narrative in the UI. Use a source-backed driver selected by external identity lookup. If data coverage or licensed media is insufficient, choose another driver with the same test criteria.

## First-screen experience

1. A clearly labeled driver name and short neutral identification (no generated biography).
2. Three accurate quick facts derived from imported results: distinct races with result records, winning races, observed season range. Counts must use the API's definitions, never “official starts”.
3. A large primary action: **Explore connections** / **Дослідити зв'язки**.
4. A vertical, season-grouped career timeline that displays constructor identities as separate linked entities.
5. An optional milestone section (first recorded race, first winning result) with a source/coverage explanation.
6. Three or fewer related journeys chosen from actual imported relationships; deterministic ordering and a visible “why this is linked” explanation.
7. If no reviewed editorial text exists, omit biography/intro rather than generating a placeholder historical claim.

## Golden path

- Open localized driver page.
- Read a meaningful fact in 15 seconds.
- Select a season and a constructor from observed participation.
- Inspect the exact relationship: **driver recorded results for constructor during this season**, not a claim of employment or legal continuity.
- Navigate to constructor page, return with browser Back and retain selected season.
- Switch from `uk` to `en` and retain canonical focus, season and page intent.
- Complete the same task at 320px width and using keyboard only.

## Data correctness

- The pinned F1DB release is the archive boundary; never imply live/current completeness.
- Preserve distinct constructor and entrant identities; no auto lineage.
- Handle duplicate result rows for a driver/race and shared-car wins.
- Unknown points stay unknown, not zero.
- The profile's source observations prove **entity** import, not per-result verification.
- Use actual archive data for the golden path; synthetic fixtures may be used in isolated component tests only and must be visibly marked.

## Visual quality bar

The selected driver should feel like a central focus, not a row in a table. Favor hierarchy, meaningful spacing, restrained animation and direct links. Avoid official F1 branding, unlicensed photos and unverified quotations. Use the existing palette and Agent 3 components before inventing another design system.

## Testable acceptance checklist

- [ ] Canonical ID resolved from imported identity, never guessed
- [ ] Three quick facts are labeled according to API semantics
- [ ] Timeline seasons/constructor links match imported rows
- [ ] No invented gap years, succession or editorial prose
- [ ] Missing/zero statistics distinguishable
- [ ] Valid UA and EN routing with preserved context
- [ ] Mobile, keyboard, reduced motion and empty/error states
- [ ] Real database integration for one chosen driver's path
- [ ] Browser tests for first-screen → season → constructor → Back
- [ ] All source attribution and archive coverage visible

## Merge order

1. Review and merge #60 and #61 once corrections/CI are verified.
2. Review and merge localization independently.
3. Create a dedicated **Golden Driver Page** integration PR consuming those contracts.
4. Implement Explorer's first bounded one-hop graph query separately; do not couple it to golden-page UI work.

No deployment, analytics, monetization or public launch tasks.
