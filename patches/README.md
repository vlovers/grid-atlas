# Next.js 15.5.28: React hydration replay backport

`next@15.5.28.patch` backports the HostComponent hydration-cursor restoration
from [React PR #35494](https://github.com/react/react/pull/35494)
([merged commit](https://github.com/react/react/commit/c186624)). It fixes
[Grid Atlas #232](https://github.com/vlovers/grid-atlas/issues/232).

Next's App Router uses its **vendored React DOM 19.2.0-canary-0bdb9206-20250818**,
not the workspace `react-dom` version. Updating only the latter cannot fix this
path. Keep Next at 15.5.28; pnpm applies the patch during frozen installation and
records its checksum in `pnpm-lock.yaml`.

When a host element has claimed its SSR node, a deferred Flight child can suspend
its reconciliation and resolve in the next microtask. React replays the same
host fiber without restoring the cursor. It then tries to claim its own child
as its node (observed: expected `section.page`, found its `header`), emits #418
and discards valid SSR DOM. The HTML and initial client tree are identical.

The backport restores `nextHydratableInstance` to the claimed host's `stateNode`
and pops the parent hydration context before replay. It includes the upstream
insertion-context guard. The DOM renderer always supports hydration, so the
upstream `supportsHydration` constant guard is omitted in these compiled files.
The change covers development/production for the normal and experimental
vendored renderers. No error handler, mismatch validation or SSR path changes.
React's existing MIT license headers remain in the patched files.

Verification:

- `tests/browser/react-hydration-replay.spec.ts` loads the installed vendored
  renderers in Chromium and resolves a Flight-style lazy child in a microtask.
  It asserts no recoverable error **and reuse of the original SSR element**.
- `tests/browser/circuit-hydration.spec.ts` covers EN/UK direct loads, reloads,
  circuit → race → circuit client navigation and state changes, on desktop/mobile.
  Failures retain URL/time/cycle, network evidence, DOM, screenshot and trace.
- [Investigation and measured results](../docs/delivery/reliability/circuit-hydration-232.md).

Remove this patch only after the locked Next version includes the upstream
HostComponent replay fix and both regressions pass with an unpatched frozen
install. This patch intentionally does not backport unrelated React changes or
claim to fix every possible hydration mismatch.
