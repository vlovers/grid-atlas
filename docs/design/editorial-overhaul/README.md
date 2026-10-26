# Editorial Experience & UX Overhaul — audit and delivery contract

Baseline: `origin/main` `ba29d5539764cfe5d34de141df6437a0dbb29abd`, 26 October 2026. Read current root README/AGENTS, architecture, product status, data-source register, editorial pipeline, DoD, review and release policies before changes. This is implementation work, not publication/deployment approval.

## Three independent PRs

| PR | Remove / merge | Add / retain | Acceptance and risk |
| --- | --- | --- | --- |
| 1 — Global, typography, homepage | Empty hero media; detached Senna chart/next-chapter aside; catalogue duplicate hero previews; catalogue career charts and constructor year jumps | Event-specific first-win composition with exact event-layout match; compact cards with distinct race counts, wins, source-final titles; shared accessible selects; UK/EN copy and type | No fabricated starts or titles, unknown standings remain unknown; native GET forms before hydration; keyboard/touch/focus after hydration; no new imagery rights claims |
| 2 — Circuits | Overlapping chronology/era journey/decade cards/history lists, unrelated race stories masquerading as corner guidance | One circuit biography, sourced corner model, one significant-moment collection, configuration history, one searchable Grand Prix archive; 78-circuit coverage report | Numbered turns differ from named sections; exact layout/year scope; provenance and review state remain explicit; no guessed map coordinates or retroactive modern naming |
| 3 — Seasons, media, final QA | Two opening/middle/final selections; duplicate calendar; generic archive portrait; empty media panels | One calendar, source championship tables, field, linked existing published stories where applicable; compact media availability; cross-route final QA | 2026 remains provisional; no calendar order presented as editorial significance; registry approval gates retained; responsive, keyboard, reduced-motion, API errors and no-JS limitations tested |

Each branch starts independently at the same main SHA. No schema migration, archive pin change, framework rewrite, publication or deployment. Open PR #296 owns five-circuit research candidates; its unpublished content is not copied or approved by this work. PR #267 owns return-context navigation. Open issues #275/#283 describe constructor overflow and are included in verification.

## Existing solutions

Next 15/React 19/next-intl; React Flow + Dagre for networks; existing custom career charts with accessible data; 160 pinned F1DB/Jules Roy CC BY 4.0 outlines and exact event/layout APIs. Atlas Serif (Cormorant) and Atlas Sans (Manrope) already ship licensed Latin and Ukrainian Cyrillic subsets, weights 400–700. No photograph is in the approved publication registry. No chart/media framework replacement is needed. Radix Select is the only new UI dependency; its documented focus management, arrows/Home/End/typeahead/Escape and touch interactions replace public native dropdowns after hydration while preserving native server form controls before hydration.

## Evidence

Live queue: seven open PRs (#296, #286, #279, #273, #272, #271, #267). Latest main Foundation and Editorial preflight runs are green (40400571070 / 40400570997); latest observed web success 40389688134. These are baseline observations, not candidate CI evidence.

Disposable database: new Docker `grid-atlas-ux-overhaul-db`, localhost 55466; official v2026.17.0 checksum-verified archive imported using the existing wrapper. Before capture: `node scripts/capture-editorial-overhaul.mjs before`, 78 genuine-archive pages, UK/EN × 1440/768/390, all HTTP 200, zero page errors or page-width overflows. Full report and images initially at `/private/tmp/grid-atlas-ux-evidence`; selected comparable images accompany each PR. The connected in-app browser failed to initialize its native bridge; standalone project Playwright is used.

Per-PR verification reports record actual final commands/results, reviewer findings, candidate SHA and limitations. CI green remains separate from editorial/media independent review and release issue #104 gates.
