# Jack Brabham — source passage verification notes (2026-10-24)

**Scope:** research-only source inspection for the existing `jack-brabham` dossier. This is **not** a signed human review, translation approval, independent verification of publisher independence, or authorization to publish. No publication sidecar is produced.

## Claim-level FIA source checks

| Existing claim ID | FIA page | Precise location and corroborated content | Assessment |
| --- | --- | --- | --- |
| `jack-brabham-titles` | [FIA obituary](https://www.fia.com/news/sir-jack-brabham-1926-2014) | Opening FIA paragraph explicitly gives the three Drivers' titles as **1959, 1960 and 1966**. The [FIA Hall of Fame champions index](https://halloffame.fia.com/) separately lists Sir Jack Brabham in those three year rows. | Both FIA locations agree with the claim's dates; editorial human review pending |
| `jack-brabham-cooper` | [FIA obituary](https://www.fia.com/news/sir-jack-brabham-1926-2014) | Paragraph beginning **“After striking up a successful partnership with Cooper”** describes his first championship in 1959. The next paragraph beginning **“More success followed in 1960”** explicitly identifies Cooper cars and the second title. | Supports the two Cooper championship seasons; editorial human review pending |
| `jack-brabham-own-car` | [FIA obituary](https://www.fia.com/news/sir-jack-brabham-1926-2014) | Opening paragraph describes the 1966 championship in a car he built and raced; the FIA President's tribute identifies a car built by his own team. Later paragraph beginning **“It wasn’t until 1966”** names the BT19 and third championship. | Supports the own-name-car distinction; editorial human review pending |

## Cross-check against championship tables

The [FIA 2024 Australian GP press kit](https://api.fia.com/sites/default/files/ausgp_2024_press_kit.pdf), *Drivers World Championship* table, lists **J Brabham / Cooper-Climax** in the 1959 and 1960 rows, and **J Brabham / Brabham-Repco** in the 1966 row. This is useful as a second *document* but remains the **same FIA publisher group** as the obituary and Hall of Fame; do **not** count FIA documents as independent publishers of one another.

## EN/UK narrative inspection targets

- `cooper-championships`: compare both language bodies against `jack-brabham-titles` and `jack-brabham-cooper`; preserve the distinction between driver titles and constructors' titles.
- `own-name`: compare both language bodies against `jack-brabham-own-car` and `jack-brabham-titles`; the precise claim is a title won **driving a car bearing his own name**, not a claim that he personally manufactured every component.
- The existing English and Ukrainian prose should remain `research_only` until a human editor verifies source semantics, wording, and translation.

## Review outcome

Three existing claims have traceable FIA passage locations recorded here. **No new publisher groups, human approvals, or publication decisions** are claimed. The original research card and publication gate remain unchanged.
