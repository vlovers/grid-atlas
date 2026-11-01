# First five circuit dossiers: official result evidence crosswalk

**2026-10-24 · Supplemental fact-check · Not a publication approval**

This checkpoint narrows source verification to five circuits and exact Formula 1 result pages. It does not independently approve the prose, circuit identities, layout art, or full source chain. Numeric race IDs in the official F1 website URLs **must not be confused with F1DB IDs or local PostgreSQL IDs**.

| Circuit | Season / race | Official F1 evidence | What it confirms | Status |
| --- | --- | --- | --- | --- |
| Silverstone | Great Britain, 13 May 1950 | https://www.formula1.com/en/results/1950/races | Nino (Giuseppe) Farina won for Alfa Romeo; the event is listed first in the 1950 championship results | Official result inspected |
| Monaco | Monaco, 21 May 1950 | https://www.formula1.com/en/results/1950/races/95/monaco/race-result | Juan Manuel Fangio won for Alfa Romeo | Official result inspected |
| Spa-Francorchamps | Belgium, 18 June 1950 | https://www.formula1.com/en/results/1950/races/98/belgium/race-result | Juan Manuel Fangio won for Alfa Romeo; Luigi Fagioli finished second | Official result inspected |
| Monza | Italy, 3 September 1950 | https://www.formula1.com/en/results/1950/races/100/italy/race-result | Nino Farina won for Alfa Romeo; shared-car rows need careful interpretation | Official result inspected |
| Suzuka | Japan, 1 November 1987 | https://www.formula1.com/en/results/1987/races/525/japan/race-result | Gerhard Berger won for Ferrari; Ayrton Senna was second | Official result inspected |
| Suzuka | Japan, 30 October 1988 | https://www.formula1.com/en/results/1988/races/541/japan/race-result | Ayrton Senna won for McLaren Honda; Alain Prost was second | Official result inspected |

## What to keep qualified

- **Silverstone**: an official results listing supports race order and winner; the status of the 1950 championship opening is distinct from earlier non-championship Silverstone meetings.
- **Monaco**: the 1929 first Grand Prix / Grover-Williams attribution is outside the F1 World Championship results and needs separately checked Automobile Club de Monaco evidence.
- **Spa**: the first long road route, ~15 km measurement and 1979 redesign require a dated layout/source check; no current measured length belongs automatically to 1950.
- **Monza**: the first 1922 event and banked sections require separate circuit-history evidence. The 1950 official result lists shared-car rows; do not derive a one-driver/one-car finishing assumption.
- **Suzuka**: the 1987/1988 result pages prove winners, not by themselves Mansell's qualifying incident or mathematical championship-clinching point; separately validate the relevant session and championship rules.
- In every case, the mapping from historical race to circuit layout remains **unverified** pending a checksum-verified pinned F1DB crosswalk.

## Editorial phrasing recommendation

Remove meta-descriptions about what “the archive reader” should do from customer-facing narrative where a simpler historical passage can carry the same meaning. Put limitations in concise “About these figures” help and keep source access visible. Never rewrite a *result entry* count as a *win* or *podium* without confirming uniqueness and meaning.

## Remaining release gates

1. Verify original venue histories (year of construction, pre-1950 events, layout changes) at paragraph/date locators.
2. Reconcile historical results and layout mappings against pinned `v2026.17.0` race records.
3. Confirm canonical F1DB external IDs and local database IDs independently.
4. Perform editorial English/Ukrainian review, resolving translated names and racing terminology.
5. Confirm an actual circuit editorial publication contract exists or implement one in an isolated, separately reviewed change. The established approved dossier publisher is driver-only.
6. Obtain real human claim and locale approval; run source validator, publication dry-run where supported, integration and browser checks. **Do not ship these drafts directly.**
