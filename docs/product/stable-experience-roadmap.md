# Stable Experience — delivery plan

Objective: a polished, locally runnable F1 history explorer. Prioritize the complete driver-to-constructor season journey over adding more reference pages.

## P0 — quality

1. Review and reconcile PRs #60, #61 and #62; confirm checks at latest heads.
2. Finish Ukrainian/English navigation without overwriting unfinished localization work.
3. Clarify result-entry counts versus distinct races, missing points and source scope.
4. Verify repeatable import, database integration, lint, types, builds and browser smoke.

## P1 — user journey

1. HX-01: bounded observed driver-to-constructor season graph API (PR #62).
2. HX-02: golden driver page with real imported data, three accurate facts and a career timeline.
3. HX-03: explorer route, URL-based season selection, focus card, relationship inspector and accessible list.
4. HX-04: compact, readable one-hop visual graph synchronized with the list.
5. HX-05: reciprocal constructor-to-driver connections and navigation.
6. HX-06: race evidence drilldown, with precise data-source boundaries.

## P2 — distinctiveness

1. Evidence-backed guided journeys, each with an explanation for every step.
2. Time Machine highlighting real season-by-season relationship changes.
3. Small reviewed historical deep dives, with citations and two-language support.

## Stable-version gate

A fresh local import and restart succeed. Current-head CI and a real-archive browser journey pass. The journey works on a 320px screen, with keyboard and reduced motion, in Ukrainian and English. Selected season survives navigation and Back. Unknown is distinct from zero, a result row is not called an official start, and unverified historical succession is never displayed as fact.

See the accompanying competitor landscape for why graph novelty, analytics breadth and dataset size alone are insufficient differentiators.
