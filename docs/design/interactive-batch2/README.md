# Grid Atlas 2.0 — interactive history, Batch 2

Issue #155, parent #152. This is one cohesive Explorer + Time Machine batch, stacked on #154 (`ffda1775723abdcc71dc4073043b1a0c7b94525a`). Its PR targets `feat/media-storytelling-reboot` while #153 → #154 remain Draft. Do not merge or deploy before dependency review and green CI.

## Audit and scope

Inspected current main, worktrees, dependency heads/review feedback, Explorer routes and reciprocal drilldowns, Time Machine controller/response parser, graph/page/evidence caps, UK/EN contracts, publication gates and existing synthetic/pinned-import tests. #154's only outstanding owner comment asks for this Batch 2 and confirms the stack order. Content #151/#71, the subsequently opened research pack #156, and operations #131 remain isolated. Homepage/driver/story layouts, backend controllers, integration fixtures, archive data, editorial reviews, media registry, dependencies and CI gates are unchanged.

Verified against the actual disposable import:

| Contract | Existing behavior preserved |
| --- | --- |
| Driver/constructor connections | Object response: focus, nodes, observed-result edges, year, limit (25), truncation, identity source, limitations |
| Complete connections | 25 neighbors/page; total and next offset; counts retain exact BIGINT string identities |
| Pair race evidence | Up to 100 distinct races with round/date/name, result-entry counts and winning-entry counts |
| Two-season comparison | Added / removed / unchanged arrays, each containing nullable from/to counts; max 500 neighbors, explicit failure above the bound |
| Query semantics | Explorer `year`, `selected`; comparison `kind`, `id`, `from`, `to`; existing evidence return parameters and routes |

The API accepts reverse comparisons; the existing UI deliberately requires chronological earlier/later years. Both entity directions and the API's inverse set comparison are tested. No transfer, contract, official-start, championship or legal-succession interpretation is added. Constructor and entrant identities remain distinct.

## Explorer

- Large central focus with original technical grid, directional observed-result edges and readable node plates. Layout is deterministic, not a force simulation.
- Desktop displays up to eight nodes per visual window. Mobile displays up to four as a fitted vertical network. Positions avoid label overlap; full identities remain in accessible names, titles, list and inspector.
- Zoom 100–250%, pointer drag on desktop, pan buttons, keyboard arrows / + / − / Home, reset-to-center and bounded view coordinates. Vertical touch scrolling remains available.
- In-place selection pushes `selected` into native history. Back/Forward restores the identity; choosing an off-window association brings its window into view. Map selection focuses the inspector; list selection keeps the user's place.
- Inspector prioritizes exact counts, public identity/source links and an on-demand preview of up to three exact races. A bounded server action wraps the existing evidence reader; it does not introduce an archive API. Stale responses are ignored. Loading/error/retry/empty states retain a direct evidence-page link.
- Long result-count explanations use a native disclosure. Reciprocal graph, season, profile, Time Machine and race evidence links remain canonical.
- Visual-window count, loaded 25-edge slice and full paginated dataset are explicitly distinguished. No-data and selections outside the loaded slice are honest.

## Time Machine

- Distinct mint earlier / violet later panels with a shared records axis and large year typography. Stacked panels retain clear labels at 375–390px.
- A selected association shows exact per-season races, entries and winning-result races, or a separately labelled absence of imported records. A missing association is never rendered as a zero statistic.
- All / later-only / earlier-only / both filters, six-identity visual windows, selection highlighting, a canonical share link and native Back/Forward restoration.
- Overview totals add association counts and result entries only. Distinct race/winning-race counts are **not summed across partners**; the same race can involve multiple partners.
- Exact evidence, reciprocal graph, focus graph, season and profile links. The complete grouped comparison remains in a closed native disclosure, including per-association deltas and limitations.
- Entity search remains bounded to 50 results; year forms and existing validation/error/empty/not-found behavior remain intact.

## No JavaScript / shared changes

A real browser with JavaScript disabled exposed an inherited limitation: Next.js's streaming loading fallback stays visible while the resolved content waits in its hidden streaming container. Rather than changing all layouts or disabling streaming globally, this batch supplies a small public HTML text view at `/{locale}/explorer/text` for networks, comparisons and pair evidence.

Loading fallbacks offer a **current-selection text-view link inside `noscript`**. The middleware only adds the current internal path/query as an overwritten request header; media/discovery exclusions and locale routing stay intact. Shared loading gains that link. Language controls additionally include their visible abbreviations in their accessible names, correcting a measured label-in-name issue. These are the only shared-shell changes; homepage and driver compositions remain untouched. The text response uses the same readers and caps, native pagination, escaped metadata, no script, restrictive CSP, no-store and noindex. It never imports private articles/media. No-JS users explicitly choose this text view; the interactive page itself still uses streaming. Existing non-feature pages retain their previous behavior.

