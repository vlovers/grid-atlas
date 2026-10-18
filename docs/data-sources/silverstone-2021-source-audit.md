# Source audit: Racing Point → Aston Martin (2021)

**Review state:** source checked; candidate remains **proposed**, not independently approved and not published.

## Source examined

- Publisher: Formula 1
- Title: *Racing Point set sights on top 3 after Aston Martin re-brand*
- Publication: 11 February 2020
- URL: https://www.formula1.com/en/latest/article/aston-martin-target-becoming-one-of-f1s-top-teams-after-racing-point-re-brand.7HpHDVaOm5Gr2SR1CWoKz6
- Accessed: 2026-10-19

The official Formula 1 article states that Racing Point would become the Aston Martin works team in 2021. It reports team principal Otmar Szafnauer explicitly confirming that the Racing Point name would remain through 2020 and change to Aston Martin F1 Team at the start of 2021. This supports the narrow **team/constructor branding transition**, `renamed_to`, effective year **2021**.

## Existing proposed manifest

`docs/data-sources/manifests/silverstone-2021.proposed.json` contains the proposed constructor edge:
- subject F1DB external ID: `racing-point`
- object F1DB external ID: `aston-martin`
- relation: `renamed_to`
- effective year: `2021`

The article does **not** independently establish legal corporate identity, transfer of every asset, or continuity with Aston Martin's unrelated 1959–60 F1 participation. Do not use this source to assert those.

## Outstanding publication gates

- [x] Inspect official contemporaneous reporting and match relation type/year to its explicit wording.
- [ ] Independently confirm both exact F1DB external IDs resolve to the intended **distinct** constructor rows in the pinned imported database.
- [ ] Validate/import proposed manifest in the target environment (prior disposable import tests do not imply production deployment).
- [ ] Obtain a second person's editorial approval, including scope and evidence, with reviewer identity and review PR.
- [ ] Publish the specific approved record using the guarded manual transaction in `lineage-publication-runbook.md`.
- [ ] Verify public verified-only API, source details and both entity routes after deployment.

**No automatic verification or production database change was performed.**
