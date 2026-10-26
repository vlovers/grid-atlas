# Editorial photography: acquisition and rights gate

Status: **No archival photographs approved for publication yet.** Original MotorsportArt vector graphics are illustrative, not historical evidence.

## Before a photo appears on a story page

1. Identify the *specific* original image and original uploader/rights holder; record its stable source page and creator. A search result or social-media repost is not a license.
2. Verify a usable license for this particular file (for example CC BY 4.0, CC BY-SA 4.0, or documented public domain). Check commercial reuse, attribution, share-alike, and modification obligations. **Do not assume all Wikimedia Commons files have the same license.**
3. Save the original source URL, creator, license name and URL, access date, and modification history in this document. Keep proof of license where appropriate.
4. Download a properly sized derivative to `apps/web/public/media/editorial/` only after rights review; optimize dimensions/bytes, preserve aspect ratio, and remove unnecessary metadata.
5. Add the image to `editorialPhotos` in `apps/web/src/components/stories/editorial-media.ts` with accurate EN/UK alt text and captions. Caption must not imply the image depicts the actual race unless that is verified.
6. Confirm image loads in local build, appears in both locales, has readable attribution, and does not shift layout. Respect copyright and personality rights where applicable.
7. Editorial sign-off: verify historical context and rights independently. Do not publish an unverified manuscript or photo as an approved story.

## Intake ledger

| Story slug | Image subject | Source and creator | License and verification | Status |
| --- | --- | --- | --- | --- |
| lauda-hunt-1976 | Lauda / Hunt, 1976 | — | — | Needed |
| senna-prost-1988-89 | Senna / Prost, 1988–89 | — | — | Needed |
| villeneuve-arnoux-1979 | Dijon 1979 duel | — | — | Needed |
| vettel-monza-2008 | Toro Rosso, Monza 2008 | — | — | Needed |
| button-canada-2011 | Canadian GP 2011 | — | — | Needed |
| perez-sakhir-2020 | Sakhir GP 2020 | — | — | Needed |
| kubica-bmw-2008 | BMW Sauber, Canada 2008 | — | — | Needed |
| schumacher-ferrari-1996-2000 | Ferrari era 1996–2000 | — | — | Needed |
| massa-2008 | Brazilian GP 2008 | — | — | Needed |
| brawn-2009 | Brawn GP, 2009 | — | — | Needed |

**Do not** copy photographs from F1/FIA/team websites, image search, Pinterest, or Getty without appropriate reuse permission. Their visibility on the web does not grant redistribution rights.

## Identified candidate photographs (26 October 2026)

These are **source-page and license checks, not yet imported assets**. Do not flip registry entries until a local optimized image has been committed and visually verified.

### Vettel at Monza, 2008

- Wikimedia Commons file: https://commons.wikimedia.org/wiki/File:Vettel_Monza_2008.jpg
- Photographer: Jane Belinda Smith (Flickr origin, photograph taken 14 September 2008).
- Depicts Sebastian Vettel at Monza in 2008, in the Toro Rosso era.
- License: Creative Commons Attribution 2.0 Generic — https://creativecommons.org/licenses/by/2.0/
- Commons reports Flickr-license review by File Upload Bot on 3 October 2008.
- Intended slug: `vettel-monza-2008`.
- EN caption: “Sebastian Vettel at Monza, September 2008.” UK: “Себастьян Феттель у Монці, вересень 2008 року.”
- Attribution when displayed: “Jane Belinda Smith / CC BY 2.0 / cropped and resized for cover” (update modifications to reflect actual processing).
- Status: **candidate verified at source; local asset not yet added**.

### Brawn GP at Abu Dhabi, 2009

- Wikimedia Commons file: https://commons.wikimedia.org/wiki/File:Jenson_Button_(Brawn_BGP_001)_on_Sunday_at_2009_Abu_Dhabi_Grand_Prix.jpg
- Photographer: Yuriy Lapitskiy (own work; 1 November 2009).
- Depicts Jenson Button driving the Brawn BGP 001 at the Abu Dhabi GP, **not the Australian season opener**.
- License: Creative Commons Attribution-ShareAlike 3.0 Unported — https://creativecommons.org/licenses/by-sa/3.0/
- Intended slug: `brawn-2009`.
- EN caption: “Jenson Button in the Brawn BGP 001, Abu Dhabi Grand Prix, 2009.” UK: “Дженсон Баттон за кермом Brawn BGP 001, Гран-прі Абу-Дабі 2009 року.”
- Attribution when displayed: “Yuriy Lapitskiy / CC BY-SA 3.0 / cropped and resized for cover” (update modifications to reflect actual processing). Any adaptations must comply with share-alike.
- Status: **candidate verified at source; local asset not yet added**.

## Technical intake requirements

The local-only registry deliberately refuses remote URLs. Do not hotlink Commons thumbnails: they can change and are not reliable permanent production assets. The next publishing commit must include the actual optimized image bytes under `apps/web/public/media/editorial/` together with the matching registry entry; a metadata-only entry is not a completed photo integration.

For the Brawn photograph, avoid claiming a specific weekday in captions: the source contains inconsistent language versions of the weekday. The year, race, car and photographer are documented.
