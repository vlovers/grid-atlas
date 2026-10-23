# Circuit hydration #418: confirmed replay-cursor defect

Investigation: 23 October 2026. Base: `888e899` (PR #233).
[Issue #232](https://github.com/vlovers/grid-atlas/issues/232) remains the original
incident record, including the failed PR #222 CI trace.

## Cause and evidence

The circuit route is an async Server Component in
`apps/web/src/app/[locale]/circuits/[id]/page.tsx`. It fetches the circuit,
race/history/identity/layout/technical records, then renders `StoryHeader`,
`ArchiveRhythm`, `ArchiveJourney`, `IdentityFacts`, `MediaCollection` and the
client `CircuitExperience`. Shared locale layout/header and language navigation
also participate in hydration.

The confirmed cause is in Next 15.5.28's **vendored React DOM
19.2.0-canary-0bdb9206-20250818**, not a differing application value. A host
fiber claims its SSR DOM node, then suspends while reconciling a pending Flight
child. If that child resolves during the yield, React replays the host without
rewinding the hydration cursor. It tries to hydrate the host against the host's
first child. Production reports #418 (`args[]=HTML`) and regenerates the root.
The timing of Flight delivery makes this intermittent.

Evidence collected before applying the patch:

- Original CI: run `39893173121`, attempt 1, artifact `12475394628`, mobile EN
  direct `/en/circuits/1`, pageError at trace time `239839.543`.
- Unmodified current main: production route/circuit suite, `--repeat-each=8`:
  **271 passed, 1 failed**. The new failure was mobile UK on `/uk/seasons`,
  showing that the defect also affects shared archive rendering.
- Diagnostic-only logging at the production React throw site captured circuit
  EN desktop/mobile and UK desktop failures. Expected `section.page`; actual
  cursor `header[data-testid="story-header"]`, whose parent was already that
  `section.page`. The instrumentation was not included in the patch or tests.
- The minimal Flight-style replay regression failed **4/4** before the patch
  (normal renderer, development/production, desktop/mobile). Development's diff
  was `+ <section id="target"> / - <header>`. In every case the identical SSR
  element was discarded. This isolates the scheduler/replay behavior from the
  archive API, dates, translations, SVG and page interaction.

The faulty replay path and missing cursor restoration were also inspected in
the installed Next sources. [React PR #35494](https://github.com/react/react/pull/35494)
fixes this mechanism upstream. [React issue #37584](https://github.com/react/react/issues/37584)
describes the same mechanism in older stable/bundled renderers; it is supporting
context, not the basis for claiming reproduction here.

## Divergence checks

- `CircuitExperience` initializes selected layout from serialized props, selects
  the effective layout deterministically, and starts with `showAll=false` and
  `selectedYear=null`. Its filtering, numeric widths and conditional branches
  use those props/state, not viewport, storage, random values or the clock.
- `StoryHeader`/`MotorsportArt` are Server Components. Their `useId` gradient IDs
  are serialized in Flight. IDs and SVG references were consistent; the observed
  failure occurred before entering the header. The circuit regression additionally
  compares raw SSR gradient IDs with hydrated DOM IDs.
- Circuit dates are source strings; number values are serialized values, with
  no client `toLocaleString`/timezone conversion. Locale-dependent text uses
  the same explicit `en`/`uk` prop. Winner sorting runs only on the server.
- `StoryExperience` reads motion preferences/storage in an effect, after its
  identical initial render. It does not replace page elements. Media eligibility
  has a server-side date default, but its output is serialized; the fixture's
  empty collection is identical on both sides. None explains the isolated replay
  regression, which contains only a section/header and a microtask-resolved child.

## Fix and regression coverage

`patches/next@15.5.28.patch` backports upstream HostComponent cursor restoration
to Next's normal and experimental development/production DOM renderers.
`pnpm-workspace.yaml` registers it; `pnpm-lock.yaml` pins the patch checksum.
Next and workspace React versions stay unchanged. This repairs replay itself;
SSR, mismatch checks and error reporting remain active. There is no hydration
warning suppression, SSR opt-out, retry allowance or weaker browser assertion.
See [patch maintenance and removal criteria](../../../patches/README.md).

`react-hydration-replay.spec.ts` loads the actual installed vendored renderer,
not workspace React DOM, and asserts both zero recoverable errors and identity
of the retained SSR node. It covers both renderer families and both modes in
the existing desktop/mobile projects.

`circuit-hydration.spec.ts` runs 30 cycles per locale/project:

1. Direct circuit load and effective layout state.
2. Change layout and verify facts, ensuring client hydration really completed.
3. Internal circuit → race → circuit navigation; check initial state on return.
4. Change state, reload, verify reset, and interact again.

Both EN/UK routes run on desktop Chrome and Pixel 7 Chromium. Every pageerror
and console error is asserted, with URL, wall-clock time and cycle. Failure
attachments include network responses/failures and DOM; existing Playwright
configuration retains screenshot and trace. No retries are configured. Web and pinned real-archive CI path filters also include
the dependency patch and its manifests so changes to the vendored renderer run
those gates even when application files are untouched.

## Validation

- Final regression rerun, including raw SSR/client SVG IDs: **12 passed**.
- Minimal regression after backport: **8 passed** (both families/modes/projects).
- Production circuit stress: **20 passed**, five repetitions of the four
  locale/project cases: **600 cycles**, **1,200 direct loads/reloads** and
  **1,200 internal navigations**, no errors.
- Typecheck: passed. Production API/web build: passed.
- Full production browser suite: **476 passed** (3.5 minutes), including the
  existing WebKit reliability project.
- Lint, foundation check, documentation-link audit: passed.
- Offline Python suite: **357 passed**.
- Commons ingestion suite, including all C0 characters: **6 passed**.

Full lint on the base also exposed an existing `no-control-regex` failure in
`scripts/ingest-commons-original.mjs`. Its C0 rejection now uses equivalent
character-code checks, with all 32 C0 values covered by the existing ingestion
test. This prerequisite changes no media evidence, publication gate or license.

An additional local `pnpm test` run had 149 passes and three pre-existing
`media-original-batch` failures: those tests pass literal `/tmp` as the originals
directory, which is a symlink on macOS and rejected by the directory guard.
The Linux Foundation CI remains the authoritative full Node-suite check.
No macOS-specific relaxation was made to that guard or its tests.

All application tests use owned synthetic database schemas. Pinned F1DB data,
SVG assets, license registries, imported facts and other working copies were
not changed. No merge or deployment is part of this fix.
