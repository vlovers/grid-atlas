# Grid Atlas — media storytelling reboot

A visual reboot stacked on Draft PR #153 (`a19a8334c618f595731befdca48c5c6c0803a140`), related to #152. The base supplies the tokens, shared navigation, bounded driver catalogue, API integration, URL state and reusable career model. This PR changes composition and discovery rather than replacing that infrastructure.

## Audit and boundaries

Audited current main (`2efb6c3`), #153, existing worktrees, routes, career/milestone/season/circuit contracts, publication controls and browser/real-archive CI. Open content PRs #151/#71 and operations PR #131 remain isolated. Work lives only in `/private/tmp/grid-atlas-media-reboot`, branch `feat/media-storytelling-reboot`. No backend, API contract, historical import, dossier, review, publication registry, dependency, CI gate or `.idea/` changes.

The publication media registry has **zero approved assets**. This implementation therefore uses original decorative inline SVG artwork, not downloaded or generated photography. The artwork deliberately does not depict a particular historic car, helmet, portrait or circuit layout. Visible credits explain this distinction; decorative SVGs are hidden from assistive technology. No licensing or human approval is fabricated. Approved media and article components retain their existing publication gates.

The API supplies recorded race milestones, per-season result counts, observed constructor associations and canonical identities. It does not supply approved narratives, championship standings or rivalry claims. Story modules use those exact records and valid existing routes. A paired driver module requires a real common recorded season and offers two perspectives without asserting a rivalry. Missing records remain missing.

## Implemented experience

- **Media front page:** cinematic original open-wheel artwork, huge cover typography, prominent search, a real race opening, horizontal race posters, asymmetric driver covers, imported-decade discovery, paired-season perspectives, circuit spotlights, split-screen Time Machine and a graphic Explorer teaser. Different compositions and cream/dark/color panels replace the repeated archive-card rhythm.
- **Reusable driver cover story:** original helmet artwork, actual career span and recorded totals, an exact first-win/first-appearance opening, illustrated season chapters, chronological constructor eras, race moments and a Time Machine strip. Charts, constructor/season map and tables are closed disclosures near the bottom. Existing deep links, source evidence, season selection and approved content remain available.
- **Entity direction:** shared illustrated headers for circuits, races, seasons and constructors, including catalogues. Their evidence and tables retain existing behavior; these are introductory template improvements, not the full remaining redesign.
- **Motion and interaction:** speed lines, artwork drift, card lifts, progressive section reveals, native snap rails with arrow buttons and keyboard scrolling, a session-persisted motion pause control, reduced-motion and forced-color support. Content is visible before JavaScript; links and native disclosures remain usable without enhancement.
- **No added dependencies or remote media requests.** Discovery is bounded on the server; no entire driver archive is downloaded to the client. Only small interaction islands hydrate.

### Main files

| Area | Files |
| --- | --- |
| Homepage | `apps/web/src/app/[locale]/page.tsx`, `home.module.css` |
| Shared story vocabulary, artwork, rail, header and motion | `apps/web/src/components/stories/{copy,story-model,motorsport-art,story-card,story-rail,story-header,experience}.*` |
| Driver composition | `apps/web/src/components/driver/driver-showcase.tsx`, `showcase.module.css` |
| SVG hydration repair | `apps/web/src/components/atlas/career-signature.tsx` |
| Entity covers | Existing circuit/race/season/constructor routes and `components/catalogue.tsx` |
| Regression coverage | `tests/storytelling.test.mjs`, `tests/browser/storytelling.spec.ts`, `tests/real-archive/media-storytelling.spec.ts`; existing atlas/driver tests extended |
| Reproducible captures | `scripts/capture-media-reboot.mjs` |

## Before / after

The before captures are inherited from #153. After captures use the same pinned archive, desktop 1440×1000 and mobile 375×812, with reduced motion for stable stills. Home and driver images show the full reading flow; race/circuit images show the first viewport. JPEGs are native browser captures, not edited composites.

| Page | Before desktop | After desktop | Before mobile | After mobile |
| --- | --- | --- | --- | --- |
| Homepage | [#153](../grid-atlas-2/screenshots/after-home-desktop.png) | [Reboot](screenshots/home-en-desktop.jpg) | [#153](../grid-atlas-2/screenshots/after-home-mobile.png) | [Reboot](screenshots/home-en-mobile.jpg) |
| Senna | [#153](../grid-atlas-2/screenshots/after-senna-desktop.png) | [Reboot](screenshots/driver-en-desktop.jpg) | [#153](../grid-atlas-2/screenshots/after-senna-mobile.png) | [Reboot](screenshots/driver-en-mobile.jpg) |

Ukrainian: [home desktop](screenshots/home-uk-desktop.jpg), [home mobile](screenshots/home-uk-mobile.jpg), [driver desktop](screenshots/driver-uk-desktop.jpg), [driver mobile](screenshots/driver-uk-mobile.jpg).

Entity direction: [circuit desktop](screenshots/circuit-en-desktop.jpg), [circuit mobile](screenshots/circuit-en-mobile.jpg), [race desktop](screenshots/race-en-desktop.jpg), [race mobile](screenshots/race-en-mobile.jpg). UK equivalents are also in `screenshots/`.

## Local preview

Requires Node 24+, pnpm 10.18.3, PostgreSQL 17, Python 3, `psql` and the pinned F1DB v2026.17.0 archive/checksums. Use a disposable database and unused ports.

```sh
pnpm install --frozen-lockfile
docker run --name grid-atlas-story-preview \
  -e POSTGRES_USER=grid_atlas -e POSTGRES_PASSWORD=local_only \
  -e POSTGRES_DB=grid_atlas -p 127.0.0.1:55449:5432 -d postgres:17-alpine
export DATABASE_URL=postgresql://grid_atlas:local_only@127.0.0.1:55449/grid_atlas
bash scripts/import-f1db.sh /path/to/f1db-json-splitted.zip /path/to/checksums_sha256.txt
pnpm build
HOST=127.0.0.1 PORT=3382 pnpm --filter @grid-atlas/api start
# Another terminal with the same DATABASE_URL:
API_BASE_URL=http://127.0.0.1:3382 SITE_URL=http://127.0.0.1:3383 \
  pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3383
```

Open `http://127.0.0.1:3383/uk` or `/en`. Follow the cover link or search `ayrton-senna`; numeric IDs are resolved from each import. The implementation session uses its own existing container `grid-atlas-media-reboot-db` on 55448. Do not reuse other worktrees' databases.

Capture native screenshots:

```sh
PREVIEW_URL=http://127.0.0.1:3383 PREVIEW_API=http://127.0.0.1:3382 \
  node scripts/capture-media-reboot.mjs
```

See [verification.md](verification.md) for exact check results and reproduction.

## Remaining work

- Licensed photography requires independent human review and registry approval. Draft biographies and rivalry narratives require the existing editorial approval workflow. This PR cannot supply either approval.
- The full interactive Explorer and Time Machine redesign remains Batch 2. Existing functionality is retained and their previews are richer.
- Entity content below the new covers remains largely archival. Full constructor/season/race/circuit storytelling is a later batch.
- Full Safari/Firefox, assistive-technology, real-device and performance audits remain. Chromium mobile emulation and automated keyboard/reduced-motion/reflow checks do not replace these.
- This is a stacked Draft PR, dependent on #153. No deployment or merge is authorized by this deliverable.
