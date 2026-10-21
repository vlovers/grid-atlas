# History Atlas v1

## Audit and scope

Started from `origin/main` at `b00ab3f` in an isolated `feat/history-atlas-v1`
worktree. The merged #153/#154/#157 work already provides the visual tokens,
responsive shell, strict seasonal graph readers, reciprocal Explorer, exact
race evidence, paginated associations, a no-script text view, and Time Machine.
The missing feature was a single discovery → season → connection → new focus →
return journey. This implementation adds `/uk/atlas` and `/en/atlas` and reuses
those contracts rather than building another API or comparison tool.

Reviewed README, architecture, roadmap, workflows, `explorer-graph.tsx`,
`explorer/network-model.ts`, `components/atlas`, and the lineage pages/API.
The roadmap/README descriptions of the old ten-node graph lag merged #157.
Lineage is an independently reviewed constructor/entrant claim set, not the
imported driver/constructor association graph. It stays separate and linked.
The open editorial #156/#151/#71 and operations #131 PRs, later champion work
and circuit research changes are outside this implementation.

## Graph library decision

| Option | Fit for this view | Maintenance / accessibility | Decision |
| --- | --- | --- | --- |
| Existing SVG Explorer | Already handles the API cap, evidence, list and URLs | Custom viewport/navigation and hand-positioned nodes; would require more bespoke interaction work | Reuse its contracts, copy/count rules, evidence component and fallback; retain legacy URLs |
| React Flow `@xyflow/react` 12.12.0 | React DOM identities + SVG edges; built-in viewport, fit, selection, keyboard focus and controls | Localizable accessibility instructions; straightforward React composition; must still test the final UI | Selected; lazy-loaded only for an open map |
| Cytoscape.js 3.34.4 (evaluated, not installed) | Strong built-in layouts and large-network analysis | Canvas renderer would require additional DOM focus/inspector synchronization for this bounded React view | More adapter work for this use case |

React Flow, Cytoscape.js and Dagre are MIT licensed. Registry unpacked sizes observed
were React Flow 1,216,196 B, Cytoscape.js 5,704,386 B, Dagre 1,413,014 B; these
are **not browser bundle sizes**. See verification for measured production chunks.

Automatic layout is necessary for variable-degree maps and the vertical mobile
view. Dagre 3.1.1 supplies geometry, with two layout ranks around a focus rank.
Its temporary rank edges are solely layout constraints. Displayed relationships
retain the API's original endpoints, counts and provenance. No custom pan/zoom,
dragging or node layout algorithm is added. Read-only nodes cannot create,
delete, reconnect or edit historical relationships. ELK is not required.

References: [React Flow accessibility](https://reactflow.dev/learn/advanced-use/accessibility),
[viewport](https://reactflow.dev/learn/concepts/the-viewport),
[layout guidance](https://reactflow.dev/learn/layouting/layouting),
[Cytoscape.js documentation](https://js.cytoscape.org/),
[Dagre](https://github.com/dagrejs/dagre).
[Dependency notices](dependency-licenses.md) retain installed permission notices;
the canvas retains the React Flow attribution link.

## Architecture and URL state

- Server page: bounded identity search (12/page), imported season catalogue,
  career projection, strict existing graph reader, and bounded trail labels.
- `model.ts`: canonical BIGINT IDs, URL encoding, six-step bounded trail,
  career-to-observed-years projection and safe legacy profile links.
- `workbench.tsx`: selected pair, same-document URL history, inspector, permalink,
  clipboard fallback, loaded list and canonical evidence links.
- `flow-network.tsx` / `flow-layout.ts`: library viewport and Dagre geometry.
  Maximum 8 neighbors + focus on desktop, 2 + focus on mobile. All 25 loaded
  associations remain selectable in the list; the existing complete pagination
  route exposes additional associations (e.g. Cooper 1960 has 34).
- Existing `EvidencePreviewPanel` loads at most three races through the existing
  server action. The full evidence page remains available if preview loading fails.
- Existing text route receives explicit `kind`, `id`, `year`, `selected` from
  Atlas URLs, keeping JavaScript-disabled access operational for explicit maps.

Example (resolve IDs through the API; numeric values are database-local):

```text
/en/atlas?kind=driver&id=72&year=1988&selected=114
/uk/atlas?kind=constructor&id=114&year=1988&selected=72&trail=driver:72:1988:114
```

Trail entries store only kind/ID/year/selected ID. Labels come from bounded,
validated graph responses; invalid trails are discarded with a notice. A stale
trail item can retain a canonical ID label without breaking the current map.
Changing focus preserves the selected pair. Trail links truncate later steps;
browser Back/Forward restores local selections. Season navigation deliberately
starts with that season's first loaded association. A permalink retains the
active season, pair and trail. Locale switching retains the query.

## Historical and publication boundaries

- Pair counts are copied from the graph: distinct races, result entries and
  races with winning results. Counts are not summed across partners.
- Career participation supplies the observed timeline; no years are filled in
  across gaps. The global imported-season selector can inspect an empty year.
- Recorded results do not prove official starts, contracts, transfers or legal
  succession. Constructor and entrant identities are not interchangeable.
- Identity-source attribution is not per-result provenance. Exact race pages,
  F1DB attribution, CC BY 4.0 and source limitations remain accessible.
- No image, biography, dossier, historical fact store, media approval,
  circuit pipeline, backend contract or publication control is changed.

## Local preview

Use Node 24, pnpm 10.18.3, Python and disposable PostgreSQL. From the feature
worktree, follow README migrations and the checksum-verified pinned import.

```sh
pnpm install --frozen-lockfile
pnpm build
# Terminal A: set DATABASE_URL to your disposable imported database
HOST=127.0.0.1 PORT=3402 pnpm --filter @grid-atlas/api start
# Terminal B
API_BASE_URL=http://127.0.0.1:3402 SITE_URL=http://127.0.0.1:3403 \
  pnpm --filter @grid-atlas/web start --hostname 127.0.0.1 --port 3403
```

Open `http://127.0.0.1:3403/en/atlas` or `/uk/atlas`. Search a driver, choose a
season, inspect a connection, make it the focus, and use the trail to return.
Do not run `next dev` or rebuild `.next` while a production preview/test is
using that build artifact.

## Limitations

- Legacy profile/catalogue API detail routes accept 32-bit IDs; graph/career
  readers accept BIGINT. Atlas keeps exact IDs and omits unsupported profile
  links. This backend mismatch is documented, not broadened in this UI PR.
- Six focus changes are shareable in one URL; earlier steps require browser
  history. The limit bounds URL length, server reads and breadcrumb rendering.
- Trail names use up to six small graph requests; the career endpoint supplies
  all participation to the server, but only distinct years reach the client.
  A future lightweight years endpoint could reduce server transfer.
- No-script text access requires explicit identity **and year** in the Atlas
  URL. The discovery page and default-year resolution use Next streaming and
  JavaScript; the existing standalone text Explorer is the fallback for maps.
- Legacy Explorer and lineage rendering remain intact. Migrating their viewport
  code to the selected library is separate work, with their own regressions.
- This is a result-association atlas, not an all-history force-directed graph,
  official entry-list tool, legal lineage inference or independently fact-checked
  historical narrative. No production deployment or editorial approval occurs.

See [verification](verification.md) and committed screenshots for actual results.
