# Licensed media pilot

> **Scope and date:** The pilot inventory and review counts below describe the **phase-one photographic-media pilot on 20 October 2026**, not all current repository assets. Since then, [Circuit Graphics V3](historical-circuit-svg-provenance.md) introduced 160 attributed historical SVG layout illustrations. These are a separate licensed-graphics collection; they do **not** imply approval of photographs, logos, or other media. Review each collection under its own provenance and license record.

> **23 October integration:** Driver, constructor and circuit pages now use the rights-gated image archive and editorial missing-media state. The original phase-one notes below remain a dated snapshot. Current counts still show five candidates and zero approved publication images; 160 attributed circuit SVGs remain separate. See the [practical approval/withdrawal workflow](approved-imagery-workflow.md) and run `pnpm audit:media --as-of YYYY-MM-DD`.

Phase 1 supplies a repository registry, review gates and reusable display components. **Five candidates, zero approved real assets.** The public application does not host or hotlink candidate photographs. Research-only original downloads have occurred in ephemeral private GitHub Actions storage; two original-image SHA-256 observations are recorded in [verified-original-observations.json](verified-original-observations.json). These downloads are not publication or rights approval. The demonstration shows safe fallbacks; its optional image cases use explicitly synthetic, non-geographic test geometry.

## Current original-ingestion tooling (24 October 2026)

The research-only [Commons batch ingestion command](commons-batch-ingestion.md) now has pinned original SHA-1, byte-count, dimensions and description revisions for **all five** staged Commons candidates (Schumacher, Alonso, McLaren MP4/4, Ferrari F2004 and Silverstone). Run `node scripts/audit-commons-evidence.mjs` for an offline coverage check. Before downloading, the ingester also compares the current Commons API SHA-1 to the pin, then computes local SHA-256 from the downloaded original. This is optional tooling, **not evidence that any file was downloaded or rights-approved**. The public photographic registry remains empty. All five staged candidate subject IDs are now present in the pilot F1DB identity snapshot: four new records (Schumacher, Alonso, McLaren, Silverstone) were obtained from the **original checksum-verified F1DB v2026.17.0 ZIP** in CI, alongside the previously pinned Ferrari record. The cross-era identity audit checks all staged subjects against original rows, rejects missing/changed IDs, and emits source-derived proposals if future candidates lack snapshot entries. The pinned-archive CI stores the **unpublished-cross-era-identity-audit** artifact. The verifier does not automatically approve images, assert that a photograph depicts its claimed subject, or clear media rights. Run `python3 scripts/audit-cross-era-identities.py --archive /path/to/f1db-json-splitted.zip --checksums /path/to/checksums_sha256.txt --output /tmp/grid-atlas-cross-era-identities.json` locally to reproduce. Review the proposed hashes against the original rows before a separate snapshot update.

## Architecture and ownership audit

Audited `main` at `71d8c6a` on 2026-10-20. At inspection, #133 (editorial batch) and #134 (UI redesign) were **issues**, with no published PR of those numbers. Open PRs included #131 (operations) and #71 (Senna draft). Recheck open work before integrating these components into public pages.

- Next.js 15 / React 19 / next-intl already support UK/EN routes. There was no reusable licensed-image component or approved public media collection.
- Migration `0006_editorial_content.sql` already defines driver-oriented `content_media_assets` with provenance and review fields. Existing editorial documentation already requires creator, license, attribution and human review. This pilot complements that policy without changing the database, editorial dossiers, publication reviews or API. It introduces no second CMS or database importer.
- Registry subjects use F1DB `(type, external_id)`, not database sequence IDs. Drivers, constructors, circuits and races stay distinct. Entrants are not treated as constructors. The small identity snapshot includes Ferrari for identity validation, not as an assertion about legal succession or a media-rights approval.
- New frontend files live under `apps/web/src/components/media/`. The preview is a separate local Next.js app, absent from the production route tree. No homepage, shared layout, global stylesheet, locale dictionary or subject page is changed.
- The only shared frontend change excludes the exact `/media` static namespace from locale middleware. Existing ordinary routes, including dotted paths, retain locale handling. The real-archive CI workflow also verifies the small pinned identity/layout snapshot using its existing artifact download.

