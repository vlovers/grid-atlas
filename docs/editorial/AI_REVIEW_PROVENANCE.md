# Editorial review provenance — schema groundwork

Migration `0012_editorial_review_provenance.sql` adds explicit `content_articles.review_method` and an optional SHA-256 revision digest.

- Existing articles retain `review_method = 'human'` for backward compatibility. **This default describes the legacy workflow; it is not independent proof of a real human review.** The existing approval and publication gates remain unchanged.
- `review_method = 'ai'` is allowed for **draft/in-review/withdrawn** content, but the database explicitly prohibits `status = 'published'` on that lane.
- Changing either the review method or revision digest invalidates article approval and returns it to draft.
- The digest is a provenance pointer, not a signature or independent source validation.

## Next release gate — not yet implemented

Before allowing AI-reviewed public content, implement a separate authenticated importer, immutable exact-revision review record, source-locator rechecks, bilingual parity checks, evidence/rights audit, revision invalidation, and explicit operator approval. Then introduce an intentional forward migration to enable the AI lane. Never bypass this migration's constraint, falsify human signoff, or use the existing `approved_text_only` importer to publish AI-reviewed drafts.

The current public API only serves the existing reviewed article lane. This change alone **does not publish any content**.
