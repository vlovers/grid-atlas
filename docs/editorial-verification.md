# Editorial verification policy (v0.1)

Grid Atlas is an evidence-led historical encyclopedia. Imported F1DB records provide structured statistical observations, **not** automatically verified narrative biographies. Generative models may draft or suggest sources but cannot approve claims in the existing human-approved driver-biography database publication lane. A separate, explicitly labeled AI-reviewed static-story lane is defined below; it must not create human approvals or bypass any evidence, rights, or deployment checks.

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

## Separate AI-reviewed static history stories (not driver biographies)

The `/[locale]/stories/moments/[slug]` route renders authored, bilingual, source-traceable static stories. It **does not** publish through the driver-dossier database approval pipeline. The user's requested label for a released edition is `AI-reviewed`; it must describe AI verification truthfully, not an independent human reviewer.

A static story may be promoted from draft to published AI-reviewed **only after** all the following independent, reproducible gates are satisfied:

1. **Exact edition scope:** record the story slug, the final English and Ukrainian text revisions or content hashes, and the approved source-ledger revision. Any later material edit revokes this specific edition's approval.
2. **Claim evidence:** inspect every substantive claim appearing in both final texts, not just a representative five-item ledger. Retain stable citations and source locators, classify interpretation and uncertainty visibly, and correct or remove unsupported claims. A source URL alone is not a check.
3. **Bilingual editing:** check full factual parity, names, era-appropriate terminology, clarity, and internal links for both locales. Record the AI review method and actual review revision, never a fictional human identity.
4. **Rights and media:** use only independently rights-cleared assets in the publication manifest; generated or code-drawn artwork must be labeled appropriately. No photograph is required for a text-first release.
5. **Reader and build acceptance:** check the actual static reading route, mobile and keyboard navigation, route metadata, archives and references, and all required CI at the final head SHA. Publish only explicitly approved story slugs, leaving all others `noindex` with a truthful draft label.
6. **Corrections:** provide references and a correction path. Remove the published status if factual or provenance integrity fails; preserve the superseded edition in the audit record.

The existing **human-approved** driver biography rules and their database signatures stay unchanged. Never inject an AI identity into a human-review field, make `reviewerSignoff` true without a real human signature, or call a five-claim research ledger a full manuscript audit. This section defines the separate eligibility contract; it does not itself approve or publish the ten existing drafts.
