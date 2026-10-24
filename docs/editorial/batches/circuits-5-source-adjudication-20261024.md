# Circuit editorial — five-venue source adjudication, 24 October 2026

**Scope:** Silverstone, Monaco, Spa-Francorchamps, Monza, Suzuka. **Research verification checkpoint, not editorial approval or publication.** URLs are exact review locators; results taken from Formula 1/venue operator pages. No official Formula 1 URL ID is a Grid Atlas/F1DB internal race ID.

## Directly evidenced historical claims

| Claim ID | What is supported | Exact source / locator | Editorial disposition |
| --- | --- | --- | --- |
| SIL-01 | Silverstone hosted the inaugural F1 World Championship race in May 1950, won by Giuseppe “Nino” Farina in an Alfa Romeo | https://www.silverstone.co.uk/about/history-grand-prix — opening paragraph and 1950 section | Retain; distinguish World Championship first round from prior races |
| SIL-02 | 1948/1949 British Grands Prix were held at Silverstone before the 1950 championship | Same Silverstone history, entries for 1948, 1949 | Retain; first F1 Championship event ≠ first Silverstone racing event |
| SIL-03 | 1950 had a different configuration and starting area than today; contemporary F1 article describes 4.6 km and original turns | https://www.formula1.com/en/latest/article/65-years-of-f1-10-fascinating-facts-about-the-very-first-worl.6gn2PVzChfAcJ3Nj7OGHP1 — circuit layout paragraph | Retain only the general layout distinction pending F1DB geometry matching |
| MON-01 | First Monaco Grand Prix was held 14 April 1929; winner listed as “Williams” in Bugatti | https://acm.mc/archives-gpf1/81e-formula-1-grand-prix-de-monaco/fan-experience/palmares/ — row “1er” | Retain; if naming the person “William Grover-Williams”, separately cite identity-level source rather than expanding the results row alone |
| MON-02 | The World Championship Monaco Grand Prix of 1950 was on 21 May; Fangio won in an Alfa Romeo | Same ACM palmarès, 1950 row “11e” | Retain |
| SPA-01 | Last GP on the old long Spa course was held in 1970; winner Pedro Rodríguez | https://www.spagrandprix.com/en/the-circuit — 1970 chronology entry | Retain |
| SPA-02 | New short Spa circuit opened in 1979, stated as 6.947 km; F1 returned in 1983, Prost won | Same promoter source, 1979 and 1983 entries | Retain; do not substitute modern 7.004 km for 1979 |
| SPA-03 | The circuit changed again by 2007; promoter states the remodelled 7.004 km route | Same promoter source, 2007 chronology | Retain as year-specific, not timeless |
| MONZA-01 | Original circuit built in 1922 with a 5.5-km road track and 4.5-km speed loop | https://www.monzanet.it/en/history/ — “1922–1928” | Retain; these are portions of original infrastructure, not the modern GP length |
| MONZA-02 | Official Monza opening was **3 September 1922**, but the **Italian automobile Grand Prix took place on 10 September 1922** | Same Monza source, “1922–1928”; official F1 overview https://www.formula1.com/en/information/italy-autodromo-nazionalemonza.FiJN1jnQlRLeHqOxIt13m | Important correction: do not describe 3 September as the Italian GP race date |
| SUZ-01 | Suzuka opened in 1962; designed by John Hugenholtz and associated with Honda's test track | https://www.formula1.com/en/information/japan-suzuka-international-racing-course.2XjOiKgIHRRBVVpp5N3S5t — “When was the track built?” | Retain |
| SUZ-02 | First F1 Suzuka GP was 1987; Mansell qualifying accident ruled him out and confirmed Piquet's championship | Same official F1 circuit profile — “When was its first Grand Prix?” | Retain with explicit championship context |
| SUZ-03 | Senna won Japan 1988 for McLaren Honda and secured his first drivers' world title at Suzuka | https://www.formula1.com/en/results/1988/races/541/japan/race-result — result; https://www.formula1.com/en/latest/article/top-10-moments-of-ayrton-senna-brilliance.7agG0t99di8rxGAh4Wq2RZ — section on 1988 Japan | Retain; title statement independently supported by Formula 1 editorial rather than only race classification |
| SUZ-04 | In 1988 the championship counted each driver's 11 best finishes; official final totals Senna 90, Prost 87 | https://www.formula1.com/en/latest/article/the-elite-group-norris-joins-as-a-mclaren-world-champion.5zxR12eN0M4IM0onxSXR0F.5zxR12eN0M4IM0onxSXR0F and https://www.formula1.com/en/results/1988/drivers | Retain with explicit 'championship-counted points', not a naive sum of all race-result points |

## Precise correction needed to first-batch narrative

Monza copy in `circuits-4-research-20261024.md` currently says the Italian Grand Prix arrived at Monza in 1922; that broad statement is correct, but the source register pairs it with the 3 September opening. If adding dates, distinguish **3 September (circuit inauguration)** and **10 September (Italian car GP)**. The text itself does not currently assert the false same-day claim.

Monaco ACM classification prints winner as “Williams”; an editor must source the fuller biographical name separately. No unsupported identity expansions from results-only pages.

Suzuka championship claim has an official narrative source; do not rely on 1988 per-race point summation to compute the title. The 11-best-results scoring rule is a critical historical detail.

## Not yet cleared

1. Canonical circuit external IDs for the pinned F1DB `v2026.17.0`; current GitHub connector has not run the verified archive ZIP/import.
2. Exact circuit-layout / event association for the 1950 Silverstone, 1929 Monaco, original Spa, original Monza and 1987/1988 Suzuka configurations. No invented geometry, corner or DRS annotations.
3. Independent proofreading and editor/rights decision. Source availability does not permit copying event photos and circuit maps.
4. Source-located line-by-line review of every sentence in the five bilingual manuscripts; this document verifies selected central historical claims, not all prose.
5. Circuit-specific publication backend and review contracts. Existing documented approved text publisher is scoped to driver articles.
6. CI, lint, production build, browser accessibility and real imported archive tests; none run as part of this documentation-only checkpoint.

**Recommendation:** complete F1DB race/layout crosswalk first, then integrate through an actual reviewed circuit content pipeline. Do not merge these research manuscripts as if they were production-approved histories.
