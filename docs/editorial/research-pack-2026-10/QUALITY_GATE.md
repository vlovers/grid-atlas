# Editorial cohort quality gate: five drivers

This is a **private, research-only** audit for the five-driver pack at `docs/editorial/research-pack-2026-10/`. It does not publish pages, approve media, validate the correctness of quoted official records, or replace the existing claim-review workflow.

## Execute

```sh
python3 scripts/validate-editorial-research-pack.py
python3 scripts/validate-editorial-source-observations.py
python3 scripts/validate-driver-season-evidence.py
python3 scripts/audit-editorial-research-pack.py --output /tmp/grid-atlas-editorial-audit.json
python3 -m unittest discover -s tests -p 'test_editorial*pack.py' -v
python3 -m unittest discover -s tests -p 'test_editorial*observations.py' -v
python3 -m unittest discover -s tests -p 'test_editorial_season_evidence.py' -v
python3 -m unittest discover -s tests -p 'test_editorial_cohort_audit.py' -v
```

The aggregated report contains a list of failures, a **nonpublishable** status, source reference counts and limitations. It intentionally does not label source availability as source quality, nor the number of sources as the number of independent publishers.

## Coverage expectations

- Five research briefs with UK/EN headings.
- One Senna/Prost bundle and three independently bounded season evidence bundles.
- Ten source-located claim observations in total, each still `needs_human_review`.
- Thirty-two research scenes, none representing approved prose.
- No approved photos, invented human reviewers, implicit live data, legal team succession or official starts.
- Stable source IDs within bundles and unique claim IDs across bundles.

## Important fixed regression

Originally `validate-editorial-research-pack.py` scanned every `*.json` in the folder; adding evidence bundles made the valid cohort fail. It now checks the five explicit driver briefs only. The cohort audit checks *all* expected evidence bundles separately. This regression demonstrates why passing generic unit tests alone was insufficient.

## Integration boundary

No Next.js runtime path imports these JSON files. Existing publication review, localized verification and media rights requirements remain unchanged. Independent human assessment of official claims and a **real pinned F1DB v2026.17.0 parity run** are outstanding; marking either completed here would be incorrect.
