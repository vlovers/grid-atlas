# Circuit evidence (Milestone B)

Evidence extraction and verification for the existing circuit content of all 78 circuits. **Nothing is rewritten, generated or published.** Every claim candidate is an exact sentence of an existing block, so good existing writing is preserved and only unsupported parts will later need revision.

Report: [`COMPLETENESS.md`](COMPLETENESS.md) · pipeline policy: [`../autonomous-pipeline/README.md`](../autonomous-pipeline/README.md) · Stage A matrices: [`../circuit-completion/`](../circuit-completion/README.md)

## Pipeline

| Step | Code | Output |
|---|---|---|
| 1. Ingest every existing source verbatim (summaries, long drafts, narratives, moments, legacy TSX histories, 977 numbered + 266 grouped corner sections) | `packages/editorial-evidence/src/ingest.ts` | 1,566 blocks with file, JSON path and cited URLs |
| 2. Claim candidates: one per English sentence, Ukrainian aligned by sentence index when counts match, typed (statistic, dated event, measurement, quotation, interpretation, narrative) | `claims.ts` | `claims.json` — 4,177 candidates with block and sentence SHA-256 |
| 3. Deterministic F1DB verification: winners, poles, fastest laps, race years, first championship race (venue or layout), layout lengths, turn counts, race counts | `f1db.ts`, `dataset-check.ts` | `dataset-checks.json` |
| 4. Source registry and structural checks (https, pinned F1DB URLs, results-page year vs text, tertiary sources) | `sources.ts` | `sources.json` — 539 cited URLs |
| 5. Polite read-only fetch (robots.txt, one request per host at a time, ≥1.5 s spacing, identifying user agent, no LLM) | `scripts/source-fetch.mjs` | `source-status.json` (metadata + hashes); text only in git-ignored `.grid-atlas/source-snapshots/` |
| 6. Independent fact-check tasks: candidate passages in the stored text of the sources each sentence already cites | `factcheck.ts` | `factcheck-tasks.json` (locators: source, SHA-256 of the passage, and its offset and length in the whitespace-normalised snapshot text — never third-party text) |
| 7. Verdict contract: a checker's verdict becomes a policy `Claim`; the editorial policy re-checks excerpts, numbers, entities, dataset values and independence | `factcheck.ts` → `packages/editorial-policy` | — |
| 8. Corner names: existing names re-checked against their own cited text. A new name is accepted only when, within one sentence of a stored excerpt and at most 40 characters apart, it appears next to that exact turn number, with no other turn and no negation in between. The source text must also state the period year, and that year must be a season in which the layout was raced | `corners.ts` | `corner-names.json`, `corner-research-queue.json` |
| 9. Writing quality and EN/UK consistency | `quality.ts` | `quality.json` |
| 10. Per-circuit completeness across the 12-section standard | `scripts/circuit-evidence-report.mjs` | `completeness.json`, `COMPLETENESS.md`, `pilot/*.json` |

Regenerate: `node scripts/source-fetch.mjs` (network, local only) then `node scripts/circuit-evidence-report.mjs`.

What CI actually checks (through `pnpm test`, which the Foundation workflow runs):
- `--check` reproduces the five snapshot-independent files byte for byte (`claims`, `dataset-checks`, `quality`, `sources`, `corner-research-queue`).
- For the snapshot-derived files (`factcheck-tasks`, `corner-names`, `completeness`, `COMPLETENESS.md`, `pilot/*`), CI only checks structure: passage records hold locators only, and every cited source has a recorded snapshot hash. CI cannot recompute them, because the snapshots are not in the repository. Reproducing them needs a local fetch, and the live web can change between fetches.

## Baseline results (F1DB v2026.17.0)

| Measure | Result |
|---|---|
| Claim candidates | 4,177 from 1,566 blocks |
| **Verified claims** | **0** — no fact-check verdicts recorded yet |
| Dataset checks | 143 supported, **0 conflicts**, 25 undecidable |
| Seeded-error sensitivity | Swapping the confirmed winner for the real second-place finisher in every sentence the checker already parses as a supported winner claim: **97/97 detected**. This only measures sentences the parser recognises; wording it does not parse is not measured. |
| Held-out reviewer cases | 15/15 wording cases from two independent reviews behave as expected (tests). They cover passive voice, "beat X to victory", "was the 1992 winner", surname collisions (Ralf/Michael Schumacher, Damon/Graham Hill), clause-local negation, intention ("needed to win"), appositive commas ("Mansell, driving a Williams, won") and possessives ("Mansell's 1992 victory"). |
| Claims with an evidence lead | 2,242 (54%): dataset support, or a cited passage containing every number and name |
| Cited sources | 539, re-fetched under RFC 9309 robots rules: 445 live non-PDF (444 HTML, 1 served as octet-stream), 42 live PDF (no text extraction yet), 11 thin or script-rendered, 30 access denied (publishers blocking automated access, mainly Autosport, Motorsport.com and RacingCircuits.info), 6 rate-limited (grandprix.com), 4 robots-disallowed (one of them a host whose robots.txt is unreachable, which counts as disallowed), 1 unreachable, 0 confirmed dead |
| Existing corner names | 218: 130 found in their own cited source text, 61 not shown by that text, 27 whose sources are PDFs/unavailable |
| Turns queued for name research | 1,882 across all layouts (1,573 never researched + 309 incomplete) |
| Writing flags | 456 blocks shallow (below the per-kind length floor or with few specifics), 5 repetitive, 71 with EN/UK issues |
| Content complete | 0/78 |

