# Offline canonical race candidate reconciliation

The [reconciliation script](../../../scripts/reconcile-editorial-event-leads.py) reads the official pinned F1DB v2026.17.0 split ZIP **without modifying the database or editorial drafts**. It validates the measured ZIP digest against the official manifest, then produces a report of all races in the year named by each of the eleven event leads, including exact source race IDs, circuit external IDs, dates, rounds, and winning driver/constructor external IDs from race-result rows.

```sh
python3 scripts/reconcile-editorial-event-leads.py \\
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \\
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \\
  --output /tmp/grid-atlas-event-candidates.json
python3 -m unittest discover -s tests -p 'test_editorial_reconcile_event_leads.py'
```

**This is candidate enumeration, not automated verification.** A human or separately reviewed deterministic match must select the correct race using the official event name and evidence, then confirm that its circuit ID corresponds to the intended venue or that its winning result belongs to the intended constructor. The script intentionally never fills the research JSON's `identity_reconciliation` IDs, never marks a claim verified, and never changes publication flags. Circuit layouts require a separate event-to-layout audit.

The committed tests use synthetic race fixtures. A real pinned-archive run and its output are **not claimed** until the ZIP and manifest are supplied and execution is recorded.
