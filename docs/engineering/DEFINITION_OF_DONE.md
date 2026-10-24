# Definition of Done — grid-atlas

Four distinct states: **Implemented** (the agreed change exists), **Verified** (relevant automated and real-scenario checks are evidenced), **Accepted** (independent blocking findings addressed and requirements signed off), and **Released** (deployment/publication separately verified). Do not collapse them into a generic “done”.

## Criteria
- Outcome and explicit acceptance criteria documented; no unrelated modifications or silently reduced scope.
- Preserve architecture and compatibility contracts; report migration, API, security, localization and operational impacts.
- Applicable lint/typecheck/build/unit/integration/E2E executed with exact outcome; use N/A only with a reason, not as a substitute for a failed check.
- Actual imported archive, UK/EN, keyboard/mobile, source claims, graph/Time Machine limitations, image licensing and attribution, historical layout identity, no fake sector/DRS metrics, migration compatibility.
- Independent reviewer checks the base-to-head diff against requirements, not just the author's summary; blocking findings fixed and retested.
- Docs, examples, UI states and release limitations match actual behavior.
- Release requires editorial/media independent approval where applicable, real-origin smoke, hosting/TLS/secrets/backups/restore/observability and issue #104 gates; CI green alone is not beta approval.

See [review policy](REVIEW_POLICY.md) and [release checklist](RELEASE_CHECKLIST.md). Runtime tests are not mandatory for docs-only changes when genuinely irrelevant, but links and command references still require inspection.