Existing policy: [editorial verification](../editorial-verification.md) and [publication review](../editorial/PUBLICATION_REVIEW.md). Existing database media storage remains authoritative for its own editorial workflow; this pilot does not synchronize it automatically.

## Registry and review boundary

`registry.ts` defines strict, typed records and human-readable validation errors:

| Record | Location / purpose |
| --- | --- |
| Research candidates | `docs/media/candidates.json`; no delivery path, remote URL or approval is permitted |
| Publication | `apps/web/src/components/media/publication.json`; currently empty |
| Canonical identities / exact layout mappings | `docs/media/pilot-identities.json`; checked against the pinned archive |
| Observed Commons metadata | `docs/media/commons-pilot.metadata.json`; evidence for review, not clearance |

Each asset records subject/kind, original source and exact file page, creator, final attribution, license identifier/URL/restrictions, MIME/dimensions, source revision, inspection date, file SHA-256, modifications, context-specific rights notes, independent UK/EN alt text/captions, delivery location and human review metadata. Circuit diagrams additionally record a layout ID and exact supported race IDs with their source revision.

Candidate, rejected and withdrawn records cannot be selected for display. Verified publication requires complete metadata, one permitted delivery location and a named human review. An SHA-256 fingerprint binds review to the bytes checksum, identity, rights, text, delivery and historical mapping. Editing those fields invalidates review. This fingerprint detects stale review; it is **not an authenticated signature** and cannot prove that someone performed a review. Repository review and protected-branch controls must enforce that human boundary. Tests use synthetic reviewer names only.

Validation takes an explicit `--as-of` date for deterministic offline checks. Inspection/review dates cannot be in the future or reverse their chronology. Runtime selection defaults to the current UTC date. The isolated fixture supplies an explicit date so its synthetic cases are reproducible.

### Human publication process

1. **Discover:** record a bounded candidate with exact source/file revisions. Unknown information stays `null`; missing or contradictory evidence stays explicit.
2. **Inspect:** a human opens the original source, file history and license terms. Confirm subject identity, photographer versus uploader, derivative/crop chain, provenance, territorial/context limitations and any notices. Record why the proposed use is permitted; absence of a metadata restriction is not clearance.
3. **Prepare:** after the rights decision, retrieve one chosen file manually. Record exact bytes SHA-256, actual dimensions/MIME, any conversion/cropping and both locale texts. Preserve required title/creator/source/license notices and modification history. Do not import candidate records into the frontend.
4. **Review:** an independent human records their real name/handle, date and rationale against the complete payload fingerprint. Use `mediaFingerprint` after all fields are final. An agent must not invent this decision.
5. **Publish by reviewed PR:** place approved bytes under `apps/web/public/media/`, and the reviewed record in `publication.json`. Run preflight and browser checks. Remote delivery is disabled by default; permitting an origin requires a separately reviewed policy/configuration change.
6. **Withdraw:** set status to `withdrawn`, remove public bytes, rebuild/redeploy and invalidate any deployment/CDN caches. Preflight rejects unregistered, rejected or withdrawn files left in `/media`. A static registry cannot recall already downloaded files or instantly revoke a running deployment. Do not reuse a withdrawn ID for different bytes.

Raster files are limited to 20 MiB and checked for matching MIME headers/checksum. SVGs must pass the narrow static profile (root `svg`, self-closing `path`, allowlisted attributes; no scripts, events, external references or entities). This is not a general sanitizer or full image decoder. Unsupported source SVGs require deliberate conversion/review, with modifications documented. Files are served as image resources, never inserted as inline markup. The preview's synthetic SVG is outside production `public/`.

## Commons discovery and pilot inventory

The [Commons reuse guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) requires checking each file's license and attribution; an uploader is not necessarily its creator. Copyright licenses do not resolve all personality, privacy, trademark or other rights. [Imageinfo](https://www.mediawiki.org/wiki/API:Imageinfo) exposes useful file metadata, not an editorial approval.

