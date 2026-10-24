# First portrait batch — editorial and rights review pack

**Status:** research and bilingual copy proposals only. **Not approved for publication.** No images, delivery paths, verified status or human review signatures are added by this document. Publication remains gated by [the imagery workflow](approved-imagery-workflow.md).

This batch prioritizes three recognizable drivers already in `candidates.json`. Captions below deliberately avoid implying that an archival portrait depicts the driver's entire career, current team or a specific race result. Descriptions are provisional and must be checked against the actual image pixels and original source before use.

| Candidate | Source page | Preliminary license in candidate register | Open verification |
| --- | --- | --- | --- |
| `ayrton-senna-commons-pilot` | [Commons file](https://commons.wikimedia.org/wiki/File:Ayrton_Senna_1989_Belgian_GP_podium_(cropped).jpg) | CC BY 2.0 | Original Flickr author and derivative/crop chain; visible podium context; credit and rights |
| `juan-manuel-fangio-commons-pilot` | [Commons file](https://commons.wikimedia.org/wiki/File:J.M._Fangio_1957.jpg) | CC BY-SA 3.0 | Original creator versus crop uploader; parent image; year/location; attribution and share-alike obligations |
| `lewis-hamilton-commons-pilot` | [Commons file](https://commons.wikimedia.org/wiki/File:Lewis_Hamilton_(27333186713).jpg) | CC BY 2.0 | Flickr provenance and exact 2016 Monaco context; credit, visible brands and rights |

## Candidate copy — Ukrainian and English

### Ayrton Senna — 1989 Belgian Grand Prix

- **UK alt (draft):** «Айртон Сенна на подіумі Гран-прі Бельгії 1989 року».
- **EN alt (draft):** “Ayrton Senna on the podium at the 1989 Belgian Grand Prix.”
- **UK caption (draft):** «Айртон Сенна на подіумі Гран-прі Бельгії 1989 року. Архівне фото; авторство та умови використання потребують остаточної перевірки».
- **EN caption (draft):** “Ayrton Senna at the 1989 Belgian Grand Prix podium. Archival photograph; creator credit and reuse terms remain under review.”
- **Verification:** Inspect the actual cropped image and its parent before finalizing whether the podium and event are visually established. Remove or revise unverified specifics. The final public caption must replace the review warning with the actual required attribution, license link and modification disclosure.

### Juan Manuel Fangio — 1957

- **UK alt (draft):** «Хуан-Мануель Фанхіо на архівному фото 1957 року».
- **EN alt (draft):** “Juan Manuel Fangio in an archival photograph from 1957.”
- **UK caption (draft):** «Хуан-Мануель Фанхіо, 1957 рік. Походження кадру та авторство ще перевіряються».
- **EN caption (draft):** “Juan Manuel Fangio, 1957. The photograph’s provenance and photographer credit are still being verified.”
- **Verification:** Resolve Carlos Alberto Navarro versus Spin2Win in the source and derivative chain. Do not credit an uploader as the photographer without evidence; do not publish while that conflict is unresolved.

### Lewis Hamilton — 2016 Monaco Grand Prix

- **UK alt (draft):** «Льюїс Гамільтон на фото, пов’язаному з Гран-прі Монако 2016 року».
- **EN alt (draft):** “Lewis Hamilton in a photograph associated with the 2016 Monaco Grand Prix.”
- **UK caption (draft):** «Льюїс Гамільтон під час вікенду Гран-прі Монако 2016 року — контекст фото потребує підтвердження».
- **EN caption (draft):** “Lewis Hamilton during the 2016 Monaco Grand Prix weekend; the photo context is pending confirmation.”
- **Verification:** Confirm the image actually shows Hamilton and the claimed weekend. Do not infer a race result or a team affiliation from the image alone.

## Human review handoff (one record per image)

For each candidate, record in a **separate reviewed publication PR**:

1. Original image and derivative file pages, creator identity, credit chain, actual license version, restrictions and source revision.
2. Image inspection: subject identity, visible scene, event/year evidence, dimensions, MIME and exact local bytes SHA-256; document all crops or other changes.
3. Final UK and EN alt/caption texts based on verified pixels and source evidence; keep the subject’s canonical F1DB external ID.
4. Explicit AI-generated decision, rights note, source links, required attribution, license and modification disclosure.
5. Independent human reviewer handle, date, rationale and matching `mediaFingerprint` **after** all metadata and bytes are frozen. Never manufacture this approval.
6. Only then add the approved local file and verified publication record together; run `pnpm audit:media`, registry validation, lint/typecheck/tests and browser checks in both locales.

**Release gate:** If any image fails identity, source-chain or license verification, leave it in the candidate lane and retain the existing data-driven hero fallback. The three drafts are not authorization to copy or hotlink photographs.
