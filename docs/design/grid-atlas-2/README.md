# Grid Atlas 2.0 — Batch 1

Related: #152. This is the shared foundation, homepage, driver index and reusable driver dossier batch. Explorer and Time Machine retain their existing full interfaces; their redesign is Batch 2. Other entity compositions and a full performance/accessibility audit remain Batch 3.

## Short audit

Audited main `2efb6c3f3dcc61a3807e7f1cad2aa119be2f51f3` after the merged home PR #150 and reusable driver showcase PR #149. Work is isolated in `feat/grid-atlas-2-batch1`. Open content PRs #151/#71 and operations PR #131 were inspected and remain separate. No backend, archive, editorial dossier, review, media registry or `.idea` changes.

Useful existing architecture retained:

- Next.js 15 App Router, next-intl UK/EN routing, SEO metadata, canonical URLs, breadcrumbs and localized failures.
- Server-side `getData` with no-store requests, timeout and distinct missing/outage behavior.
- Bounded catalogue pagination and native GET search/navigation. The catalogue API supports name/source-ID search, limit and offset. **It does not expose total counts, nationality filters or career-year filters.** The UI reports the page count and matching-position range, not a fabricated total.
- Driver career summary, observed constructor participation, exact race milestones, season rows and source observations. Counts describe imported result rows/distinct races, not official starts, contracts, championship standings or titles.
- Published-article API and media publication eligibility gates. Draft biographies and candidate photographs never enter the public components.
- Existing synthetic desktop/mobile Playwright, genuine pinned-archive acceptance, unit/integration tests and CI workflows. CI gates are unchanged.

## Implementation

### Design and shell

`apps/web/src/app/tokens.css` defines the requested ink, dark surfaces and restrained coral, with a lighter accent for small text. `components/atlas/shell.module.css` and `navigation.tsx` provide a responsive shared shell, current-route indication, localized navigation and a keyboard-scrollable mobile navigation rail. Language controls retain full accessible names, route and search parameters. No external fonts, images, scripts or added dependencies.

### Homepage

Distinct compositions replace the old static tile group:

1. Large editorial hero with native driver search and an original, API-derived career drawing.
2. Interactive decade/year browser derived strictly from imported season IDs. A no-JavaScript list exposes all imported years.
3. Asymmetric driver gallery: Senna, Fangio and Hamilton, resolved by canonical F1DB IDs. This is a curated selection, not a ranking. A small import without those identities falls back to three actual catalogue records, including honest no-result states.
4. Constructor index and connected preview, each tied to a real observed year and seasonal Explorer destination. No rivalry, entrant identity or legal succession is inferred.
5. Contrasting two-season Time Machine launcher. Moving the earlier year past the current later year selects the next available recorded season; the later selector cannot submit a reversed range when enhanced.
6. Accessible source/coverage entry points.

The server fetches five bounded discovery requests, then at most three career/season pairs in parallel. Only small year lists and the focus identity are hydrated for the interactive discovery controls; the driver catalogue is not downloaded into the client. Outages use the existing localized error boundary rather than invented fallback records.

### Driver discovery and dossiers

The driver catalogue is a typographic archive index with prominent search, ordinal positions, readable names, source IDs, focus/hover feedback, page counts and previous/next URLs. It preserves the existing 100-record API page size, lookahead and SEO behavior. Other catalogues keep their original composition for Batch 3.

Every driver receives the same reusable dossier. Its hero uses real season/result data when no photograph is approved. An original career signature shows entries and winning entries; accessible SVG descriptions and hover titles expose exact counts. A chronological constructor/year map links each observed cell to its seasonal graph and preserves distinct constructor IDs. The overview derives its constructor/season counts from the API. Existing deep links, important-season selection, race evidence, publication messages, native closed statistics disclosures and source observations remain available.

Motion is limited to arrival/reveal, selection/hover feedback and slow relationship-edge flow. Reduced-motion disables animation and smooth scrolling. Forced-color fallbacks preserve interaction. The horizontally scrollable career map has a named, focusable region; the small homepage network uses a readable mobile list instead of shrinking node labels.

