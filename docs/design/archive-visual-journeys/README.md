# Archive Visual Journeys — circuits, seasons, races

A single responsive, accessible, server-rendered timeline component for all three remaining historical page families. Uses existing API-backed race IDs and locale-aware navigation; **no historical facts, media assets, map geometries or new API dependencies are introduced**.

- Circuit detail: earliest, median and latest recorded events from the complete circuit history response, with only archive-backed winning entries.
- Season detail: opening, midpoint and final calendar rounds from sorted race data.
- Race detail: season, circuit and first-position result entry, with explicit classification language rather than an unsourced official winner claim.
- English and Ukrainian headings and descriptions; native links and keyboard focus; responsive one-column layout, reduced-motion and forced-colors fallbacks.
- Source components remain unmodified; the feature can be rebased onto Editorial Racing #205 without conflicting with its homepage and dossier work.

Validation required on PR: TypeScript, lint, production build, Chromium/WebKit journeys at mobile and desktop, archive coverage and CI. This commit has not been locally executed. The rendered journey does not publish unapproved editorial manuscripts.
