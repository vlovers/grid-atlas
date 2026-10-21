# 2025 constructor technical & leadership research — unpublished

This package collects **15 source-located research observations** for eight constructor name scopes. Its goal is season-specific, verifiable editorial material, not an automatically published catalogue. Sources are timestamped Formula 1 articles; no current team page has been retrospectively interpreted as a 2025 snapshot.

## Coverage

| Subject | Research leads |
| --- | --- |
| Ferrari | SF-25 chassis, Fred Vasseur at the 2025 presentation, Hamilton/Leclerc line-up, front and rear suspension described in F1 technical reporting |
| McLaren | MCL39 chassis, Andrea Stella, the 2021-onward Mercedes power unit agreement |
| Mercedes | W16, technical director James Allison, Toto Wolff, Russell/Antonelli driver pairing |
| Williams | James Vowles in the F1 January 2025 preview |
| Aston Martin | Andy Cowell in the F1 January 2025 preview |
| Alpine | Oliver Oakes in the F1 January 2025 preview |
| Racing Bulls | Laurent Mekies in the F1 January 2025 preview |

All specific claims, article URLs, article dates and exact locators are in `constructors-2025-source-observations.json`. These are research claims, not proven season-long team-staff tenures. Personnel roles can change mid-season, so `team_principal` from a January article should never be displayed as a universal 2025 fact. The model records season and article publication date, but still needs narrower effective-date metadata before release.

## Verification

```sh
python3 scripts/audit_constructor_2025.py
python3 -m unittest tests/test_constructor_2025_audit.py
```

These checks are included in Foundation CI via Python test discovery. They validate source identity, format, exact provenance pointers, disallow phantom F1DB IDs and block unapproved publication. **They do not independently verify article text, ownership of technical imagery, or official constructor identity.**

## Required next steps

1. Verify each article and its precise locator during human review. Compare chassis and leadership information against primary team/FIA records, noting any disagreements and effective dates.
2. Resolve pinned F1DB v2026.17.0 constructor IDs from the imported database; distinguish constructor, entrant, sponsor names and legal lineage. Never guess IDs from slugs.
3. For approved facts, use the historical-facts registry allowlist. `technical_note`, `driver_lineup`, `power_unit`, and `technical_chief` are **research fields**, not automatically allowed public technical facts. Require a separate documented contract decision before import.
4. Link the approved claims to UK/EN constructor profiles only after explicit review, publication authorization and conflict reconciliation. Do not present screenshots, liveries or source-site photographs without separate reuse rights.
5. Preserve the temporal distinction between pre-season expectations, actual equipment used, and later retrospectives.

Nothing in this package mutates PostgreSQL, creates a public endpoint, changes the History Atlas, or releases media.
