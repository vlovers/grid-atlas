# First biography batch — editorial execution plan

Status: planning only. This document does not mark any claim as verified or any article as published.

## Scope

Follow the existing `docs/editorial-verification.md` pilot cohort rather than silently changing editorial priorities:

1. Ayrton Senna
2. Michael Schumacher
3. Lewis Hamilton
4. Max Verstappen
5. Alain Prost

Do not bulk-generate public biographies. Ship one reviewed biography end-to-end before expanding the cohort.

## Per-driver checklist

- [ ] Resolve canonical F1DB driver identity; record the pinned data release.
- [ ] Draft an original English outline: lead, early career, F1 chronology, teams, milestones, historical context.
- [ ] Split historical assertions into independently reviewable claims. Distinguish wins, starts, entries, titles, points and era-dependent scoring.
- [ ] Attach canonical source URLs and precise passage/table locators; record access date and source provenance.
- [ ] Independently corroborate consequential or contested assertions; do not count syndications as independent.
- [ ] Have a named human reviewer open each cited passage, verify wording and sign off on the claim.
- [ ] Check article-to-claim links and ensure evidence mutations invalidate prior approvals.
- [ ] Translate to Ukrainian from the reviewed claim set; review the Ukrainian version independently.
- [ ] Check internal links, accessibility, SEO metadata and publication fallback behavior.
- [ ] Check each candidate image's individual license, author and attribution before reuse; otherwise publish without an image.
- [ ] Confirm public article API returns only approved prose and the bibliography, without draft/reviewer fields.
- [ ] Verify published page in both locales and a missing-article stats-only fallback.
- [ ] Document correction/retraction workflow before publishing.

## Acceptance gates

- No AI-generated draft is automatically approved.
- No narrative fact is publicly published without evidence and human review.
- A changed source, claim or article invalidates affected approvals.
- Bibliography links point to sources actually supporting the associated claims.
- A profile with no approved article remains available with statistics only.
- CI and PostgreSQL HTTP integration tests pass before merging publication changes.

## Delivery sequence

1. Finish bibliography PR #76, including PostgreSQL HTTP coverage.
2. Prepare the Senna evidence register and outline in a separate PR; leave all new claims as `needs_review`.
3. Conduct source-by-source human review, then publish the English article.
4. Review and publish Ukrainian translation.
5. Repeat for Schumacher, Hamilton, Verstappen and Prost.

Do not interpret a checklist as evidence that the content or media has already been verified.
