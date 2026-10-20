# Story Reader UI foundation — release boundary

The shared reader component in `apps/web/src/components/stories/` is intentionally **not mounted at any public route**. It renders only `ApprovedStory` data after a strict runtime contract check. No research manuscript is imported into the web app, and no unpublished story URLs, sitemap entries or navigation entries were added.

## Phase-1 capabilities

- Responsive six-or-more-chapter editorial rail with hash anchors.
- Source disclosures beside chapters with precise locators, publisher and HTTPS links.
- Locale-specific UK/EN labels and same-locale internal navigation to **numeric** driver/constructor/race IDs or existing year routes.
- A strict runtime gate rejecting unpublished content, unapproved revisions, missing metadata, orphan sources and slug-based invalid routes.
- No image dependencies, fabricated racing media, autoplay or licensing assumptions.

## Security / editorial boundary

**Critical:** The type `ApprovedStory` is NOT proof of an approved human publication. The caller must retrieve data from an authorized server-side publication API and verify a per-locale signed-off immutable revision and publication record before constructing this object. The runtime schema protects against accidental integration mistakes, but does **not** cryptographically verify an approval digest or authorization. Do not render drafts with status artificially changed to published. Implement the actual public story adapter and approval checks separately, with integration tests.

## Remaining work

1. Convert Senna × Prost research into atomic evidence-registered source claims and obtain independent human approvals in both locales.
2. Add a real publication-gated story API and immutable revision mapping.
3. Resolve canonical external F1DB IDs to database numeric IDs server-side.
4. Add a real route only after the gate is verified, with tests proving draft/retracted claims never leak.
5. Test keyboard and responsive behavior in Playwright in the eventual consuming route.

No public story is shipped by this component.
