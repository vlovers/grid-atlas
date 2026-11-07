# Four historic FIA turn guides — 2 November 2026

**Status: candidate UI data only. No independent editorial approval, production publication, merge, or image-rights clearance.**

This increment updates the existing PR #395 **directly in** `apps/web/src/components/editorial/circuit-corners-v3.json`, rather than creating another disconnected research bundle. It adds 67 individual numbered EN/UK sections, four bilingual circuit biographies and eight dated bilingual moments to `circuit-narratives-v3.json`.

| F1DB circuit ID | Exact SVG layout | FIA/F1 event year | Numbered turns | Map |
| --- | --- | --- | ---: | --- |
| `buddh` | `buddh-1` | 2013 | 16 | [FIA 2013 Indian GP circuit](https://www.fia.com/sites/default/files/external_archive/node3786/16-india-circuit-print.pdf) |
| `yeongam` | `yeongam-1` | 2013 | 18 | [FIA 2013 Korean GP circuit](https://www.fia.com/sites/default/files/external_archive/node3784/14-korea-circuit-print.pdf) |
| `sepang` | `sepang-1` | 2017 | 15 | [FIA 2017 Malaysian GP preview and circuit](https://www.fia.com/sites/default/files/2017_malaysian_preview_1.pdf) |
| `sirius` (Sochi) | `sirius-1` | 2021 | 18 | [FIA 2021 Russian GP circuit](https://www.fia.com/sites/default/files/decision-document/2021%20Russian%20Grand%20Prix%20-%20Circuit%20Map.pdf) |

## Source boundaries

- FIA event maps establish **corner numbers for the dated event only**. FIA previews provide specific track changes, DRS positions and the historical technical context. Official F1 race reports/classifications are cited for results and story moments.
- No established individual *proper names* for these 67 corners were independently confirmed from the cited maps. Thus `name: null` is intentional; every turn has an individual, original EN/UK description. This is a **numbered turn guide**, not a falsely labelled list of official names. In particular, the **Vitaly Petrov** label in the Sochi F1 venue guide identifies the *Turn 2 grandstand*, not an independently verified official corner name. The long Turn 3 is described geometrically, not renamed.
- The 2013 Korean pit exit, raised kerbs and verges are year-scoped. Sepang's 2017 circuit map is not evidence that every earlier season used identical operational arrangements. Buddh's 2013 Turn 10 description follows the FIA preview; its multi-apex arc is not split into invented proper names.
- The `sirius` ID is the **F1DB archive identifier for Sochi**, not a different Russian Grand Prix circuit. No modern replacement venue is implied.
- **No FIA/F1 maps or photographs have been copied, traced or embedded.** External URLs are citations, not reuse licences. The existing F1DB outline SVGs retain their manifest attribution to Jules Roy and CC-BY-4.0; that licence does not cover FIA maps, F1 photography or F1 editorial prose.
- No numbered overlay anchors were created. `layout_id` is an identity binding, not proof of pixel-accurate turn positions. All entries remain `independent_review_pending` and subject to the existing `circuit-release.ts` gate.

## Verification

`tests/circuit-four-2013-2021-fia-67-numbered-turns.test.mjs` checks source keys, contiguous numbers, 67 distinct bilingual entries, correct F1DB layout IDs, pending review and no unreviewed overlays. `tests/circuit-four-2013-2021-fia-bilingual-stories.test.mjs` covers the four biographies and eight dated race moments.

The source comparison and JSON structural checks do **not** substitute for independent factual review, running the complete web/API/browser suite, or a successful CI result on the final head. The publication gate must remain closed.