Reproduce this small metadata-only request from the repository root:

```sh
python3 scripts/discover-commons-media.py \
  --title 'File:Ayrton Senna 1989 Belgian GP podium (cropped).jpg' \
  --title 'File:J.M. Fangio 1957.jpg' \
  --title 'File:Lewis Hamilton (27333186713).jpg' \
  --inspected-on 2026-10-20
```

The script accepts 1–4 distinct exact file titles, sends one request with a descriptive User-Agent, `maxlag=5`, a 20-second timeout and a 1 MB response bound. It neither follows categories nor downloads binaries. HTML metadata becomes plain text plus HTTPS evidence links; delivery URLs are omitted. There are no automatic retries. Respect server errors/Retry-After and retry manually later. This fetches current observations; compare recorded page revisions and file SHA-1 values to detect upstream changes rather than assuming immutable live metadata.

| Candidate | Observed evidence | Remaining review |
| --- | --- | --- |
| [Senna, cropped 1989 podium](https://commons.wikimedia.org/wiki/File:Ayrton_Senna_1989_Belgian_GP_podium_(cropped).jpg) | Page revision 1070636551; madagascarica; CC BY 2.0; 744×1079 | Reopen original Flickr source and crop history; confirm identity/credit chain, use context and both captions |
| [Fangio, 1957 crop](https://commons.wikimedia.org/wiki/File:J.M._Fangio_1957.jpg) | Page revision 958088047; crop metadata names Spin2Win and CC BY-SA 3.0; 190×352 | Creator/license chain unresolved: [parent file](https://commons.wikimedia.org/wiki/File:1957ArgentineGP04.jpg) credits Carlos Alberto Navarro with a public-domain dedication. Do not equate crop uploader and photographer or collapse these notices |
| [Hamilton portrait](https://commons.wikimedia.org/wiki/File:Lewis_Hamilton_(27333186713).jpg) | Page revision 996794117; 35mmMan; CC BY 2.0; 2060×2060 | Reopen original Flickr source, confirm identity/credit chain and contextual rights, review both captions |
| F1DB Monaco `monaco-4` | Pinned 500×500 SVG; exact race `394` (1984) mapping | Resolve license-link discrepancy, approve credit/rights and both captions before hosting |
| F1DB Monaco `monaco-6` | Pinned 500×500 SVG; exact race `941` (2016) mapping | Same rights gate; never substitute for race `394` |

The Senna/Hamilton Flickr sources have not been independently cleared. No final attribution has been invented. The inspected [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) terms require appropriate credit/notices and modification disclosure; ShareAlike can apply to adaptations under BY-SA. Review the actual applicable terms and file history before making a reuse decision.

## F1DB assets and historical provenance

Pinned source: `v2026.17.0`, annotated tag `88af43e6f328ba1843bc23550dac693813f03b1a`, immutable commit `3c980fd510ef97ea0de577aff7ecee193869de65`. The existing `f1db-json-splitted.zip` SHA-256 is `0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`.

- The ZIP contains 160 layout records but **no SVGs**. Pinned [README](https://github.com/f1db/f1db/blob/3c980fd510ef97ea0de577aff7ecee193869de65/README.md) says circuit SVGs are excluded from release artifacts and credits **Jules Roy** for them.
- SVGs are in `src/assets/circuits/{black,black-outline,white,white-outline}/{layoutId}.svg` in the git tree. The inspected [Monaco 4](https://github.com/f1db/f1db/blob/3c980fd510ef97ea0de577aff7ecee193869de65/src/assets/circuits/white/monaco-4.svg) and [Monaco 6](https://github.com/f1db/f1db/blob/3c980fd510ef97ea0de577aff7ecee193869de65/src/assets/circuits/white/monaco-6.svg) files have 500×500 roots and no embedded creator/license notices.
- Pinned [LICENSE](https://github.com/f1db/f1db/blob/3c980fd510ef97ea0de577aff7ecee193869de65/LICENSE) contains Attribution 4.0 International. README's licensing prose also says CC BY 4.0, but its unused `CC BY Plaintext` reference points to a BY-SA URL. This discrepancy is preserved as a human review blocker; neither file is approved by this PR.
- `race.circuitId` and `race.circuitLayoutId` associate race `394` with `monaco-4` and `941` with `monaco-6`. The component requires an exact supported race. A current/effective layout flag or broad circuit name is insufficient historical evidence. The snapshot intentionally does not claim all years or races.

Verify the seven identity records and two exact mappings using an existing local copy of the pinned release (the script performs no network or database writes):

```sh
python3 scripts/verify-media-identities.py \
  --archive /path/to/f1db-json-splitted.zip \
  --checksums /path/to/checksums_sha256.txt
```

## Frontend use and preview

Parse publication records on the server with a trusted canonical subject set and layout mappings before passing them to components:

```tsx
const registry = parseMediaRegistry(manifest, identities.subjects,
  '2026-10-20', 'publication', [], identities.layouts);

<LicensedMedia assets={registry.assets} assetId="reviewed-portrait-id"
  subject={{ type: 'driver', id: 'ayrton-senna' }} label="Ayrton Senna" locale="uk" />
<CircuitDiagram assets={registry.assets} assetId="reviewed-layout-id"
  circuitId="monaco" raceId="394" label="Monaco · 1984" locale="en" />
```

`LicensedMedia` supplies alt text, visible credit/caption, source/file/license links, keyboard-accessible reuse details, reserved aspect ratio and lazy loading. `CircuitDiagram` adds the exact-race gate. Missing, rejected, withdrawn or incompatible records render an abstract labeled fallback. A failed image load renders a truthful unavailable state without changing the reserved frame. `object-fit: contain` avoids silently cropping source material; `unoptimized` avoids implicit image transformations. Styling is scoped, responsive and motion-free, with visible keyboard focus and forced-colors support. A fallback is not a fabricated photograph or circuit outline.

Run the isolated demonstration (Node 24+, installed workspace dependencies):

```sh
node apps/web/src/components/media/preview/server.cjs
# Open http://127.0.0.1:3358/uk or /en
```

The default shows real subject labels and safe fallbacks only. `?test=verified`, `missing`, `withdrawn` or `wrong-race` exercises synthetic states, clearly labeled as test data. No synthetic approval enters `publication.json`. The preview binds to loopback, is marked noindex and is not a production app route.

Screenshots: [English desktop](previews/media-en-desktop.png) · [Ukrainian mobile](previews/media-uk-mobile.png).

## Checks and remaining work

```sh
pnpm lint
pnpm typecheck
pnpm test
python3 -m unittest discover -s tests -v
node scripts/validate-media-registry.mjs --as-of 2026-10-20
pnpm build
pnpm exec playwright test --config apps/web/src/components/media/preview/playwright.config.ts
git diff --check
```

The Node suite includes missing rights/source/creator, duplicate IDs, unknown/type-confused subjects, stale reviews, rejected/withdrawn records, unsafe delivery, SVG/file checks and exact historical mapping. Python checks cover metadata discovery and the pinned identity verifier. The hydrated browser suite covers UK/EN desktop/mobile, attribution/keyboard behavior, 320px/200% text, no remote image requests, missing bytes without frame shift, withdrawn media and wrong-race fallbacks. Existing Foundation, Web and real-archive CI pick up these checks; no branch protections or existing tests are weakened.

Remaining gates:

1. Independent human rights/identity review for each candidate, including the Fangio chain and F1DB discrepancy; final attribution and locale text.
2. Select/download only an individually approved asset, validate actual decoded dimensions/visual identity and any required conversion, then review its final fingerprint. MIME sniffing alone does not validate image integrity.
3. Coordinate a single public subject-page integration with the UI owner after #134. No public photo is introduced by this phase.
4. Decide deployment/CDN withdrawal procedures and an approved remote-host policy only if required. There is no image proxy, on-demand processor, Commons synchronization or instant revocation service.
5. Revisit a database bridge only when an actual publishing need justifies it; preserve one explicit human approval boundary.

No deployment, merge, historical data change or legal clearance is asserted here. PR checks/results record which local and CI checks actually ran.
