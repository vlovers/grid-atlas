# Documentation guide

This directory contains **current operating documentation**, **historical implementation evidence**, and **unpublished editorial research**. These are different kinds of material; an old report is not a current product specification.

## Start here

| Need | Canonical entry point |
| --- | --- |
| Install, run and test | [Root README](../README.md) |
| Current system boundaries | [Architecture](architecture/overview.md) and [migrations](architecture/migrations.md) |
| Product status and known release gates | [Product status](product/stable-experience-roadmap.md) and [beta audit](beta-audit.md) |
| Historical data and provenance | [Data-source register](data-sources/README.md) |
| Editorial approval and publication | [Editorial release pipeline](editorial/APPROVED_RELEASE_PIPELINE.md) and [verification policy](editorial-verification.md) |
| Unpublished championship story research | [Season arcs: seven bilingual title-decider manuscripts](editorial/season-arcs/README.md) — research only, not approved public articles |
| Unified catalogue and archive templates | [Unified archive implementation](design/unified-archive/README.md) and [media context/provenance](media/library-v1-foundation.md) |
| Current sprint status and visual evidence | [23 October audit](sprint-audit-2026-10-23.md) and [Visual Storytelling V2](design/visual-storytelling-v2/README.md) |
| Media licensing and SVG attribution | [Approved imagery workflow](media/approved-imagery-workflow.md), [media registry](media/README.md) and [historical SVG provenance](media/historical-circuit-svg-provenance.md) |
| Deployment and operational safety | [Operations](operations/phase-1.md) |
| Circuit implementation | [Circuit V2 data contract](product/circuit-experience-v2.md), [source-backed circuit covers](media/circuit-cover-artwork.md); later V3/V4 behavior is in the application and its browser tests |
| Test evidence | [Real-archive acceptance](real-archive-acceptance-2026-10.md), [verification](verification/encyclopedia/coverage.json) |

## How to interpret these files

- **Current contracts:** architecture, data-source policies, editorial approval rules, API contracts, and operational runbooks. Update them when implementation changes.
- **Snapshots:** dated audits, screenshots, design comparisons, experiment reports, and PR-specific verification. Preserve their date and commit scope; **do not** treat them as proof of current CI or deployment.
- **Unpublished evidence:** `editorial/batches/`, `editorial/research*/`, `editorial/dossiers/`, `data-sources/manifests/` and `media/candidates.json`. These contain drafts, proposals, review states and provenance, **not** automatically approved public facts or licensed imagery.
- **Roadmaps:** proposals are not implemented features. Check merged code and current PRs before marking work complete.

## Repository hygiene rules

1. Put durable implementation contracts in `architecture/`, `product/`, `api/`, or `operations/`; link them from this index.
2. Keep dated investigations and screenshots as immutable evidence with a date, source commit, and verification limits. New snapshots must not overwrite older evidence.
3. Do not delete or silently rewrite historical source records, editorial review decisions, attribution, or license evidence during cleanup.
4. When moving Markdown, update relative links and run the docs link audit. Keep root README short and route readers here.
5. An old issue, a passing CI run, and a published release are different statuses. Verify each independently.

See [open issue triage](issue-triage-2026-10.md) for the 12 issue acceptance decisions and [repository hygiene audit](repository-hygiene-2026-10.md) for identified cleanup work and deliberately retained historical material.
