# Editorial Content V1 — verification

Base: main `46c5a9a24056555a6d0791c3286f6046105271d5`.
Branch: `feat/editorial-content-release-v1`. Node 24.21.0, pnpm 10.18.3,
PostgreSQL 17 (disposable local database), pinned F1DB v2026.17.0.
No deployment, merge, historical publication or media rights approval performed.

## Executed locally

| Check | Result |
| --- | --- |
| `pnpm check` | Passed |
| `pnpm lint` | Passed, zero warnings |
| `pnpm typecheck` | Passed, API + Next route generation/TypeScript |
| `pnpm build` | Passed, production API and Next.js |
| `pnpm test` | 81 passed |
| `python3 -m unittest discover -s tests -v` | 256 passed |
| `pnpm test:integration` | 32 passed, 1 opt-in publication acceptance skipped |
| `node --test apps/api/test/editorial-publisher.contract.test.cjs` | 14 passed |
| Opt-in publisher PostgreSQL acceptance | 1 passed separately in isolated schema; no historical article published |
| Five-driver release audit against checksum-pinned F1DB | 10 valid locales; 0 ready; all exact human approvals absent |
| `--require-ready` publication preflight | Expected rejection until human review is complete |
| Existing real SQL/API verification | Passed; 77 seasons, 917 drivers, 187 constructors, 830 entrants, 78 circuits, 1,172 races, 27,665 result rows |
| Existing media identity/layout verification | Passed: 7 canonical subjects, 2 exact mappings; no licensing approval |
| Real-archive Chromium desktop/mobile | 76 passed; final rerun includes language-switch assertion |
| Synthetic Chromium desktop/mobile | Final full regression in progress |
| WebKit desktop/mobile | Pending available local WebKit run |
| `git diff --check` | Passed |

The default integration suite deliberately skips the opt-in publisher test. It was
also executed explicitly, with migrations and a synthetic article in an owned schema.
The public archive schema still contained **zero `content_articles`** after testing.
Independent historical truth, author identity and copyright cannot be approved by CI.

Earlier failures were fixed: Node direct TypeScript import resolution; stale test
inspection dates (research was not backdated); source disclosure actions performed
before the streamed element was visible; an ambiguous Next route-announcer alert
selector; sitemap count updated for the real new root. No assertions were removed.

## Screenshots

Actual Chromium captures on the disposable genuine F1DB import. UK desktop at
1440×1000; EN mobile using Pixel 7. Reduced motion enabled. No remote images loaded.
The baseline profile was read from the unchanged local main-based Atlas preview;
the new story routes did not exist there. Screenshots are not edited compositions.

| View | Desktop | Mobile |
| --- | --- | --- |
| Existing profile (before) | [Before](screenshots/before-profile-desktop.jpg) | [Before](screenshots/before-profile-mobile.jpg) |
| New five-driver discovery | [Stories](screenshots/stories-desktop.jpg) | [Stories](screenshots/stories-mobile.jpg) |
| New Senna journey, 1988 | [Senna](screenshots/senna-desktop.jpg) | [Senna](screenshots/senna-mobile.jpg) |

## Reproduce

Follow the [preview instructions](README.md#local-public-preview), then:

```sh
pnpm check && pnpm lint && pnpm typecheck && pnpm build
pnpm test
python3 -m unittest discover -s tests -v
pnpm test:integration
node --test apps/api/test/editorial-publisher.contract.test.cjs
pnpm exec playwright test
# With WebKit installed:
pnpm exec playwright test --config playwright.cross-browser.config.ts --project=webkit-desktop --project=webkit-mobile
# With pinned import + SMOKE_* variables selected by the existing real-archive workflow:
pnpm exec playwright test --config playwright.real-archive.config.ts
```

Run the opt-in publication DB acceptance only in a fresh disposable database/schema:
`RUN_EDITORIAL_PUBLICATION_DB_ACCEPTANCE=1 node --test apps/api/test/editorial-publisher.integration.cjs`.
It writes an explicitly synthetic test article; never point it at production.

Private review: `node scripts/preview-editorial-release.mjs --acknowledge-unreviewed-draft --port 3429`.
Public `/uk/stories` and `/en/stories` do not expose that review transport or its files.

## Remaining limits

- Ten dossiers remain unsigned; incomplete historical periods and corroboration gaps
  are explicit. Five record journeys are public-capable, not five published biographies.
- Human review and approved operator provenance are operational controls, not a
  cryptographic signer identity or immutable database release ledger.
- Legacy article prose outside exact registered claims is now denied until reviewed
  and re-exported. This is an intentional fail-closed compatibility tightening.
- No licensed photographs or source-page images are copied. No new dependencies.
- The branch-protection API returned `404 Branch not protected`; no protection or
  operational settings were changed. This does not constitute deployment approval.
- GitHub CI status is recorded in the Draft PR after the pushed commit completes.
