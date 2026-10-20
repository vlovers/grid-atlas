# Driver showcase v1 — issue #145

## Audit and acceptance boundary

Implementation starts from `7e921dc` on the existing `feat/senna-showcase-v1` branch. #140–#144 are already merged: shared Story Reader contract, licensed media registry, driver hero, profile navigation and compact career grouping. The open operations PR #131 and Senna research PR #71 remain separate. This work uses its own checkout; other worktrees, `.idea/`, editorial dossiers, publication reviews, archive importers and backend modules are untouched.

The existing production route is `/{uk|en}/drivers/{numeric database ID}`. A pinned disposable import currently resolves `ayrton-senna` to `72`; that number is not stable identity and is never special-cased in the UI. Real-archive tests resolve both Senna and Lewis Hamilton through `/api/drivers?q={external_id}`.

### Actual API audit

| Public endpoint | Used for | Semantics / observed pilot |
| --- | --- | --- |
| `/api/drivers/:id` | Name, canonical external identity, recorded season range | Senna: `ayrton-senna`, 1984–1994 |
| `/api/drivers/:id/career?locale=uk|en` | Distinct race totals, all constructor participation, exact milestones, source observations | 162 distinct recorded races, 41 winning races, 80 podium result entries, 11 seasons |
| `/api/drivers/:id/seasons` | Interactive season selection, result-entry highlights, full table | Wins here count winning **result entries**; points are raw race-point sums |
| `/api/drivers/:id/teams` | Full constructor association table | Distinct races per constructor/season; not contracts or entrant identities |
| `/api/drivers/:id/article?locale=uk|en` | Publication-gated biography | Both Senna locales return 404; no research fallback |

The actual career response resolves the first observed race to `389`, first win to `406`, last win to `548`, last observed race to `551`. These returned IDs supply the pilot's links; no slug or guessed Formula1.com/internal numeric mapping is introduced. Exact dates are not used to order milestones because dates can be null and older imports can have unusual chronology.

**Championship blocker:** the public schema/API has no title or championship-standing records. `HISTORICAL_CORE.md` explicitly excludes full standings; the career API identifies `race_points_not_championship_standings`. This UI therefore cannot truthfully display the requested three championship milestones. It shows three clearly labeled seasons ranked by winning result entries, plus a visible championship-data gap. It does not label 1988/1990/1991 as title years from an unpublished dossier or derive titles from points/win ranks. Adding sourced championship records requires its own verified API/import contract. This limitation remains open for review rather than being disguised as a completed title feature.

## Cohesive public composition

The existing driver route now delegates to a reusable `DriverShowcase` with typed API fields and UK/EN copy. There is no Senna-only name, numeric ID, statistic, team color, photo or narrative in production code.

1. Editorial hero with recorded career range, four carefully labeled API metrics, an approved-media slot and two useful navigation actions.
2. Accessible chapter anchors and result-backed season milestones. A season strip changes the selected season through a shareable `?season=YEAR#driver-career` URL; unknown/duplicate queries fall back to a real available season.
3. Constructor-era rail with exact constructor, graph and evidence links. Consecutive observed years are grouped; gaps and returns are separate. Multiple constructors in one year are retained. No contract, transfer, entrant or legal-succession story is inferred.
4. Race highlight cards from exact API first/last race and win milestones. One race can carry several labels; every supplied result entry is preserved, including shared-car/DNS/DNF records. No subjective "greatest race" or disputed incident narrative is invented.
5. Visible Time Machine jump using the earliest/latest distinct recorded seasons. Single-season and empty careers have no invalid equal-year comparison link.
6. Publication-gated biography or an honest locale-specific unavailable state. No Story Reader object with a fabricated approval is constructed.
7. All original season/constructor records and the complete timeline remain in native, keyboard-operable disclosures. Deep tables have captions, row/column headings and keyboard-scrollable regions. Source details retain coverage limits, recorded points, unknown-point count and exact entity-release observations.

Navigation uses explicit localized native links. The first browser run found that a client-router transition requested a new season but left the original URL/selection unchanged; native links make the server selection and browser history reliable and continue working without JavaScript. Year selection is validated against actual available seasons, not a free-form route invention.

Styling lives in `components/driver/showcase.module.css`; no home, shared layout or global styles are changed. Stable media framing, visible focus, 44px targets, responsive layouts and motion-free/reduced-motion/forced-colors treatment are included. The former route-specific hero stylesheet is replaced by the shared showcase stylesheet.

## Editorial and media boundaries

Only `getPublishedArticle` supplies biography text. Existing API integration tests continue to enforce published/verified/supported claims and locale isolation. A 404 is a normal absence; transport errors still reach the app's existing error state. No draft filesystem read belongs in the production page.

Only the existing publication manifest supplies images. Its five candidates and rights metadata are not imported. Publication remains empty, so screenshots show a compact, non-deceptive portrait-pending state. A future approved portrait is chosen by canonical driver identity and passed through `LicensedMedia`'s review/status/metadata gate. Stale or withdrawn records cannot be selected. No copyrighted photos, generated portraits or unlicensed circuit imagery are introduced.

