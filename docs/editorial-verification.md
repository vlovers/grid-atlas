# Editorial verification policy (v0.1)

Grid Atlas is an evidence-led historical encyclopedia. Imported F1DB records provide structured statistical observations, **not** automatically verified narrative biographies. Generative models may draft or suggest sources but cannot approve claims or publish articles.

## Publication gates

1. Every nontrivial historical claim has a stable ID, precise wording, relevant date/season and one or more citations to the *specific* supporting passage or record. Store source title, publisher/author, canonical URL or archival identifier, access date, and any source version.
2. A reviewer opens the cited source and checks that it actually supports the precise wording and its context. Independent corroboration is preferred for consequential or disputed claims; mirrored articles count as one source.
3. Classify claims as `draft`, `needs_review`, `verified`, `disputed` or `rejected`. Only a named human reviewer can transition narrative claims to `verified`; preserve the reviewer, timestamp, rationale and revision. `disputed` claims may appear only as explicitly attributed controversies after review, never as established facts.
4. Confirm driver identity using canonical F1DB identifiers, names and career chronology before associating claims, media or aliases. Do not merge homonyms or treat constructors, entrants and legal team lineage as interchangeable.
5. Reconcile numeric claims against pinned imported data and their exact metric semantics. Recorded results, entries, starts, classified finishes, points, championships and wins are distinct concepts. Document era-specific rules and shared-drive cases. Flag disagreement rather than silently choosing a number.
6. For each media asset retain original file page, creator, license name/version, license URL, required attribution, modifications, provenance, and a documented reuse check. Commons availability does not itself prove reuse rights; never import images with unresolved rights.
7. Ukrainian and English versions are independently proofread against the same reviewed claim IDs; translation must not add facts. Record per-locale review status.
8. Publish only after source verification, copyright check, language review, internal-link validation, and an editorial sign-off. Save an immutable published revision; preserve corrections and retractions.

## Pilot biographies

Start with Ayrton Senna, Michael Schumacher, Lewis Hamilton, Max Verstappen and Alain Prost. For each, target: lead, early career, F1 chronology, teams, major milestones, historical context, sourced controversies when relevant, statistics linked to imported records, references and licensed image. A target length is not a substitute for sourced substance. Publish a useful stats-only profile until a biography clears review.

## Evidence record (proposed data contract, not implemented schema)

```json
{
  "claim_id": "driver-senna-championships",
  "subject_type": "driver",
  "subject_id": "<canonical-f1db-id>",
  "statement": "<precisely scoped assertion>",
  "status": "needs_review",
  "evidence": [{
    "source_url": "<canonical source URL>",
    "source_title": "<title>",
    "publisher": "<publisher>",
    "locator": "<page, section, table or record>",
    "accessed_on": "<YYYY-MM-DD>",
    "supports": true
  }],
  "reviewer": null,
  "reviewed_at": null
}
```

The example is a contract illustration, **not** a verified factual claim. Avoid public badges that imply every line of a biography has been checked when only some claims were reviewed.

## Initial acceptance tests for a future implementation

- An unreviewed claim never appears as verified public prose.
- A claim without evidence cannot be approved.
- Rejected/disputed claims cannot silently become factual assertions through translation.
- Changing a cited claim invalidates its previous review until re-approved.
- A media asset with missing license/creator/attribution cannot publish.
- Numeric statistics use explicitly named and tested metric definitions.
- Every public biography exposes a references section and correction path.

## Initial source register

- F1DB: https://github.com/f1db/f1db — pinned structured statistics, verify exact imported release.
- FIA: https://www.fia.com/ — regulations, official documents and classifications where available.
- Formula 1: https://www.formula1.com/ — official historical articles and profiles; source-specific checks still required.
- Wikimedia Commons: https://commons.wikimedia.org/ — candidate licensed media; inspect each individual file page.
- Wikidata: https://www.wikidata.org/ — candidate identity reconciliation, not standalone corroboration for disputed history.

This policy does not authorize scraping, bulk image downloads or copying copyrighted biographies. Write original summaries from reviewed evidence.
