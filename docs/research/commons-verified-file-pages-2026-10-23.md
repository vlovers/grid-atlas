# Actual Wikimedia Commons media candidates — 23 October 2026

This is a **source-page research register** based on live Wikimedia Commons file-page inspection. **None is licensed/identity-cleared by a human, downloaded, assigned a canonical verified F1DB ID, or approved for publication.** This research is intentionally separate from `docs/media/candidates.json` because that strict registry requires checksum-backed canonical IDs, source revision and other evidence. Do not invent IDs or bypass its validator.

| Candidate | Subject | Source page | Page-reported author | Page-reported license | Capture context | Research decision |
| --- | --- | --- | --- | --- | --- | --- |
| mclaren-mp44-donington-2007 | constructor: mclaren | [McLaren MP4-4.jpg](https://commons.wikimedia.org/wiki/File:McLaren_MP4-4.jpg) | John Chapman (Pyrope) | CC BY-SA 3.0 | 2007-08-22, 2848x2136 | Museum display; not an archival 1988 race photo |
| mclaren-mp44-2009 | constructor: mclaren | [Mclaren MP4 4.jpg](https://commons.wikimedia.org/wiki/File:Mclaren_MP4_4.jpg) | Milner46 | CC BY-SA 3.0 | 2009-05-14, 2272x1704 | Uploader claims chassis 3; verify specific chassis attribution independently |
| lotus-97t-donington-2007 | constructor: lotus | [Lotus97T.jpg](https://commons.wikimedia.org/wiki/File:Lotus97T.jpg) | Jonnybrad2001 / jonbradbury (as attributed) | CC BY-SA 4.0 (among listed licenses) | 2007, 500x333 | Museum/event display; 1985 car photographed in 2007; derivative source chain |
| ferrari-f2004-2004 | constructor: ferrari | [Ferrari F2004.jpg](https://commons.wikimedia.org/wiki/File:Ferrari_F2004.jpg) | storem | CC BY-SA 2.0 | 2004-09-27, 1536x2048 | Original Flickr verified on Commons; exact race context not established |
| ferrari-f2004-shanghai-2014 | constructor: ferrari | [Ferrari f2004.jpg](https://commons.wikimedia.org/wiki/File:Ferrari_f2004.jpg) | emperornie | CC BY-SA 2.0 | 2014-06-08, 3929x2621 | Ferrari Racing Day display, Shanghai 2014; not a 2004 race scene |
| silverstone-venue-2019 | circuit: silverstone | [Silverstone Racing Circuit.jpg](https://commons.wikimedia.org/wiki/File:Silverstone_Racing_Circuit.jpg) | Harvey Milligan | CC BY-SA 4.0 | 2019-05-15, 4032x3024 | Venue photograph; don't imply specific historic circuit layout |
| monaco-harbour-2023 | circuit: monaco | [Monaco F1 2023.jpg](https://commons.wikimedia.org/wiki/File:Monaco_F1_2023.jpg) | Gabriel Hutchinson Photography | CC BY-SA (version confirm) | 2023-05-28, 4256x2832 | 2023 harbour view; not a historical configuration image |
| monaco-preparation-2014 | circuit: monaco | [Monaco preparing for grand prix.JPG](https://commons.wikimedia.org/wiki/File:Monaco_preparing_for_grand_prix.JPG) | Abxbay | CC BY-SA 3.0 | 2014-05-20, 1600x1200 | Venue preparation rather than racing; label context |
| monaco-grandstand-2019 | circuit: monaco | [Monaco IMG 0998.jpg](https://commons.wikimedia.org/wiki/File:Monaco_IMG_0998.jpg) | Alexander Migl | CC BY-SA 4.0 | 2019-06-02, 4522x3014 | Grandstand photograph; not necessarily the Grand Prix event date |
| monaco-1978-villeneuve | race: 1978-monaco | [Gilles Villeneuve - Monaco 1978.jpg](https://commons.wikimedia.org/wiki/File:Gilles_Villeneuve_-_Monaco_1978.jpg) | Lapin74jp | CC BY-SA 4.0 | 1978-05-06, 4256x2598 | Photo described as 1978 Monaco practice; verify exact race and car |

## Research findings

- **McLaren MP4/4:** a 2,848×2,136 photograph by John Chapman is explicitly identified as a **2007 museum display**, not a 1988 on-track photograph. A separate 2009 uploader file mentions a particular chassis; that extra detail must be independently checked.
- **Lotus 97T:** a low-resolution 500×333 photograph describes the 1985 car at a **2007 Donington event**; not a viable large hero without a better original and source-chain verification.
- **Ferrari F2004:** Commons records a 2004 Flickr photograph and a separate 2014 Shanghai event display. Do not substitute one for the other or miscaption the latter as a 2004 race image.
- **Silverstone and Monaco:** contemporary venue photos can improve circuit dossiers now, but must not be presented as historically accurate depictions of older layouts.
- **Gilles Villeneuve / Monaco 1978:** promising contemporary-era race-context photo with page-reported self-published CC BY-SA 4.0; identity, author and exact depicted moment still require human review.

## Publication gate and next action

For each selected file, a curator must open its exact file page and revision history, verify author vs uploader, derivative chain, exact license version, depicted identity/year and intended crop, and resolve all doubts. Record the exact F1DB external identity and hash using `docs/media/pilot-identities.json` process. Only **after** a human clearance, ingest bytes, compute SHA-256, create original UK/EN captions and alt text, and request independent rights/identity approval. Never mark a candidate as `verified` based on this research.

**No photo is published in this PR.** The 160 historical circuit SVGs remain on their separate attributed pipeline.