## Explicit local research review

```sh
node scripts/preview-story-review.mjs --acknowledge-unreviewed-draft
```

Open the **exact randomly generated URL** printed by the command. The server binds only to `127.0.0.1:3359`, requires its ephemeral token path and exact loopback Host, serves read-only UK/EN research, escapes manuscript HTML, leaves unresolved manuscript links as text, forbids external resource loading/framing/forms, disables caching and sets noindex/noarchive. An absent acknowledgement refuses startup. `--port 0` is supported for tests. Do not expose or forward this port; it is a local review utility, not a hosted preview or authentication service.

This script is outside the Next.js route tree and has no sitemap/public API adapter, approval signature, publication button, database connection or write path. It reads the existing six-chapter Senna–Prost research manuscript without changing it, and displays its source register/evidence supplement separately with an explicit unapproved banner in both languages. Nothing is relabeled as approved to satisfy the Story Reader contract.

### Human signoff plan — no automatic publication

- [ ] Split narrative assertions into traceable source claims and reconcile each with exact imported race IDs.
- [ ] Independently verify official standings/counting rules; raw 1988 race points are not counted championship points.
- [ ] Separate Suzuka classification facts from disputed intent, motives and governance claims. Resolve contradictions using primary evidence before publication.
- [ ] Review UK and EN independently under `docs/editorial/PUBLICATION_REVIEW.md` against final immutable revisions.
- [ ] Complete separate creator/license/attribution/context review under `docs/media/README.md`. Candidate metadata is not permission to publish.
- [ ] A real human reviewer must authorize publication through the existing workflow; this utility cannot supply that approval.

## Local public preview and reproduction

```sh
git fetch origin feat/senna-showcase-v1
git worktree add /private/tmp/grid-atlas-showcase-review origin/feat/senna-showcase-v1
cd /private/tmp/grid-atlas-showcase-review
pnpm install --frozen-lockfile
# Set DATABASE_URL to your disposable/local imported database; never production.
bash scripts/import-f1db.sh /path/to/f1db-json-splitted.zip /path/to/checksums_sha256.txt
pnpm build
# Terminal 1
HOST=127.0.0.1 PORT=3362 pnpm --filter @grid-atlas/api start
# Terminal 2
API_BASE_URL=http://127.0.0.1:3362 pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3363
```

Resolve the driver from `http://127.0.0.1:3362/api/drivers?q=ayrton-senna`; open `/uk/drivers/{returned id}` and `/en/drivers/{returned id}` at `http://127.0.0.1:3363`. On the documented pinned import these are `/uk/drivers/72` and `/en/drivers/72`. Reuse an existing checkout only if it is clean and not owned by another active task.

Checks:

```sh
pnpm lint
pnpm typecheck
pnpm test
python3 -m unittest discover -s tests -v
pnpm build
DATABASE_URL='<disposable-local-database-url>' pnpm test:integration
DATABASE_URL='<disposable-local-database-url>' pnpm exec playwright test
# On a genuine pinned import; no synthetic fixtures:
DATABASE_URL='<disposable-import-url>' pnpm exec playwright test --config playwright.real-archive.config.ts driver-showcase.spec.ts
git diff --check
```

The full existing real-archive suite also requires its documented `SMOKE_*` environment values, discovered by SQL in CI. New showcase cases independently discover numeric IDs and verify Senna and an unrelated driver in both locales on desktop/mobile. Regression fixtures cover empty/single-season careers, shared cars, repeated milestones, gaps/returns, stable ordering, publication isolation, preview Host/token restrictions and escaping. Browser cases cover real destinations, keyboard disclosures, mobile/200% text, safe media, no draft leakage, and source-backed metrics. Actual results and screenshots are recorded in the Draft PR; CI success alone is not visual approval.

Remaining limitations: championship API contract, human biography approvals, image rights, and any future publication-gated story endpoint. No production deployment or merge is part of this delivery.

## Visual review evidence

Screenshots use the same pinned Senna import and identical viewport sizes for the comparison (1440×1000 desktop, 375×812 mobile). The full initial Ukrainian page measures 4,229px → 3,977px on desktop and 5,545px → 5,472px on mobile, with the new sections included. This is a modest overall length reduction; the larger improvement is the removal of initially expanded repetitive tables and the addition of direct, scannable navigation. Expanded archive data remains available.

| | Before | After |
| --- | --- | --- |
| UK desktop | [Baseline](previews/senna-showcase-v1/before-uk-desktop.png) | [Showcase](previews/senna-showcase-v1/after-uk-desktop.png) |
| UK mobile | [Baseline](previews/senna-showcase-v1/before-uk-mobile.png) | [Showcase](previews/senna-showcase-v1/after-uk-mobile.png) |
| EN | — | [Desktop](previews/senna-showcase-v1/after-en-desktop.png) · [Mobile](previews/senna-showcase-v1/after-en-mobile.png) |

The in-app browser connection was unavailable, so these were captured with the project's Playwright tooling and inspected as image artifacts. Captures wait for the actual driver content, not the streamed loading shell. No synthetic photograph or approved biography is shown.
