# Circuit research batch: machine-readable preflight

The 2021 research dossier is in `docs/editorial/research/circuit-2021-technical-facts-batch.md`. The companion `circuit-2021-candidates.json` normalizes **16 venues × two measurements** into 16 source-located candidate records (32 factual measurements), without inventing F1DB internal keys or historical layout version names.

**Safe preflight:**

```sh
python3 scripts/audit_circuit_research.py
python3 -m unittest tests/test_circuit_research_audit.py
```

The CI Foundation workflow discovers the latter automatically. Every row is explicitly `needs_review`, `unpublished`, without a reviewer, authoritative ID, independently corroborated geometry, image license or publish authorization. Passing validation confirms internal consistency **only**. It does not prove the external F1 webpage still shows these values.

**Next (blocked on evidence):** Verify each value against official documents for the specified event year; identify exact imported race/circuit IDs in the pinned F1DB archive; determine independently supported `layout_version` for length claims; collect precise FIA source locations for disputed changes; name a human editor to review. Only afterward create records under the strict `packages/historical-facts/validate.py` contract and handle conflicting claims. No database insertion or public route consumption is performed.

A scheduled number of laps is *not* the actual completed distance (especially Belgium 2021). Modern circuit drawings should not be recycled for historic layouts. The 2020/2021 Yas Marina and 2021/2026 Qatar length differences in the dossier need careful event- and revision-specific verification.
