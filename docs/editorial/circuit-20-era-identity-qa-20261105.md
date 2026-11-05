# Twenty-circuit era-identity QA handoff — 2026-11-05

**Scope:** read-only cross-check of 20 research entries in [PR #411](https://github.com/vlovers/grid-atlas/pull/411), exact commit `de70e10e227dbda33b9537f0dbb31ccdc468700b`, against pinned F1DB v2026.17.0 identifiers. Baseline `main` `392683c3af21587a858f2e1933ad1a20b81e79e2`. This is a review worklist, **not** independent historical validation, media approval, geometry reconstruction, or a public article. No source documents were independently authenticated during this pass. Research files are not merged into main.

**Publication controls:** `human_approval=false`; `publication_allowed=false`. 20 circuit entries, 20 SVG proposals, 6 photo candidates; 0 approved images, 0 independent rights clearances. The recorded circuit/layout/race bindings are archival identity assertions only. Do not infer numbered corners, survey-grade outlines, contemporary track features, or an F1-event photograph from them.

| # | F1DB circuit ID | Reference race year | Archive layout ID | Media evidence | Specific review before publication |
| ---: | --- | ---: | --- | --- | --- |
| 1 | `monaco` | 2022 | `monaco-6` | photo 2022 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: venue and capture year are not F1 event evidence |
| 2 | `silverstone` | 2019 | `silverstone-8` | photo 2019 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: venue and capture year are not F1 event evidence |
| 3 | `monza` | 2025 | `monza-7` | SVG only | Confirm event-year layout against dated race evidence; identifier alone is not period geometry |
| 4 | `suzuka` | 2018 | `suzuka-2` | photo 2018 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: Capture2018-08-26 is venue context, not evidence of the2018 F1 race or numbered geometry. |
| 5 | `spa-francorchamps` | 2025 | `spa-francorchamps-4` | photo 2005 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: Photo dated2005; selected2025 layout must not be inferred from this image. |
| 6 | `interlagos` | 2025 | `interlagos-2` | SVG only | Confirm event-year layout against dated race evidence; identifier alone is not period geometry |
| 7 | `montreal` | 2017 | `montreal-6` | photo 2017 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: venue and capture year are not F1 event evidence |
| 8 | `bahrain` | 2025 | `bahrain-1` | photo 2021 | Confirm event-year layout against dated race evidence; identifier alone is not period geometry; photo: Creator field United Autosports conflicts with EXIF Author/Copyright JEP; context is2021 WEC, not2025 F1. |
| 9 | `brands-hatch` | 1986 | `brands-hatch-2` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 10 | `donington` | 1993 | `donington-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 11 | `bugatti` | 1967 | `bugatti-1` | SVG only | Resolve event-vs-layout turns and length conflict before period claims |
| 12 | `mont-tremblant` | 1968 | `mont-tremblant-1` | SVG only | Find 1968/1970 period plan; 2001 comparison is not evidence |
| 13 | `aida` | 1995 | `aida-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 14 | `ain-diab` | 1958 | `ain-diab-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 15 | `clermont-ferrand` | 1972 | `clermont-ferrand-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 16 | `dallas` | 1984 | `dallas-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 17 | `detroit` | 1982 | `detroit-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 18 | `pescara` | 1957 | `pescara-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 19 | `porto` | 1960 | `porto-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |
| 20 | `sebring` | 1959 | `sebring-1` | SVG only | Find a dated period race plan, distinguish event course from later outline |

## Required evidence and QA workflow

1. **Archive identity:** independently check the exact race ID, year, circuit ID and layout ID against the pinned release, retaining raw event/layout discrepancies; never overwrite one observation with another.
2. **Period geometry:** use a dated race programme, contemporary organizer/FIA circuit plan or independently reliable period report for that year; a modern plan or archive SVG does not prove historical corner positions or numbering. Mark unavailable evidence as unavailable.
3. **Photo context:** the six photos are *venue-only candidates*. Inspect exact Commons file-page revision, original author/EXIF conflicts, capture date and rights chain independently. Never claim a photo shows the selected Grand Prix merely because the year matches.
4. **Bilingual review:** review EN and UK captions separately for implied geometry, era, event, licensing, and confidence. A translated assertion is not independent corroboration.
5. **Application safety:** verify no candidate URL, caption or research note appears in production HTML, RSC payload, client bundles or metadata. The isolated loopback preview in PR #411 is not a public production route.
6. **Revocation:** test withdrawal, stale fingerprint and incorrect circuit/race/layout context with memory-only synthetic approvals; never write synthetic approvals to `publication.json`.
7. **Human handoff:** capture dated primary/independent evidence and an explicit reviewer decision for each claim and each media asset. Keep all publication switches false until actual authorized approval.

## Known conflicts from the source observations (not independently resolved)

- **Bugatti 1967:** event record 8 turns / 4.422 km versus layout attribute 14 turns / 4.185 km. These must remain separate claims.
- **Mont-Tremblant 1968:** a 2001 comparison cannot establish 1968/1970 geometry.
- **Spa-Francorchamps:** photo captured in 2005, selected archive layout is 2025; not proof of the 2025 event.
- **Suzuka:** 2018-08-26 venue photo is not proof of the 2018 F1 race or numbered turns.
- **Bahrain:** source creator United Autosports conflicts with EXIF author/copyright JEP; photo is 2021 WEC context, not 2025 F1.

**Provenance:** [research intake](https://github.com/vlovers/grid-atlas/blob/de70e10e227dbda33b9537f0dbb31ccdc468700b/docs/media/circuit-intake-410/intake.json), [source observations](https://github.com/vlovers/grid-atlas/blob/de70e10e227dbda33b9537f0dbb31ccdc468700b/docs/media/circuit-intake-410/source-observations.json), [20-circuit report](https://github.com/vlovers/grid-atlas/blob/de70e10e227dbda33b9537f0dbb31ccdc468700b/docs/media/circuit-intake-410/REPORT.md). No additional source licenses or permissions are asserted here.

## Bilingual claim-review queue — 20 event-specific acceptance questions

These are **questions to verify**, not validated facts or publication-ready captions. The English and Ukrainian questions intentionally retain the same evidence boundaries. A reviewer must record the dated primary source, exact document locator, independently corroborating source where available, and a decision for **each** row; no question below confers permission to publish or authenticates geometry.

| F1DB circuit | Evidence blocker tags | English: question to resolve | Українською: питання для перевірки |
| --- | --- | --- | --- |
| `monaco` | `period-map;photo-event` | Find the 2022 official event map and compare the course version; an image dated 2022 is not proof of race-day capture. | Знайти офіційну схему етапу 2022 року й звірити версію конфігурації; дата фото 2022 року не доводить зйомку під час Гран-прі. |
| `silverstone` | `period-map;photo-event` | Identify the official 2019 Grand Prix circuit diagram and separately establish the photograph's actual event context. | Встановити офіційну схему Гран-прі 2019 року й окремо перевірити, яку саме подію показує фото. |
| `monza` | `period-map` | Verify the 2025 race's configuration from event-specific documentation, not the archive layout ID alone. | Звірити конфігурацію гонки 2025 року за документами конкретного етапу, а не лише за ID в архіві. |
| `suzuka` | `period-map;photo-event` | Find an event-dated 2018 course reference; the 26 August venue photo does not establish the Formula 1 race or numbered turns. | Знайти схему траси, датовану етапом 2018 року; фото від 26 серпня не доводить зйомку Формули-1 чи нумерацію поворотів. |
| `spa-francorchamps` | `period-map;photo-era` | Compare the 2025 event course with its own official source; keep the 2005 photograph explicitly outside 2025 event evidence. | Звірити конфігурацію етапу 2025 року з офіційним джерелом; фото 2005 року не використовувати як доказ події 2025-го. |
| `interlagos` | `period-map` | Check the 2025 event-specific circuit description before attributing any corner geometry to the archive outline. | Перевірити опис конфігурації етапу 2025 року, перш ніж пов'язувати геометрію поворотів з архівним контуром. |
| `montreal` | `period-map;photo-event` | Locate the 2017 event course documentation; verify the photograph's venue and capture context separately. | Знайти документацію конфігурації етапу 2017 року; окремо перевірити місце й контекст зйомки фото. |
| `bahrain` | `creator-conflict;photo-event;period-map` | Reconcile United Autosports versus JEP attribution at the exact file revision; the 2021 WEC image cannot represent the 2025 F1 race. | Уточнити розбіжність авторства United Autosports і JEP для точної ревізії файлу; знімок WEC 2021 року не представляє гонку Ф1 2025-го. |
| `brands-hatch` | `period-map;variant` | Seek the 1986 Grand Prix programme or organizer's period map and confirm which course variant was used. | Знайти програму Гран-прі 1986 року або схему організатора того часу та підтвердити варіант траси. |
| `donington` | `period-map;variant` | Find the 1993 European Grand Prix event plan and distinguish its race course from modern Donington diagrams. | Знайти схему Гран-прі Європи 1993 року й відрізнити конфігурацію гонки від сучасних схем Донінгтона. |
| `bugatti` | `metadata-conflict;period-map` | Resolve the 1967 event 8-turn/4.422-km record against the 14-turn/4.185-km layout attribute without silently choosing either. | З'ясувати суперечність між записом гонки 1967 року (8 поворотів, 4,422 км) і атрибутом конфігурації (14 поворотів, 4,185 км), не підміняючи один запис іншим. |
| `mont-tremblant` | `period-map;anachronism` | Obtain 1968 and 1970 period maps independently; a 2001 comparison must not authenticate either historical race layout. | Окремо знайти схеми 1968 та 1970 років; порівняння 2001 року не підтверджує жодну історичну конфігурацію. |
| `aida` | `period-map;turn-numbers` | Confirm the 1995 Pacific Grand Prix course with a contemporary event map before asserting named or numbered corners. | Підтвердити конфігурацію Гран-прі Тихого океану 1995 року за схемою того часу до згадок про назви чи номери поворотів. |
| `ain-diab` | `period-map;turn-numbers` | Find a 1958 Moroccan Grand Prix route plan and document whether corner names or numbering existed in that source. | Знайти план маршруту Гран-прі Марокко 1958 року й зафіксувати, чи містить джерело назви або нумерацію поворотів. |
| `clermont-ferrand` | `period-map;variant` | Locate the 1972 French Grand Prix course map; distinguish period road-course geometry from later venue changes. | Знайти схему Гран-прі Франції 1972 року; відокремити тодішню геометрію дорожньої траси від пізніших змін. |
| `dallas` | `period-map;street-course` | Check the 1984 Grand Prix street-course plan; avoid inferring precise bends from later city maps. | Перевірити план міської траси Гран-прі 1984 року; не виводити точні повороти з пізніших мап міста. |
| `detroit` | `period-map;street-course` | Confirm the 1982 Grand Prix street-course variant using a period plan, not a later Detroit layout. | Підтвердити варіант міської траси Гран-прі 1982 року за планом того часу, а не за пізнішою конфігурацією Детройта. |
| `pescara` | `period-map;road-course` | Find a 1957 Grand Prix route plan and corroborate its road-course identity before introducing individual corner claims. | Знайти план маршруту Гран-прі 1957 року й підтвердити історичну трасу до опису окремих поворотів. |
| `porto` | `period-map;street-course` | Locate the 1960 Portuguese Grand Prix route and distinguish it from other Porto street-racing configurations. | Знайти маршрут Гран-прі Португалії 1960 року й відрізнити його від інших міських конфігурацій Порту. |
| `sebring` | `period-map;variant` | Check the 1959 United States Grand Prix event layout against a period course plan; do not substitute a later endurance-race map. | Звірити конфігурацію Гран-прі США 1959 року зі схемою того часу; не підміняти її пізнішою схемою перегонів на витривалість. |

**Decision record required per row:** `source_document`, `event_year`, `document_date`, `exact_locator`, `claim_supported_or_disputed`, `independent_corroboration_or_unavailable`, `reviewer`, `review_date`, `EN_review`, `UK_review`. Until that evidence exists, treat every question as **unresolved**. These tags are editorial triage, not factual classifications of the venue.
