# @grid-atlas/editorial-policy

Deterministic, provider-neutral publication policy for Grid Atlas editorial content. Pure TypeScript with no I/O; it runs directly under Node 24 type stripping.

```ts
import { evaluatePublication, assertPublishable } from '@grid-atlas/editorial-policy';
const decision = evaluatePublication(item, context); // PASS | PENDING_TECHNICAL | FAIL | UNVERIFIABLE
```

- `model.ts` — content items, claims, evidence, source snapshots, verification, decisions.
- `canonical.ts` — canonical JSON and the digests reviews and receipts bind to.
- `gates.ts` — schema, factual, source, independence, editorial, localization, media and technical gates.
- `policy.ts` — risk tiers, the decision function, and `assertPublishable`, which re-derives the decision and rejects any supplied decision that differs.

Agent-written labels and confidence values never produce a PASS on their own. See [the architecture](../../docs/editorial/autonomous-pipeline/README.md) and `tests/editorial-policy-gates.test.mjs`.
