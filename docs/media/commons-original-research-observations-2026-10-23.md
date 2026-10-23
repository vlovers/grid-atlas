# Commons original SHA-256 research observations — 23 October 2026

**Research only. No photograph is approved or published.** These values come from an ephemeral GitHub Actions run, not from F1DB row hashes, Commons metadata SHA-1 or a human rights review.

## Original bytes verified in the runner

During [Commons research workflow run #39994989972](https://github.com/vlovers/grid-atlas/actions/runs/39994989972), the research-only downloader retrieved two pinned originals, checked exact source SHA-1 and byte counts, inspected JPEG structure and dimensions, and calculated SHA-256 of the downloaded bytes. The run **failed overall** because the remaining three downloads did not succeed. The partial batch report is preserved in the short-lived [research artifact #12518579029](https://github.com/vlovers/grid-atlas/actions/runs/39994989972/artifacts/12518579029).

| Research ID | Pinned Commons SHA-1 | Downloaded original SHA-256 | Bytes | Observed Commons original timestamp |
| --- | --- | --- | ---: | --- |
| `research-schumacher-portrait-2007` | `2e2f13a317874fe4aaee0b0190a4fd8432afa2ec` | `6b0431b9d58148d4c15d6e1342aa206ec050a84967a203fdc4d5a0ee612aad5a` | 215440 | 2008-04-24T19:13:09Z |
| `research-alonso-2024` | `c7ddbbd82e80328c91631e43fcc9f0bc316e7895` | `f08b0868a18207ca769328a8799c1e67c12227abf59d6e14b27aaf3691dc89a8` | 4329507 | 2024-07-08T20:25:49Z |

**Not verified:** `research-mclaren-mp44-2007`, `research-ferrari-f2004-2004`, `research-silverstone-2019`. Do not infer or copy any SHA-256 for these. The later [diagnostic run #39995111256](https://github.com/vlovers/grid-atlas/actions/runs/39995111256) returned HTTP **429** from the Commons API for all five candidates, confirming upstream throttling. Avoid automated repeated requests.

## Source URL compatibility and safety

The official Commons imageinfo API returned original URLs with `utm_source`, `utm_campaign` and `utm_content` tracking query parameters. The downloader now strips **only** these observed tracking keys before fetching the image. Unknown parameters, duplicate keys, fragments, non-HTTPS schemes, non-Commons upload hosts and redirects remain forbidden. Regression tests cover the accepted tracking-only URL and rejected variants.

## Remaining gates

- Wait for Wikimedia Commons throttling to clear before manually running the opt-in SHA-256 research workflow again. Only a complete five-image run produces the strict `commons-research-sha256.json` receipt.
- Independently inspect creator/derivative history, rights, depicted identity, date/context and the intended use of each image. Record actual reviewer evidence and both English/Ukrainian captions only after verification.
- Keep all original binaries outside the repository and publication registry. The two verified SHA-256 observations do **not** grant publication permission.

Source metadata: [pinned Commons original evidence](commons-original-evidence.json); [research-only staging](cross-era-staging.json); [ingestion workflow](commons-batch-ingestion.md).
