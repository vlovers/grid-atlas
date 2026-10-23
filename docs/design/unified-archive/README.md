# Unified archive experience and media foundation

Base: main `c30d657`. This is the visual/media batch paired with reliability
PR [#222](https://github.com/vlovers/grid-atlas/pull/222). Each branch targets main
independently. Both use the same genuine pinned F1DB import for acceptance.

## Routes and design

The existing Editorial Racing tokens, serif/sans/mono typography, hero,
statistics, tabs, section headings and source attribution now cover:

- `/uk|en/drivers`, `/constructors`, `/circuits`: shared editorial covers,
  streamed canonical discovery cards, and one consistent searchable/paginated
  index. Driver previews reuse recorded-season signatures. Constructor cards
  link the first/latest recorded seasons. Empty/search states retain the complete
  index behavior. Failed optional discovery does not remove the searchable index.
- `/uk|en/seasons`: existing interactive decade browser plus a complete static
  decade index, so every recorded season remains linkable with or without JS.
- `/uk|en/seasons/:year`: calendar cover, imported-field statistics, section
  navigation and reading guidance. Source championship classifications remain
  separate from race-result sums.
- `/uk|en/circuits/:id`: historical-event cover and statistics, source-backed
  layout experience moved ahead of ancillary history, consistent editorial
  colors/typography, and readable section links. Existing exact race/layout
  associations, SVG bytes/attribution and controls remain intact.
- `/uk|en/races/:id`: classification cover, recorded participants, season/circuit
  connections and accessible reading guidance. The cover does not infer a
  starting grid or reproduce a race narrative.

Driver and constructor dossiers were already redesigned in main. They are
retained, tested alongside the other templates, and share the improved header,
statistic wrapping, archive-journey styling and media presentation.

The cover plates show actual linked archive records. They are typography/data,
not documentary artwork. The old blue circuit panels and mint journey cards now
use the existing warm Editorial Racing tokens. No second theme, font package,
motion dependency or car/driver reconstruction is introduced.

## Editorial patterns

`RecordReadingNote` reuses the native `RecordDetail` disclosure for brief UK/EN
guidance: how to read a classification, why championship points differ from raw
race points, and why a circuit configuration must be associated with its year.
Existing career turning points, constructor evolution, race evidence and circuit
transformations remain linked. These are explanations of archive records, not
unreviewed historical biography, rivalry or race storytelling. Authored historical
claims continue through the existing source/independent-review publication gate.

## Media

The [Media Library V1 provenance extension](../../media/library-v1-foundation.md)
adds historical context and explicit AI provenance to the existing strict registry.
They are review-bound and publication-required. The three-era Commons pilot
remains research: Senna/Hamilton CC BY 2.0 chains need original-source and human
review; Fangio's CC BY-SA 3.0 crop/public-domain parent conflict is unresolved.
No new real photo, AI reconstruction or independent approval is published.
The 160 existing F1DB/Jules Roy SVGs retain their separate provenance lane.

## Accessibility and verification

New browser acceptance checks all nine templates in UK/EN, Chromium desktop,
mobile and WebKit. It covers canonical discovery links, keyboard decade controls,
complete static year links, 320px reflow at 200% text, forced colors, reduced motion,
one h1, valid section anchors and no remote requests or browser errors.
Tests found two concrete issues: a fixed-width wordmark and a long Ukrainian
statistic label. Both now wrap without clipping or weakening the assertions.

`playwright.unified.config.ts` reuses the real PostgreSQL/production-web fixture
harness and adds a separate WebKit acceptance job. The established full browser
suite remains enabled. Screenshots and final executed results are listed in
the accompanying verification report.

No merge or external deployment is part of this batch. Rights review, researched
biographies, the previously observed intermittent circuit hydration event and
the operational launch gates remain explicit follow-ups.
