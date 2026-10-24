# Release checklist — grid-atlas

This is a process gate, not release authorization.

- [ ] Confirm current release baseline, exact candidate SHA, live open PR/issues and critical defects.
- [ ] Record what is implemented versus verified, accepted and shipped; ensure docs match release scope.
- [ ] Run applicable clean install, static checks, unit/integration/E2E and build against exact candidate revision.
- [ ] Verify security, sensitive settings, third-party rights and dependency changes; collect independent review evidence.
- [ ] Actual imported archive, UK/EN, keyboard/mobile, source claims, graph/Time Machine limitations, image licensing and attribution, historical layout identity, no fake sector/DRS metrics, migration compatibility.
- [ ] Release requires editorial/media independent approval where applicable, real-origin smoke, hosting/TLS/secrets/backups/restore/observability and issue #104 gates; CI green alone is not beta approval.
- [ ] Confirm environment-specific smoke checks and documented mitigation/rollback, with secrets excluded from logs.
- [ ] Obtain maintainer authorization before merge/deploy/package publishing.
- [ ] After release, verify real deployed origin or installed published artifact independently and record link/commit.

Never mark this checklist passed for commands not executed or evidence from a different SHA.
