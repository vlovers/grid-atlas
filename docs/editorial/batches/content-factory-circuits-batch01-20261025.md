# Circuit Content Factory — batch 01

## Objective
Generate **25 bilingual Basic-tier circuit briefs in one reproducible run**, sourced only from the checksum-pinned F1DB v2026.17.0 archive. Selection is deterministic: most recorded World Championship races in archive, ties by source external ID. This is a *new independent batch* on top of `main`, not an extension of unfinished PR #296.

## Output and scope
The JSON includes exact source circuit IDs, source names, recorded race counts, first/last recorded season, all source race IDs, circuit layout IDs referenced by those races, and reader-friendly UK/EN neutral summaries. No manually invented winners, origins, ages, route geometry or rights status. Empty historical information is represented by null/empty arrays, not fabricated copy.

The output is **unpublished** and **machine_generated_unreviewed**. This is Basic-tier coverage, **not 25 human-written Enhanced histories**. Existing editorial manuscript research and human-reviewed Premium histories must remain separate; none of them is considered approved by this process.

## Reproduce
```sh
python3 -m unittest discover -s tests -p 'test_content_factory_circuits.py' -v
python3 scripts/content_factory_circuits.py \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \
  --output /tmp/grid-atlas-circuit-content-batch01.json
```

The existing real-archive GitHub Actions workflow runs those checks with actual pinned ZIP and uploads `unpublished-circuit-content-batch01` (14 days). Only an actual successful workflow + artifact inspection confirms real selected identities and coverage.

## Remaining release gates
1. Inspect real generated archive artifact for source identity, English/Ukrainian wording and counts.
2. Review translation quality, provenance and inaccuracies, fix source-data interpretation.
3. Integrate safe Basic-tier content on public pages through a separately reviewed route with actual API/render/browser acceptance; this PR does **not** change the current UI.
4. Enhance with specific researched narrative only where every claim has sources and human approval; do not mass-publish speculative prose.
5. Keep photo/media licensing independently gated.

The key metric is number of **published, verified** EN+UK circuit pages, not number of created research files.

## First actual archive execution (GitHub Actions run `40135170860`)

The pinned-archive generation step and artifact upload both **succeeded**. Downloaded and inspected `unpublished-circuit-content-batch01`, artifact `12576942110`: **25 entries**, with two locale objects each. Source ordering starts `monza` (76 race records), `monaco` (72), `silverstone` (61), `spa-francorchamps` (59), `montreal` (45). This is a fixed-archive observation, **not** proof that all listed races were completed.

Important semantic correction applied after that first successful artifact: some source records may refer to scheduled events, so the reader-facing wording now says **race records associated with the circuit** instead of asserting that all records describe completed Grands Prix. Sorted source race IDs also make the JSON deterministic under shuffled source ordering. The strengthened assertions must pass new CI before relying on the updated output.

Unpublished reading preview: generated locally from that real 25-circuit artifact as a separate HTML file for internal review, not a website asset. The website still uses its existing production archive services, and this content factory has not changed publicly visible pages.