"0 conflicts" means the existing drafts agree with F1DB on every fact the checker can parse and the dataset can decide. The rules were tuned against this same corpus, so the zero is an in-sample figure. Eight false positives were found and fixed along the way:
- a driver's personal "first win";
- a layout's first race;
- years in other clauses;
- multi-year sentences;
- "on the way to victory";
- "needed to win".

Support and conflict are judged only on the driver the sentence credits, never on others it mentions. A preceding first name narrows a surname ("Ralf Schumacher").

## Pilot batch (Stage C)

Dossiers in [`pilot/`](pilot/). Each contains the circuit's claims with status, dataset checks, passage locators, source statuses, corner names and queue, and quality flags.

| Circuit | Claims | Lead rate | Dataset ✓ | Sources reachable/cited (HTML+PDF) | Names found/named | Turns queued | Main gap |
|---|---|---|---|---|---|---|---|
| silverstone | 87 | 80% | 1 | 5/5 | 18/18 | 91 | No long history; 7 of 8 layouts without corner research |
| interlagos | 74 | 40% | 2 | 8/8 | 0/13 (sources are PDFs) | 26 | 31 claims rely only on PDF sources — needs PDF text extraction |
| brands-hatch | 53 | 64% | 1 | 10/11 | 8/9 | 18 | Origins absent |
| lusail | 51 | 51% | 3 | 5/5 | 0 named (number-only) | 0 | No defining moments; legacy renderer |
| monaco | 18 | 56% | 0 | 2/2 | — (grouped guide only) | 103 | No long history; 6 layouts unresearched |
| dallas | 17 | 76% | 1 | 2/2 | — | 23 | Single race; corners and moments absent |
| pescara | 16 | 69% | 4 | 2/2 | — | 24 | 25 km road course; corners absent |

## What is and is not proven

- Dataset checks prove agreement with F1DB for winners, poles, fastest laps, years, first races, lengths and turn counts. They do not prove narrative causes, quotes, adjectives or unnamed people.
- Dataset records are bound to their scope. A race record backs only claims about that race's circuit whose sentence states that race's season, and one claim cannot combine records of two races. Records without a scope are rejected.

**The dataset alone verifies only canonical statements (policy v1.6.0).** A claim is verified by F1DB without sources only if its EN and UK text are exactly the trusted renderer's wording for the cited records. Today that means winner + season of a single-winner race at a circuit that held only one championship race that season (no canonical wording for Bahrain, Silverstone or Spielberg 2020, or Spielberg 2021): "Alain Prost won the 1988 race." / "Перегони 1988 року виграв Ален Прост." (`F1dbIndex.renderStructured`; the Ukrainian side needs the reviewed name table). A block resting on such a claim must state exactly that sentence (policy v1.7.0).

Whatever its sources, a claim the dataset contradicts fails: `datasetConflicts(index)` is the policy's contradiction hook. Rendered names are unaccented slug names ("Kimi Raikkonen"), so accented prose is not canonical and goes through the sourced path. That is a limitation, not a bypass.

Every existing draft sentence is free prose, so it needs independent source evidence however well it agrees with the dataset. Three review rounds showed that pattern rules cannot prove free prose against a dataset: extra years, shared surnames and wrong teams kept slipping through. `isPureStatistic` now only types sentences for routing.

Entity recognition:
- Full names are matched first ("Lewis Hamilton", "Jean-Pierre Jabouille", "José Froilán González"), so a first name is never read as another driver's surname. "Jr"/"Sr" selects the generation; without it, the unsuffixed driver. On all 1,163 single-winner race statements the recogniser returns exactly the winner.
- Capitalised country and month words ("in Ireland", "in March 1970") are not read as surnames or teams, unless they directly follow a capitalised first name ("Innes Ireland").
- A bare shared surname ("Hill", "Schumacher", "Senna") is its own entity, `ambiguous:<surname>`, so evidence about one Hill never backs a claim about another.
- Dataset mentions are full names only.
- Constructors are recognised ("with Ferrari" needs evidence naming Ferrari). A full driver name is not also counted as the team named after him.
- Passage leads are retrieval hits, not support. A lead becomes evidence only through a fact-check verdict that the editorial policy accepts.
- Ukrainian text is checked for completeness, structure, significant numbers, and Latin-script names absent from the English. The editorial policy (since v1.5.0) requires a claim and its block to name the same entities in EN and UK. Ukrainian names are recognised only through a reviewed EN→UK name table, which does not exist yet. Until it does, every claim that names someone fails `claim_entities_differ_across_locales`: fail-closed, whatever position or case the Ukrainian name takes. Meaning is not compared.
- `verdictToClaim` refuses a checker that is the recorded legacy writer of the sentence's own file.
- Snapshot hashes prove integrity, not that the text is what the URL serves today. Re-fetching and archive cross-checks are planned.
- PDF sources (42, mostly FIA circuit maps and documents) are live but unread; until text extraction is added, claims relying only on them stay without leads.

## Next steps

1. **PDF text extraction** for the 42 live PDFs (FIA maps carry corner numbering), stored in the same git-ignored snapshot store.
2. **Reviewed EN→UK name table** for drivers, constructors and circuits, feeding the policy's entity recogniser so Ukrainian names are bound too (activation requirement from the PR #421 review).
3. **Pilot fact-check run** on the 7 pilot circuits (316 claims): an independent checker (separate agent and run from any writer, recorded as `fact_checker`) returns verdicts through `verdictToClaim`; the policy accepts or rejects each. Measure acceptance rate, rejection reasons, and checker–policy disagreement.
4. **Corner research for the pilot layouts** using `acceptCornerName`: period-dated numbered maps first (FIA, circuit operators), number-only where no evidence exists.
5. **Revision** of only the sentences that fail (unsupported, contradicted, shallow) — never regeneration of supported text — then EN/UK review and a full policy dry run on the pilot items.
