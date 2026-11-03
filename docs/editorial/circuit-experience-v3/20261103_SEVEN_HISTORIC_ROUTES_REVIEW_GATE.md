# Seven historic routes — numbered-apex and claim-provenance gate (3 November 2026)

This is a **review handoff for the existing Draft PR #395**, not a new BATCH_01/02 dossier and not an approval to publish. It audits the already integrated route sections and the 66-item historical corner review queue without copying maps or photographs.

| Historic layout | Existing EN/UK route sections | Individual period bend studies | Named features | Period bend studies with pinpoint source locators | Numbered apex map approved |
| --- | ---: | ---: | ---: | ---: | --- |
| Ain-Diab 1958 | 13 | 1 | 0 | 1 | No |
| Clermont-Ferrand / Charade 1972 | 8 | 0 | 11 | 0 | No |
| Dallas 1984 | 13 | 16 | 0 | 0 | No |
| Detroit 1982 | 10 | 17 | 0 | 0 | No |
| Pescara 1957 | 7 | 4 | 2 | 4 | No |
| Porto 1958–1960 | 7 | 7 | 0 | 0 | No |
| Sebring 1959 | 10 | 8 | 0 | 0 | No |
| **Total** | **68** | **53** | **13** | **5** | **0** |

Of 53 individually described bends, **48 still lack a claim-specific locator** (page, paragraph, or explicitly identified passage). A linked report is not a pinpoint citation, and a race classification is not evidence of corner geometry. The 13 named features are separate research entries, not additional numbered FIA corners.

## Period and source conflicts that remain open

- **Ain-Diab 1958:** F1DB layout lists 18 bends, while one summary lists 15; the contemporary race evidence does not supply a numbered map. Do not assign a 1–18 apex sequence from the count alone.
- **Charade 1972:** F1DB lists 48 turns; the historic circuit operator describes 51 bends. Its names (including Manson and Gravenoire) are historical labels, not certified 1972 FIA indices. Photographic position numbers are not turn numbers.
- **Dallas 1984:** F1DB's 23-turn layout is not equivalent to 13 route-complex descriptions or the 1988 Trans-Am configuration. The 16 separate bend studies are provisional.
- **Detroit 1982:** do not substitute the modified 1983–1988 layout. Period reports describe the road sequence but do not certify turn-to-apex numbering; the reported route lengths also differ between historical sources.
- **Pescara 1957:** local bend names and the inland/coastal route are research leads. An event-specific chicane is reported; pre-1957 Coppa Acerbo diagrams cannot be assumed identical.
- **Porto 1958–1960:** a period driving report establishes tramline crossings and the street sequence; neither a 19-turn archive count nor the later 2005 revival supplies a numbered period chart.
- **Sebring 1959:** the original airfield route differs materially from the modern circuit. The eight described bends and a modern historical illustration do not establish 1959 FIA turn numbers.

## Engineering safeguards

The review queue now preserves **primary name evidence vs supplementary layout context** as different URL roles. In particular, the second sources for Pescara's two named features are not automatically labelled as independent confirmation of the names. Missing claim locators are explicit `null` values, not invented citations.

The publication gate additionally requires a dated numbered-map source key matching the layout/year, a human-reviewed turn-to-apex crosswalk, and a reference to that map on **every** turn. Existing candidates do not contain such a receipt; flipping `review_status` and per-turn statuses alone cannot publish them. Exact-edition human approval remains a separate requirement.

The F1 2026 reliability retrospective previously linked for Adelaide contains an erroneous statement about the 1986 race winner; the context reference was switched to an older official F1 championship account. This corrects source quality, not the underlying corner numbering.

## Rights and release status

Official FIA and F1 documents, period journalism, third-party circuit diagrams and Wikimedia historical illustrations are **outbound research links**, not licenses to reproduce their graphics. Existing F1DB outlines retain their own CC BY 4.0 attribution; a linked Sebring historical SVG is marked CC BY-SA 3.0 but has not been copied into the site. No image-rights or historical-review approval is granted here.

**Release remains closed.** 71/78 candidate numbered guides and 1,015 candidate positions are research coverage, not independently approved named turns. Seven layouts still lack a complete authenticated numbered guide. Human historical review, period chart provenance and exact claim locators remain necessary.
