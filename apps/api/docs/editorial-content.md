# Editorial content: implemented read model and future design

## Implemented now

`GET /api/drivers/:id/article?locale=uk|en` reads the existing `content_*` tables, returning only published articles with reviewed, verified, supported claims. The default locale is Ukrainian; absent, withdrawn or unapproved content returns 404 without language fallback. It preserves `id`, `locale`, `slug`, `title`, `body_markdown`, `published_at` and `references`, and adds:

- `claims`: exact string ID, statement and supporting evidence (`url`, `title`, `publisher`, nullable `author`, `accessed_on`, precise `locator`).
- `sections`: neutral heading and ordered claim IDs covering each claim exactly once.

The text-only body must match linked claim statements exactly, separated only by section headings. Both publisher and public reader reject unrelated, repeated or missing claim prose. A single SQL snapshot binds approval, text and evidence. Internal reviewer metadata is never returned. Editing text, evidence or source data invalidates review through existing triggers.

The [approved release pipeline](../../../docs/editorial/APPROVED_RELEASE_PIPELINE.md) exists; it requires independent human review of each locale and explicit operator authorization. The [five-driver release](../../../docs/editorial/releases/v1/README.md) supplies no historical approvals. Career endpoints still provide no biography and must not be treated as editorial publication.

## Earlier design proposal (not an implemented revision schema)

## Revision model

Keep editorial revisions separate from `historical_*` imported facts,
`source_observations` and lineage claims. A future revision has:

| Field | Requirement |
| --- | --- |
| `id`, `revision` | Immutable revision identity and increasing version per content section |
| `entity_type`, `entity_id` | Exact existing driver or constructor identity; never resolve by display-name similarity or entrant identity |
| `locale` | Exactly `uk` or `en`; default request locale is `uk` |
| `section` | `introduction` (short text) or `biography` (long text) |
| `body` | Plain text; no raw HTML or executable markup |
| `citations` | Nonempty array of source URL, title, publisher, accessed date, locator (page/paragraph/timestamp when available) and an evidence note identifying the supported statements |
| `author` | Accountable author/researcher identifier |
| `review_status` | `draft`, `in_review`, `approved` or `rejected` |
| `reviewer`, `reviewed_at` | Required for approval; independent human reviewer distinct from the author |
| `publication_status` | `unpublished`, `published` or `withdrawn`; defaults to unpublished |
| `published_at` | Required only when publication occurs after approval of that exact revision |

No introduction is derived automatically by truncating a biography. Each section
and translation needs evidence and review. F1DB attribution for imported results
is not a citation for personal background, opinions, ownership or legal lineage.
Evidence notes must cover every factual assertion, including disputed details;
uncertainty belongs in the reviewed text. Name changes do not establish identity
continuity. This content model cannot approve or mutate lineage claims.

## Read/publication rules

1. A future public reader selects only the exact requested entity, locale and
   section, with `review_status = approved` and `publication_status = published`.
   Allow at most one current publication per tuple. Citations accompany the text.
2. Missing, draft, rejected, unreviewed, withdrawn or incompletely cited sections
   return null. A query parameter cannot opt into private review states.
3. There is no automatic cross-locale fallback or machine-generated replacement.
   An absent Ukrainian translation remains absent; English is shown only when
   English is requested. Unsupported locales are rejected.
4. Editing body, locale, identity or citations creates a new unpublished draft
   revision and invalidates approval for that new revision. Publication always
   targets a specific approved revision. Withdrawing it removes it from reads
   immediately; never silently restore an older revision.
5. Approval is a human editorial action; no importer, test fixture or API default
   can assert independent approval. Database constraints alone cannot prove the
   reviewer's independence or a source's truth.

Do not add tables, authoring endpoints, migration machinery or sample historical
prose now. The first real, cited content submission should establish exact storage
and editing needs. That implementation must test the public-reader restrictions,
citation validation, revision changes and withdrawal against PostgreSQL before it
can return non-null content. The current integration tests verify the safe empty
fallback in both supported locales without implying a publication workflow exists.
