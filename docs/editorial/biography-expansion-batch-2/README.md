# Biography expansion batch 2 — unpublished research

24 October 2026. Base: main `ed0967b`. **No historical biography is approved or published by this batch.**

All writing is AI-assisted original research drafting. Every claim and both translations still need accountable human source, language and originality review. The ten selected careers are complete enough to describe through retirement; no current racing plans are inferred.

## Read the biographies

Word counts include claim prose only, using Unicode word tokens; titles, references, gaps and duplicated readable renders are excluded. Paragraph IDs are review units that may contain several facts, not a claim that each paragraph is one atomic fact.

| Driver | English | Ukrainian | Approx. EN / UK words |
| --- | --- | --- | --- |
| Juan Manuel Fangio | [EN](manuscripts/juan-manuel-fangio.en.md) | [UK](manuscripts/juan-manuel-fangio.uk.md) | 567 / 506 |
| Jim Clark | [EN](manuscripts/jim-clark.en.md) | [UK](manuscripts/jim-clark.uk.md) | 549 / 480 |
| Graham Hill | [EN](manuscripts/graham-hill.en.md) | [UK](manuscripts/graham-hill.uk.md) | 514 / 447 |
| Jack Brabham | [EN](manuscripts/jack-brabham.en.md) | [UK](manuscripts/jack-brabham.uk.md) | 570 / 481 |
| Jackie Stewart | [EN](manuscripts/jackie-stewart.en.md) | [UK](manuscripts/jackie-stewart.uk.md) | 589 / 508 |
| Emerson Fittipaldi | [EN](manuscripts/emerson-fittipaldi.en.md) | [UK](manuscripts/emerson-fittipaldi.uk.md) | 587 / 506 |
| Niki Lauda | [EN](manuscripts/niki-lauda.en.md) | [UK](manuscripts/niki-lauda.uk.md) | 607 / 499 |
| Nigel Mansell | [EN](manuscripts/nigel-mansell.en.md) | [UK](manuscripts/nigel-mansell.uk.md) | 501 / 433 |
| Mika Häkkinen | [EN](manuscripts/mika-hakkinen.en.md) | [UK](manuscripts/mika-hakkinen.uk.md) | 705 / 584 |
| Sebastian Vettel | [EN](manuscripts/sebastian-vettel.en.md) | [UK](manuscripts/sebastian-vettel.uk.md) | 626 / 543 |

Total: **5,815 EN + 4,987 UK words**, 20 manuscripts, 121 paired source-located paragraphs and 60 career chapters per language. The same paragraph IDs, section order and evidence register appear in both locales.

## Audit and prioritized gaps

The local `content_articles` table contained zero rows on inspection; the repository supplies no approved historical publication for these drivers. This is a draft expansion, not an edit to live published prose. Production database/deployment state was not queried. Public profiles keep their existing statistics-only fallback.

Five selected drivers had very short canonical English dossiers: Stewart 47 words, Fangio 52, Vettel 52, Clark 61, Lauda 70. Graham Hill, Brabham, Fittipaldi, Mansell and Häkkinen had no canonical dossier in the existing directory. This comparison is scoped to canonical dossier prose; it does not claim that all legacy Markdown, raw research packets or PR #274 cards are absent.

Priority was narrative coverage of the early championship, the rear-engine transition, the 1960s/1970s safety and engineering changes, and later championship generations. Existing five-driver pilots already have substantially more research; repeating those outlines would leave the shorter historical profiles untouched.

Each biography covers origins and the route into F1; breakthrough; major campaigns and titles; team changes and evidenced sporting rivalries; attributed driving technique; later career and legacy. Examples include Hill at Le Mans, Brabham’s named collaborators, Stewart’s collective safety campaign, Fittipaldi’s second career, Lauda’s race preparation, Häkkinen’s DTM years and Vettel after the Red Bull titles.

## Existing architecture and review handoff

`dossiers/` contains ordinary schema-1 dossiers, validated by the existing `editorial_dossiers.py`. `reviews/` contains the existing exact-revision sidecar format with `stage=evidence_review`; every claim/check decision and publication remains null. `manuscripts/` is the exact output of the existing `render_draft`, not a second maintained prose source. Editing a render alone fails validation.

After editing a dossier, regenerate only its readable copy with the existing renderer. Resolve every gap, split compound paragraph claims if needed, and have independent human reviewers inspect each passage and each translation before the existing [review/export pipeline](../APPROVED_RELEASE_PIPELINE.md) is considered. A cleared dossier can be selected by that pipeline’s explicit `--dossier` and `--review` arguments. This batch does not replace canonical older revisions, release manifests or publication records.

No Content Factory V1 scripts/tests, `drivers-30-v1` files, PR #274-owned UI files or shared package scripts are changed. This work is a separate long-form review revision; it complements the other branch’s breadth without copying its prose or claiming its approvals.

## Evidence

The dossiers cite **57 distinct source documents across 30 declared publisher groups**, including F1DB. 98/121 paragraph pairs include a non-F1DB historical/participant source; 72/121 have more than one declared publisher group. These are coverage counts, not semantic corroboration or approval scores.

Sources include Formula 1 historical profiles and results, FIA contemporary reporting, team and engineer recollections, the Jim Clark Trust, the Fangio Museum, Sport Australia Hall of Fame, ACO, Indianapolis Motor Speedway, DTM, the Institution of Mechanical Engineers, the BRDC and the International Motor Racing Research Center. Each reference has an actual URL, title/publisher, access date and a passage/table/record locator. See [source observations and discrepancies](SOURCE_NOTES.md).

All prose is a paraphrase or original synthesis, with no fabricated quotation and no reproduced article or image. Source publication dates are left unknown unless independently established; retrieval dates do not stand in for publication dates. Team and sponsor accounts retain their interests and are not mislabeled as independent approval.

## Statistical acceptance

The [authored assertions](statistics-assertions.json) are checked against checksum-pinned F1DB v2026.17.0. [Executed archive evidence](archive-validation.json) contains all ten identity matches and **231 passing assertions**, covering title years, win counts and winning rounds, championship points, individual results, constructors and qualifying. Season points come from final championship classifications, not raw race-point sums. Shared-drive entries and DNS/DNQ rows remain explicit.

The source archive SHA-256 is `0f1717eaebae646b7ced9ca96f6be3282c1c1d435d0a9d75f2c00f40feb7d2a8`. Reproducing a field match validates that assertion against the pinned data, not every sentence or the underlying source’s historical truth. Early careers, Indianapolis, Le Mans, DTM, technical testimony and interpretation require separate source review.

```sh
python3 scripts/audit_driver_biography_batch2.py \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt
python3 -m unittest discover -s tests -p test_driver_biography_batch2.py -v
```

## Publication and remaining work

The existing exporter rejects all twenty real dossiers without independent approval. No database import, public route change, UI feature, media download, author signature on behalf of a human, or publication operation is included.

Remaining work: human semantic verification of every compound paragraph and its locators; source-conflict resolution; independent Ukrainian and English copyediting; identity/name semantics; originality/copyright review; and explicit authorization for any future publication. Styles and interpretations remain attributed assessments. Manuscript completion is not publication readiness.

See [executed checks and independent review disposition](VERIFICATION.md).
