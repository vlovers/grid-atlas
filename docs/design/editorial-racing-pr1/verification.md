# Verification — 22 October 2026

Production builds and tests used Node 24.21.0, pnpm 10.18.3, Chromium, PostgreSQL 17,
and an isolated worktree and databases. The working user checkout was preserved.
No production database, deployment, article publication or merge was performed.

## Local checks

| Check | Actual result |
| --- | --- |
| Foundation validation (`pnpm check`) | Pass |
| ESLint (`pnpm lint`, zero warnings) | Pass |
| TypeScript (`pnpm typecheck`) | Pass |
| Production API + Next build (`GRID_ATLAS_NEXT_DIST_DIR=.next-test pnpm build`) | Pass |
| Node unit tests | 85 passed |
| Offline Python tests | 280 passed |
| API integration | 41 passed; the existing opt-in publisher test skipped in the default run |
| Opt-in publisher acceptance, initialized disposable database | 1 passed separately; exact-locale publication, duplicate rejection and review invalidation checked with synthetic data |
| Synthetic production browser suite, desktop/mobile | 378 passed |
| Genuine pinned-archive browser suite, desktop/mobile | 104 passed |
| Atlas history-restoration pan regression | 10/10 repeated desktop runs passed, five per locale |
| Screenshot capture | 24 final viewport captures + 18 section views; HTTP 200, no browser errors, no external requests, zero horizontal overflow |
| Exhaustive F1DB/DB/API/web coverage | Zero failures; see `archive-coverage.json` |

Both locales and the requested 1440/1920/1024/390 widths are represented in the new
browser tests and committed captures. Tests also cover native no-JavaScript GET
selection, exact API roster correspondence, no invented media, self-excluding
observed driver associations, headings, sources, keyboard disclosures/navigation,
forced colors, 200% text and reduced motion. Existing circuit-layout, seasonal
network, history restoration, Time Machine and editorial publication tests remain.

The final test build reports 128 kB first-load JS for the homepage, 129 kB for driver
profiles and 127 kB for constructor profiles. Baseline values were 122/129/121 kB;
no animation or UI dependency was added. Font subsets are self-hosted and preloaded.

The largest observed cumulative layout shift in the viewport-capture run was 0,
compared with approximately 0.211 before. These are single local runs after page
navigation, not a field metric, statistical comparison or Lighthouse certification.
The captures also record full document heights; long dossiers retain their ledger,
classifications and historical tables rather than truncating the archive.

## Coverage boundaries

Pinned archive: F1DB `v2026.17.0`, independently checked with its published checksum.
All 917 drivers, 187 constructors, 78 circuits, 77 seasons, 1,172 races, 830 entrants
and 27,665 main-race result entries match the import. The audit made 11,504 API
requests, rendered 2,364 UK/EN entity profiles and 2,406 total pages, and inspected
59,534 rendered archive links. It compared every result row and race identity with
the source archive. Empty identities retain useful profiles and explicit coverage.
`verify-real-archive.py` also passed SQL/API reciprocity and shared-result checks.

This is coverage of the pinned release, not all possible F1DB artifacts, newer
releases or independent historical verification. Recorded race-point sums and
source-reported championship classifications stay separate. Constructor names do
not establish entrant, ownership, employment or legal-successor identities.

## Fixes discovered during verification

- Removed the generic loading boundary that hid streamed dossier HTML from readers
  without JavaScript; retained feature-specific loading states.
- Corrected outage-server readiness to check a static font rather than expect HTTP
  200 from an intentionally broken data-backed route.
- Corrected enlarged-text overflow in decade numbers, driver opening typography,
  long race links and grid columns. No page-wide overflow clipping was added.
- Replaced ivory text on racing-red buttons with white (contrast approximately
  5.16:1). Muted text on charcoal measures approximately 7.97:1. These selected
  token checks are not a complete WCAG audit.
- Made the Atlas pointer-drag regression wait for history restoration's animation
  frames and compare the current viewport before and after a multi-step drag.
  No retries, skipped interaction checks or graph behavior changes were added.
- Updated assertions for intentional new headlines, palette and navigation labels.

## Remaining limits

- Zero media assets are approved for publication. Authentic photography and
  historical car imagery still require rights, identity, provenance and seasonal
  review. The implemented fallback is explicitly typographic.
- No new biography, rivalry feature or manuscript was approved or published.
  Existing biographies remain gated; factual archive summaries stay available.
- Circuit/season/race template redesign and the dedicated story/Atlas/Time Machine
  visual work belong to later milestones. Their functional regression coverage
  passes in this milestone.
- Chromium verification is extensive but does not substitute for assistive-device
  testing or Safari/Firefox review. The in-app browser bridge was unavailable;
  repository Playwright supplied browser and screenshot verification.
- PR checks are the authority for remote CI. Do not merge or deploy on a failing or
  incomplete required check.