[Next.js loading/streaming behavior](https://nextjs.org/docs/app/api-reference/file-conventions/loading) is documented by the framework; the failure and fallback were also reproduced with browser JavaScript actually disabled.

## Licensing and provenance

All newly drawn network geometry, grids and panels are original UI code. No photographs, logos, track outlines, sourced artwork, biographies or approvals are added. The publication registry remains empty. Existing approved-only article/media gates and historical URLs are preserved. Imported-record consistency is tested; independent historical verification is not claimed.

## Screenshots

Native JPEGs, no edited composites. Both versions use the same pinned release, EN/UK, desktop 1440×1000 and mobile 375×812 with reduced motion. Senna 1993 is a sparse network; Cooper 1960 is the real dense pilot; Senna 1987/1988 supplies a two-era comparison. Identities are resolved by canonical source IDs, never assumed database IDs.

| Experience | Before desktop | After desktop | Before mobile | After mobile |
| --- | --- | --- | --- | --- |
| Sparse network | [Before](screenshots/before-explorer-en-desktop.jpg) | [After](screenshots/after-explorer-en-desktop.jpg) | [Before](screenshots/before-explorer-en-mobile.jpg) | [After](screenshots/after-explorer-en-mobile.jpg) |
| Dense network | [Before](screenshots/before-explorer-dense-en-desktop.jpg) | [After](screenshots/after-explorer-dense-en-desktop.jpg) | [Before](screenshots/before-explorer-dense-en-mobile.jpg) | [After](screenshots/after-explorer-dense-en-mobile.jpg) |
| Time Machine | [Before](screenshots/before-time-machine-en-desktop.jpg) | [After](screenshots/after-time-machine-en-desktop.jpg) | [Before](screenshots/before-time-machine-en-mobile.jpg) | [After](screenshots/after-time-machine-en-mobile.jpg) |

UK: [network desktop](screenshots/after-explorer-uk-desktop.jpg), [network mobile](screenshots/after-explorer-uk-mobile.jpg), [dense desktop](screenshots/after-explorer-dense-uk-desktop.jpg), [dense mobile](screenshots/after-explorer-dense-uk-mobile.jpg), [comparison desktop](screenshots/after-time-machine-uk-desktop.jpg), [comparison mobile](screenshots/after-time-machine-uk-mobile.jpg). Matching UK before captures and focused viewport captures are also committed.

## Local preview / reproduction

Node 24+, pnpm 10.18.3, Docker/PostgreSQL 17, Python 3, `psql` and the pinned F1DB v2026.17.0 zip/checksums. Use a disposable database and unused ports; don't modify another worktree/database.

```sh
pnpm install --frozen-lockfile
docker run --name grid-atlas-batch2-preview \
  -e POSTGRES_USER=grid_atlas -e POSTGRES_PASSWORD=local_only \
  -e POSTGRES_DB=grid_atlas -p 127.0.0.1:55451:5432 -d postgres:17-alpine
export DATABASE_URL=postgresql://grid_atlas:local_only@127.0.0.1:55451/grid_atlas
bash scripts/import-f1db.sh /path/to/f1db-json-splitted.zip /path/to/checksums_sha256.txt
pnpm build
HOST=127.0.0.1 PORT=3392 pnpm --filter @grid-atlas/api start
# Second terminal:
API_BASE_URL=http://127.0.0.1:3392 SITE_URL=http://127.0.0.1:3393 \
  pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3393
```

Open `http://127.0.0.1:3393/uk` or `/en`; follow the homepage Explorer preview, or search a driver and use a seasonal connection. The current session's separate container is `grid-atlas-interactive-batch2-db` on 55450. Do not run a second preview on occupied ports. Numeric IDs vary with each import.

```sh
PREVIEW_URL=http://127.0.0.1:3393 PREVIEW_API=http://127.0.0.1:3392 \
  node scripts/capture-interactive-batch2.mjs after
```

See [verification.md](verification.md) for exact checks and cross-browser commands. Never rebuild or run `next dev` in this worktree while production browser tests consume its `.next` artifact.

## Remaining risks

- Live panning/zoom and visual filters require JavaScript. The explicit text view provides bounded data and native links without it.
- Graph/evidence/comparison caps remain API constraints. Extra associations use existing pagination; evidence above 100 remains explicitly truncated by its existing page. Comparisons above the backend bound still fail visibly.
- No automated test replaces manual visual review, hardware screen-reader use, real-device testing or independent historical/media review. Local Lighthouse measurements are informational; no production performance guarantee, merge or deployment is claimed.
