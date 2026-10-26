# V3 final integration — audited 26 October 2026

Baseline: PR A #297 `d0a5240`; PR B #310 `87a05b4`. Both are open. B's latest foundation, archive, web and visual CI all passed at `87a05b4`. The prior failure run had 16 failures: ambiguous nested identity summary selectors (12) and animation assertions (4). Current-head local reproduction of the same encyclopedia/editorial suites: **56 passed**. No checks were disabled. A currently has green archive/foundation/visual checks, a canceled web run (browser installation interrupted) and a failed Commons research-original download check (HTTP 429). Both blocked jobs were retried without changing the gates.

PR #309 is a separate draft: story index/reading routes, manuscripts, media-intake tooling and additions to release.module.css. No source-review approval exists. Those files are outside this implementation. Existing B styles must be retained when its owner rebases the story additions. No merge or publication of #309 is authorized by this audit.

## Reproduced problems and acceptance

| Severity | Reproduction / observed problem | Delivery acceptance |
| --- | --- | --- |
| P2 | `/uk/atlas?kind=driver&id=3`, 390px: generic hero and repeated identity headings push the map below the first screen. Database ID 3 is Adolfo Schwelm Cruz: one race/season in 1953. | Focus, available seasons, season/career counts and all-connections path are explicit; sparse data stays sparse. |
| P2 | Senna 1987/1988 suggestions say only 'different teams or drivers'; neighboring comparisons require manual year entry. ID 72 resolves to Ayrton Senna; 2025/2026 is outside recorded 1984–1994. | Quick adjacent recorded comparisons, actual team names, exact evidence links and preserved explicit URLs. |
| P2 | Generated single-race profile says '1 distinct races', '1 гонок … за 1953 роки'; UK calls the archive 'verified' where EN means pinned. | Natural singular/range grammar, no implied independent source approval, regression cases from actual archive identities. |
| P2 | Silverstone technical section repeats 12 large event cards plus a full layout-comparison table; entire page measures 20,430px at 1440px UK. | Primary track/year experience remains visible; compact event data and native comparisons retain every measurement, race and provenance record. |
| P2 | Driver/constructor pages repeat milestone/statistics sections before the primary interactive career view; measured heights 13,841px / 19,933px. | Strong introduction and interaction first, duplicate views consolidated through native disclosure without deleting facts. |
| P2 | Unnatural residual UI phrases remain in showcase, participation and Explorer components, beyond translation JSON. | Shared glossary, expanded inflection-aware phrase regression and independent bilingual copy review. |
| P2 | Lineage has zero reviewed claims and an alphabetic catalogue dominating initial discovery. | Honest review state, useful starting-point search links, recorded history kept separate from legal lineage. |

Contracts: canonical database IDs distinct from F1DB IDs; observed results only; no inferred contracts, legal succession, starts, titles or missing participation. No migration/API change. Sources and rights remain gated. No generated photography. Respect reduced motion, keyboard, source attribution and 200% text. Keep all unrelated root-worktree changes untouched.

## Baseline evidence

48 current-head native captures cover EN/UK at 1440 and 390 across home, dossiers, circuits, season/race, Explorer tools, Stories and Lineage; 0 page errors and 0 document overflows. Before-audit.json includes rendered text, loaded font faces, headings and page heights. Extra circuit interaction views expose the repeated cards. The current in-app browser connection remains unavailable; capture and interaction checks use repository Playwright against the production build.

Pinned F1DB v2026.17.0 ZIP was restored from the official release and checked against the published checksum: `0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`. Dedicated disposable database port 55464; API 3480; isolated baseline web 3491. Zero public photographic assets; #290 remains independent human review, not a UI approval.

## Implemented experience

- Atlas uses the selected canonical name as its heading and exposes exact season/career relationship counts. Cooper in 1960 has 34 recorded driver relationships; the loaded 25-row list and 8/2 graph limits remain explicit, with the complete paginated evidence path. Adolfo has one relationship in one recorded season; no extra relationships were invented.
- Time Machine preserves explicit outside-career URLs, names the real teams in suggested comparisons and steps through adjacent recorded season pairs. Senna 1987/1988 shows Lotus leaving and McLaren appearing, with the existing race evidence links. Gaps stay gaps.
- Lineage starts constructor searches for Ferrari, McLaren and Lotus against canonical catalogue identities. Its independently reviewed claim set is still empty and remains separate from recorded race participation.
- Circuit event cards become one expandable, scrollable table. Selecting a year opens its exact event facts. Layout comparisons, all race links, hashes, source locators and full-record expansion remain available. Constructor season/driver archives and career classifications use the same native disclosure primitive; driver interaction moves directly after the introduction.

At UK 1440px, the default McLaren page falls from 19,933px to 9,347px (53%); Silverstone from 20,430px to 13,246px (35%); Senna from 13,841px to 12,816px (7%). These are default document heights, not claims that the underlying records were shortened. Atlas gets extra factual scope; its total height grows modestly while focus becomes explicit.

## Editorial glossary and data boundaries

Shared implementation: `apps/web/src/content/glossary.ts`; prose grammar: `editorial-language.ts`. Statistical names follow the SQL, never search-and-replace alone.

