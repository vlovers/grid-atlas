# Local-only ten-biography preview

This **does not publish** content or alter the public API or `content_articles` table. It is intentionally available only when both `NODE_ENV=development` and `GRID_ATLAS_LOCAL_EDITORIAL_PREVIEW=1`. Without the flag, preview routes return 404, including production builds.

## Run

From repository root, with local API/database already running as in the existing development setup:

```sh
pnpm install --frozen-lockfile
GRID_ATLAS_LOCAL_EDITORIAL_PREVIEW=1 pnpm --filter @grid-atlas/web dev
```

Visit `http://localhost:3000/en/editorial-preview/drivers` or `http://localhost:3000/uk/editorial-preview/drivers` (adjust port if the Next.js dev server selects another port). Select any of the ten biographies, switch locale, and expand paragraph source locators.

The route reads checked-in, **unapproved** EN/UK dossier JSON directly from `docs/editorial/biography-expansion-batch-2/dossiers/`. It deliberately uses a fixed ten-driver allowlist, not an arbitrary filesystem path. The preview is a source-review aid, not the normal driver page and not a publication shortcut. Public driver profiles and their fail-closed article endpoint remain unchanged.

## Review checklist

For each locale and driver: inspect source URLs and passage locators, check dates and championship data, compare translation against the English dossier, check originality and narrative flow. Record corrections in the dossier and regenerate manuscript using the existing renderer. Do not mark a review sidecar as approved until a real independent editor has inspected the exact revision. Preview mode is not a substitute for that approval.

If the page returns 404, confirm you started **Next.js in development** with the preview flag and that your working copy includes this branch. If dossier loading fails, confirm the app runs from the monorepo's `apps/web` working directory; the route resolves the repository dossier directory relative to that workspace.
