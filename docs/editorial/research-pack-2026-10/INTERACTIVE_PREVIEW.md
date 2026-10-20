# Local interactive editorial preview — Senna vs Prost, 1988

This is **not** a public web feature and does not modify Next.js routes. The HTML prototype is assembled from the internal official-results research ledger only when explicitly run.

```sh
python3 scripts/render-1988-duel-preview.py --output /tmp/grid-atlas-1988-editorial-preview.html
open /tmp/grid-atlas-1988-editorial-preview.html # macOS
python3 -m unittest discover -s tests -p 'test_editorial_1988_preview.py' -v
```

The self-contained file can be opened locally in a browser without a server. It provides EN/UK controls, accessible 16-round navigation, two independently labeled scoring calculations, driver result detail and exact official F1 source links. It is an **interactive editorial prototype**, not a screenshot or production implementation.

Both series are calculations from official per-race rows. `best-eleven cumulative` is a *reconstruction at each point in time*, not an independently verified official championship standings record at each race. The explanation of the historical regulation needs primary-source review, as do UK/EN prose and every proposed media asset.

No photos, logos, public pages, imported copy or publication authorizations are generated. The generated preview belongs outside source-controlled public assets; do **not** place its output inside `apps/web/public`. Merging this editorial infrastructure must not silently expose research content.

## Download the actual CI-tested preview

On the latest successful **Pinned F1DB real-archive acceptance** run for PR #156, open GitHub Actions → workflow run → **Artifacts** → `internal-1988-editorial-preview`. Download the ZIP, extract it and open `grid-atlas-1988-preview.html` in a local browser. It includes three machine-readable research reports (parity, race cards and unapproved editorial review queue) for traceability. The artifact expires after **7 days**. No local database or development server is needed to view the HTML.

This is an **unpublished** preview, not a confidential attachment: because the GitHub repository is public, do not include secrets, unlicensed media, private reviewer notes or access credentials in these files. The preview stays strictly research-only and has `noindex`; GitHub-hosted artifact downloads do not constitute editorial publication authorization.
