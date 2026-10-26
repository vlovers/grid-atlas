# Editorial experience V3 — PR B

Audited visual base: `d0ec3a6`. This is a stacked PR on PR A (#297, refreshed on current main), retaining a disjoint design diff and independently runnable verification. PR A supplies discovery behavior. Current main includes the shared local media-preview lint repairs. Active biography, constructor/circuit research and media approvals remain isolated.

The existing Editorial Racing serif/sans/mono families, ivory/charcoal/burgundy surfaces, rules, gutters, focus color and semantic chart colors now cover Atlas, Explorer, Time Machine and Stories. No new typography library, font or media asset. Cormorant's licensed Ukrainian subset loads and renders correctly; Ukrainian headings retain a generous scale, relaxed tracking and a taller line height. Manrope remains the reading and control face.

- Atlas uses a tighter Dagre rank separation and shorter responsive canvas. All neighbors, visual windows, selection, evidence and pagination remain intact. Charts use the same tokens as their accessible lists.
- Time Machine retains distinct earlier/later semantics with silver and gold and explicit text. Surfaces no longer form a separate blue/mint/violet theme.
- Stories inherits editorial type, and cover text participates in layout instead of absolute positioning that can clip enlarged text. Recorded-data artwork remains labelled and no photograph is implied.
- Driver career chart answers how season result counts compare: one shared scale, exact visible numbers in a native disclosure/table, labelled keyboard links, patterns and labels in addition to color. Zero is zero. Winning/top-three result rows remain distinct from unique race wins or official starts.
- Identity metadata uses a native disclosure: the heading remains visible, fields/provenance are keyboard accessible, while core hero facts remain at the top of the dossier.
- Shared section headings use the existing reveal controller. It keeps content visible before JS and honors reduced motion and the existing pause control. No dependency or layout shifts introduced by motion.

Changed routes: EN/UK Atlas, Explorer, Time Machine, Stories index and story pages; shared dossier headings, driver chart, and identity/source panels across driver/constructor/circuit templates. No migrations, API contracts, editorial publication or image approvals change. See verification.md for executed commands, screenshots and limits.