| Meaning | EN | UK | Computation / qualification |
| --- | --- | --- | --- |
| Distinct winning races | Wins | Перемоги | Distinct race IDs with first-place results |
| First-place result rows | First-place results | Результати на першому місці | Row count; shared cars can differ from race count |
| Top-three result rows | Top-three results | Результати в першій трійці | Row count, not silently renamed to distinct podium races |
| Result-based constructor history | Teams by season | Команди за сезонами | Observed results; no inferred contract dates or legal succession |
| Event geometry | Circuit data by Grand Prix | Дані траси для Гран-прі | Exact layout/event/year; no inferred speed, sectors or difficulty |
| Recorded career period | in 1953 / from 1984 to 1994 | у 1953 році / у 1984–1994 роках | Preserve missing years and distinguish single years |

The phrase regression scans route/component strings and translation files with Unicode normalization and case folding. Grammar tests cover Ukrainian 1/2/5/11/21/0 and genuine single-race profile shapes. Rendered EN/UK text is retained in the audit JSON. AI bilingual review was performed; no independent human Ukrainian editor approval is claimed.

## Typography and screenshots

The loaded local Atlas Serif (Cormorant) and Atlas Sans (Manrope) variable faces cover weights 400–700 and both Cyrillic/Latin ranges, including Ґ/ґ, Є/є, І/і, Ї/ї. Native captures and enlarged-text browser checks showed no reason to replace the licensed fonts. Existing licenses, font loading, reduced-motion behavior and SEO contracts are retained.

`before-audit.json` and `after-audit.json` retain canonical identities, rendered text, loaded fonts, headings, heights and errors. Matching screenshots cover 12 routes × two languages × desktop/mobile, plus circuit interaction views. The final script also captures 200% text at 1024px and 390px for Atlas, comparisons, McLaren and Silverstone.

| View | Before | After |
| --- | --- | --- |
| Sparse Atlas, UK mobile | [Before](screenshots/before-atlas-sparse-uk-390.jpg) | [After](screenshots/after-atlas-sparse-uk-390.jpg) |
| Outside-career selection, UK | [Before](screenshots/before-outside-career-uk-1440.jpg) | [After](screenshots/after-outside-career-uk-1440.jpg) |
| Circuit interaction, UK | [Before](screenshots/before-circuit-interaction-uk-1440.jpg) | [After](screenshots/after-circuit-interaction-uk-1440.jpg) |
| Constructor, EN | [Before](screenshots/before-constructor-en-1440.jpg) | [After](screenshots/after-constructor-en-1440.jpg) |

## Integration boundaries

Read-only three-way compatibility inspection of #309 at `4c2857b` against the product stack found changes in the shared `release.module.css`, with no conflict markers in the automatic textual merge. The final integration changes do not touch #309-owned files. Its owner should rebase after A then B land, preserving B's tokens and reduced-motion overrides and rerunning story route/SEO checks. Source/editorial approval remains a separate blocker. No draft article or photographic asset was published.

Independent review assessed the original final diff, factual labels, exact counts, adjacent pairs, native disclosure semantics and regression value: no blocking findings. Minor untranslated circuit table heading was corrected. Review is neither deterministic browser evidence nor independent editorial/media approval.

## Executed local verification

Node 24.21.0, repository pnpm toolchain; disposable PostgreSQL on port 55464. Full run conclusions and exact latest CI/commit handoff are maintained in [PR #310](https://github.com/vlovers/grid-atlas/pull/310), so queued checks are not represented as passing here.

| Command | Actual result |
| --- | --- |
| `pnpm check` | Passed |
| `pnpm lint` / `pnpm typecheck` | Passed |
| `pnpm test` | 247 passed |
| `python3 -m unittest discover -s tests -v` | 418 passed |
| `pnpm build` | Passed; final circuit CSS also rebuilt successfully |
| `pnpm test:integration` | 42 passed, 1 existing optional publication test skipped; owned disposable schemas |
| `DATABASE_URL=… pnpm test:browser` | 508 passed, including desktop/mobile Chromium and WebKit reliability |
| `PREVIEW_URL=http://127.0.0.1:3491 V3_API=http://127.0.0.1:3480 pnpm exec playwright test --config playwright.product-editorial-v3.config.ts` | Chromium/WebKit/mobile subject, font, chart and 200% checks; latest result in PR handoff |
| `python3 scripts/verify-real-archive.py` | SQL/API parity passed, including shared-car results and both comparison directions |
| `python3 scripts/audit-encyclopedia.py --archive … --checksums … --api-url … --web-url …` | Passed: 11,504 API requests, 2,406 web pages, all 27,665 result entries and 1,172 races compared |
| `pnpm audit:media --as-of=2026-10-26` | Passed; zero public photographs, 160 attributed circuit illustrations |
| `pnpm check:docs` / `git diff --check` | Passed |

The final 200% visual pass found narrow two-column circuit labels despite no document overflow. A font-relative container query now stacks these facts when text needs more width; four enlarged-text circuit captures were refreshed. All eight Ukrainian supplementary captures loaded the Cyrillic display face; English correctly loads only its needed subset. There are 120 before/after images and 16 final enlarged-text checks with no document overflow.

Early verification attempts were not counted as final acceptance: legacy card/disclosure selectors needed updates; concurrent suites shared a trace directory; a late preview rebuild invalidated four final archive checks. Suites now own sibling artifact directories, and final archive acceptance uses a stable build. No assertions or historical gates were disabled.
