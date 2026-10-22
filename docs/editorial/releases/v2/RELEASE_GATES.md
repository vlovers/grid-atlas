# Release gates for the 25-subject editorial cohort

The editorial workflow now checks **all manuscript inventories before downloading F1DB**. Four independent read-only audits cross-check the 25-subject research coverage, 15 drafted subjects, 30 bilingual expanded season sections, source-claim references and review/publication status. Each has a dedicated regression suite. A malformed manuscript fails the editorial job even if the underlying pinned archive remains valid.

After those fast checks, CI downloads the pinned F1DB ZIP and its published SHA-256 manifest. The historical event-candidate reconciliation then runs on the **real** race/result data and uploads a read-only candidate report. The pre-existing release preflight remains mandatory. Passing any of these checks is **structural readiness only**; it never creates editorial approval, verifies a disputed event, assigns a historical circuit layout or licenses an image.

This workflow is triggered by changes to the editorial docs, relevant validators, their tests, or the workflow itself. It is not a substitute for the repository's foundation test suite. **Both checks must pass on the current head before merge.**

## Remaining work

1. Read the CI candidate artifact and manually link the exact event to its official race result and canonical F1DB constructor/circuit identity.
2. Source additional contemporary reporting for the 11 event leads and ten short season manuscripts.
3. Obtain independent human review of each source-located claim and chapter; keep all material unpublished until then.
