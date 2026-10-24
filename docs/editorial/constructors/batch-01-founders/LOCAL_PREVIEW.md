# Local constructor manuscript review (development only)

Research drafts **must never render in production**. This preview is a development-only reading surface, not a constructor publication contract or public website feature.

## Use

Run Next.js from the monorepo workspace with the explicit flag:

```sh
GRID_ATLAS_LOCAL_CONSTRUCTOR_PREVIEW=1 pnpm --filter @grid-atlas/web dev
```

Then open `/en/editorial/constructors/ferrari` or `/uk/editorial/constructors/team-lotus`. Other research subjects use their display names lowercased with spaces replaced by hyphens: `red-bull-racing`, `mclaren`, etc. In production or without the flag, the route returns a 404. It also returns 404 on unknown subjects, unsupported locales, unreadable draft source, wrong review status or a non-research manifest.

The page reads the private monorepo research files server-side; do not add public static JSON or client-side imports. Its heading prominently says *unpublished*, `generateMetadata` disables index/follow and it never renders an editor approval control or a publish action.

## Review limitations

This local-only view is **not** a way to override the editorial gate. The source blocks contain research claims with open verification questions. The preview renders plain text only and has no license-cleared photographs. The cross-locale revision, claim citations, approvals, content withdrawal and public API remain future separate work. Some display names are not identical to source constructor names (e.g. Team Lotus vs Lotus, Red Bull Racing vs Red Bull); never use the preview slug as a canonical F1DB ID.

## Next release stages

1. Independent claim/source and translator review; approve exact revisions via a constructor-specific contract.
2. Extend the database/API with immutable, revocable constructor article publication without weakening the existing driver release gate.
3. Show only verified and published API articles on public constructor pages; leave missing/withheld articles absent.
4. Browser-test EN/UK on 320px/mobile, text zoom 200%, keyboard and real pinned archive; independently review diff and ensure CI green before merging.
