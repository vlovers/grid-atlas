# First twenty — implemented batch evidence

All twenty have expanded English and Ukrainian candidate biographies, origins,
configuration changes, driving context and two sourced historical moments.
Source comparison is AI-assisted; independent human historical/translation
approval remains pending for every edition. No new candidate is published.

These exact event bindings are checked against the genuine pinned F1DB import
on the production routes, in both languages, desktop and mobile. Turn counts
are archive measurements, not authenticated historical corner numbering.

| Circuit identity | Sample year / round | Exact F1DB layout | Candidate moments, EN/UK |
| --- | --- | --- | --- |
| interlagos | 1990 / 2 | `interlagos-2` | 2 |
| montreal | 1978 / 16 | `montreal-1` | 2 |
| hungaroring | 1986 / 11 | `hungaroring-1` | 2 |
| zandvoort | 2021 / 13 | `zandvoort-5` | 2 |
| melbourne | 2022 / 3 | `melbourne-2` | 2 |
| bahrain | 2010 / 1 | `bahrain-2` | 2 |
| shanghai | 2004 / 16 | `shanghai-1` | 2 |
| sepang | 1999 / 15 | `sepang-1` | 2 |
| imola | 1994 / 3 | `imola-1` | 2 |
| spielberg | 1997 / 14 | `spielberg-3` | 2 |
| catalunya | 2023 / 7 | `catalunya-6` | 2 |
| paul-ricard | 1986 / 8 | `paul-ricard-2` | 2 |
| mexico-city | 1963 / 9 | `mexico-city-1` | 2 |
| hockenheimring | 2002 / 12 | `hockenheimring-4` | 2 |
| nurburgring | 1976 / 10 | `nurburgring-1` | 2 |
| magny-cours | 2003 / 10 | `magny-cours-3` | 2 |
| watkins-glen | 1971 / 11 | `watkins-glen-2` | 2 |
| buenos-aires | 1974 / 1 | `buenos-aires-3` | 2 |
| kyalami | 1992 / 1 | `kyalami-2` | 2 |
| indianapolis | 1950 / 3 | `indianapolis-1` | 2 |

The original ZIP SHA-256 is
`0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`.
The executable [fixture](../../../tests/fixtures/circuit-production-cohort.json)
retains race IDs, lengths and turn counts. API internal IDs are resolved from
that imported archive; a different database may assign different internal IDs.

Existing public short summaries remain separate from these expanded candidates.
The new reader provides exact event selection, configuration chapters, result
links, original season illustrations and protected published-article support.
Other 58 circuits retain their existing page presentation.

No period apex crosswalk, new photograph or research diagram is approved in this
package. Original season illustrations avoid borrowed imagery and invented
geometry. All 20 require real independent editorial approval before expanded
publication; see [implementation evidence and release blockers](README.md).
