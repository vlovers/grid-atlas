# 1988: editorial review handoff

This handoff collects **24 unapproved items** from the existing research files into one machine-readable queue:
- 7 Monaco/Italy/Japan source-specific historical observations.
- 13 race winner sequence captions covering all remaining rounds.
- 4 season-spanning Senna–Prost claims (including official standings).

The queue is intentionally **not a publication authorization**. No user-facing article, UI or media asset is created. It does not invent reviewer names, source verification or approvals.

## How to reproduce

```bash
python3 scripts/build-1988-editorial-review-queue.py --output /tmp/grid-atlas-1988-review-queue.json
python3 -m unittest discover -s tests -p 'test_editorial_1988_review_queue.py' -v
```

The real archive workflow generates the queue into ephemeral `/tmp` after importing pinned F1DB. Source URLs and locators are included per item where available, but **the validator has not checked the accuracy of their historical contents**.

## Human editorial acceptance checklist

For each item, an independent editor should:
1. Open the exact linked source and verify it really supports the narrow claim; record an access date and a stable locator (race ID, result row, or section).
2. Match archival race and driver identities with the pinned import; verify that qualifying, classification and official championship points are not conflated.
3. Proofread the original English and Ukrainian; check proper names and terminology, without copying copyrighted passages.
4. Check independent contextual sources before adding any incident description, emotional attribution or technical cause.
5. Register and clear the license and attribution of every proposed asset separately.
6. Approve a specific immutable article revision in the **existing** publication system for each locale. Do not mark research JSON as reviewed.

## Release decision

**Blocked** until all 24 items are independently reviewed (or removed) and the resulting public article passes the existing editorial gates. A green CI reports reproducible data shape and imported results only. No automated review can grant human approval.
