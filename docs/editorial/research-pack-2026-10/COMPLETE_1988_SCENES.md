# 1988 — sixteen-race bilingual scene completion

This batch fills the **13 remaining** 1988 race chapters, alongside the already documented Monaco (round 3), Italy (round 12) and Japan (round 15). It makes the internal draft structurally complete for all 16 Grands Prix; it does **not** create approved articles.

Each short UK/EN caption states only the documented race-winner sequence. Neither invented driver quotations nor causal explanations were inserted. The story rail can now be scoped around every race, but in production it must use the existing archival API and independently reviewed editorial claims. No research JSON is imported by the public web application.

## Key editorial distinctions

- Four consecutive Senna victories from Great Britain to Belgium are a directly checkable sequence of official winner rows, not an argument about psychology or championship scoring.
- Portugal and Spain form consecutive Prost winner records; neither proves broader pace or tactical motivations.
- Monaco, Italy and Japan have separate precise source registers and unresolved narrative questions.
- The final 90–87 classification is a distinct official standings observation. Do not compare it as a raw sum of imported race-result points.
- Names and links must resolve using stable imported IDs; no assumed local integer IDs, title records or team contracts.
- All seventeen source-located assertions (earlier ten plus seven pivotal-scene claims) and the thirteen sequence captions remain **not human reviewed**.

## Validator

```sh
python3 scripts/validate-1988-scene-coverage.py
python3 -m unittest discover -s tests -p 'test_editorial_1988_scene_coverage.py' -v
```

A failed check should block editorial promotion. Structural completeness is not historical review, media clearance, or publication eligibility.
