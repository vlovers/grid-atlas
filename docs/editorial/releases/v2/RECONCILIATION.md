# Pinned-archive event reconciliation — execution and review contract

The read-only [script](../../../scripts/reconcile-editorial-event-leads.py) enumerates **all** source races for each of the 11 event-lead years, with exact F1DB race, circuit, driver and constructor external IDs and the result rows reporting first position. It checks the archive against the measured v2026.17.0 SHA-256 and requires an **exact asset filename** in the official checksum manifest. Hashing is streamed; candidates are deterministically ordered by round and race ID.

```sh
python3 scripts/reconcile-editorial-event-leads.py \
  --archive /tmp/grid-atlas-f1db/f1db-json-splitted.zip \
  --checksums /tmp/grid-atlas-f1db/checksums_sha256.txt \
  --output /tmp/grid-atlas-event-candidates.json
python3 -m unittest discover -s tests -p 'test_editorial_reconcile_event_leads.py'
```

The output is a **candidate report, not a verified historical claim**. A reviewer must select the right race from the year's candidates, verify the event against a specific official results page, and reconcile the subject's constructor or circuit identity. An event name is not a venue ID; a driver win is not necessarily a win for the subject constructor. The layout ID requires separate event-specific evidence. Shared-car and other result anomalies must be reviewed rather than silently resolved. Do not copy candidates into `identity_reconciliation` or approve/publish a chapter automatically.

The committed tests are synthetic. Real-archive execution remains unverified until the official ZIP and checksum manifest are available and a report is retained. No claim is made that all eleven stories are ready for publication.