## Historical and implementation boundaries

- No championship API exists in this archive contract. Championship milestones continue to show an explicit coverage limitation. No title totals or official standings are invented.
- No new biography or image is approved by this PR. Approved articles and verified media still use the existing gates; all pages work without either.
- The career drawing is an original visualization of result counts, not a circuit outline, photograph or standings chart. Constructor rows are observations, not contracts or transfers. Missing records do not establish nonexistence.
- Discovery is manually curated and bounded, with no client-wide archive fetch. The home depends on the existing API; caching/revalidation policy and full field-level runtime contract validation are separate work.
- No zoom/pan redesign of the full Explorer and no full Time Machine redesign in this batch. Both remain functional and receive real entry links.
- Chromium desktop/mobile checks are automated; a full cross-browser, assistive-technology and Lighthouse audit is still needed. No performance score or production-readiness claim is made.

## Preview

Requires Node 24+, pnpm 10.18.3, Docker, `psql`, Python 3 and the pinned F1DB archive/checksum files. Use your own disposable database and unused local ports. Do not reuse another agent's database/worktree.

```sh
pnpm install --frozen-lockfile
docker run --name grid-atlas-redesign-preview \
  -e POSTGRES_USER=grid_atlas -e POSTGRES_PASSWORD=local_only \
  -e POSTGRES_DB=grid_atlas -p 127.0.0.1:55447:5432 -d postgres:17-alpine
export DATABASE_URL=postgresql://grid_atlas:local_only@127.0.0.1:55447/grid_atlas
bash scripts/import-f1db.sh /path/to/f1db-json-splitted.zip /path/to/checksums_sha256.txt
pnpm build
HOST=127.0.0.1 PORT=3372 pnpm --filter @grid-atlas/api start
# Another terminal:
API_BASE_URL=http://127.0.0.1:3372 SITE_URL=http://127.0.0.1:3373 \
  pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3373
```

Open `/uk` or `/en` on `http://127.0.0.1:3373`. Search `ayrton-senna` and follow the result; numeric driver IDs are not portable between databases. This session's existing preview container is `grid-atlas-2-batch1-db` on 55447; do not run the example container on that port while it is active.

## Verification and screenshots

See [verification.md](verification.md) for exact executed results and reproduction commands.

The `before-*` screenshots were captured from main `2efb6c3` with the same pinned import and viewports as the redesign. The `after-*` screenshots show this branch. No photo or generated image assets are included. Homepage screenshots are full-page; catalogue and dossier screenshots capture the first viewport. Real-archive Playwright also captures full dossier evidence in its output.

Reproduce final screenshots against the isolated preview:

```sh
PREVIEW_URL=http://127.0.0.1:3373 PREVIEW_API=http://127.0.0.1:3372 \
  node scripts/capture-redesign.mjs after
```

| Page | Before desktop | After desktop | Before mobile | After mobile |
| --- | --- | --- | --- | --- |
| Home | [Before](screenshots/before-home-desktop.png) | [After](screenshots/after-home-desktop.png) | [Before](screenshots/before-home-mobile.png) | [After](screenshots/after-home-mobile.png) |
| Driver index | [Before](screenshots/before-drivers-desktop.png) | [After](screenshots/after-drivers-desktop.png) | [Before](screenshots/before-drivers-mobile.png) | [After](screenshots/after-drivers-mobile.png) |
| Senna | [Before](screenshots/before-senna-desktop.png) | [After](screenshots/after-senna-desktop.png) | [Before](screenshots/before-senna-mobile.png) | [After](screenshots/after-senna-mobile.png) |

Ukrainian final captures: [home desktop](screenshots/after-home-uk-desktop.png), [home mobile](screenshots/after-home-uk-mobile.png), [catalogue desktop](screenshots/after-drivers-uk-desktop.png), [catalogue mobile](screenshots/after-drivers-uk-mobile.png), [Senna desktop](screenshots/after-senna-uk-desktop.png), [Senna mobile](screenshots/after-senna-uk-mobile.png).
