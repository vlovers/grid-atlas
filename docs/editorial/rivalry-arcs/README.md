# Rivalry Arcs · Ten connected EN/UK reading journeys

**Status: UNPUBLISHED RESEARCH, 25 October 2026.** These are ten original rivalry-centred narratives, not ten published articles, ten approved biographies or ten independently verified claim dossiers. Each manuscript has a Quick hook, an Explore trail, three narrative acts per language (at least 200 words EN and UK), evidence links and connections. They complement — but do not replace — the [35 season stories](../season-arcs/README.md), [20 race stories](../race-arcs/README.md), [10 driver career stories](../driver-arcs/README.md) and [10 constructor outsiders](../constructor-arcs/README.md).

## The collection

**[Volume I — the rival as a measuring stick](rivalries-volume-01.en-uk.md)**

1. **Fangio and Moss (1955):** learning from the champion while trying to beat him; the two-tenths finish at Aintree.
2. **Lauda and Hunt (1976):** why a championship can involve two different decisions about acceptable risk.
3. **Mansell and Piquet (1986–87):** two Williams title ambitions, Adelaide's tyre failure and the Silverstone comeback.
4. **Senna and Prost (1988–90, 1993):** dominance, broken trust, Suzuka decisions and a later farewell.
5. **Häkkinen and Schumacher (1998–2000):** Spa's defining pass versus the season-deciding Suzuka victory.

**[Volume II — teammates, outsiders and changing pressure](rivalries-volume-02.en-uk.md)**

6. **Alonso and Räikkönen (2005):** the difference between race-winning speed and a championship campaign.
7. **Alonso and Hamilton (2007):** a rookie, a double champion, a stewards' decision and Räikkönen's one-point title.
8. **Vettel and Webber (2010–13):** Turkey, 'Multi 21' and the cost of a one-two finish.
9. **Hamilton and Rosberg (2016):** Austria's last-lap contact and Abu Dhabi's championship arithmetic.
10. **Norris, Piastri and Verstappen (2025):** three contenders, a 104-point recovery and a two-point finale.

## How readers should navigate

**The other car in your garage:** Moss–Fangio → Mansell–Piquet → Senna–Prost → Alonso–Hamilton → Vettel–Webber → Hamilton–Rosberg → Norris–Piastri. The question changes across eras: what happens when the closest rival is your teammate?

**A single great moment versus the title:** Häkkinen's Spa 2000 pass → Schumacher's Suzuka title → Räikkönen's 2005 pace → Alonso's championship → Verstappen's 2025 Abu Dhabi win → Norris' crown. Distinguish the day's hero from the year's champion.

**A result is not the whole story:** Hunt–Lauda and the risk of Fuji → Mansell–Piquet and mechanical failure → Hamilton–Rosberg and championship arithmetic. Each invites a different explanation of why the final race ended as it did.

These are **editorial trails**, not verified canonical internal URLs for driver, constructor, circuit or race records. The only URL-shaped internal links in the manuscripts point to existing bilingual season discovery routes. Resolve other subjects against pinned F1DB identities and era-appropriate entrant data before building interactive crosslinks.

## Source and publication limits

- The linked Formula 1 retrospectives and results are publisher-specific evidence, not independent multi-publisher fact checking. The 2007 Hungary document is a **reproduction of a stewards' decision**, not an FIA-hosted original; obtain the original before publication. Inferred motives, team politics and racecraft judgements must not be presented as verified facts.
- The 2025 finish is supported by the official report: **Norris 423, Verstappen 421, Piastri 410**. Verstappen's **104-point** recovery is described by Formula 1's retrospective. Piastri led the championship for **15 races**. These details need review at the exact source locators, not only automated word-count tests.
- The manuscripts are entirely text; no photos, historical recreations, broadcast footage or image licenses have been added. No editorial human approval, release or public deployment has been claimed.
- Every EN and UK act requires independent historical inspection, EN copyediting, native Ukrainian review, source semantic review and crosslink identity validation before any public reader can use it. A green CI run only verifies structure and repository consistency.

## Quality check

Run `python3 -m unittest discover -s tests -p 'test_rivalry_story_research.py' -v`. Foundation CI also runs the complete offline Python suite and documentation-link audit. This test checks distinct subjects, bilingual three-act substance, evidence references, 2025 result safeguards and absence of embedded media. It **cannot** verify that the prose accurately represents each source.

## Next editorial phase

Build source-located **claim worklists** for these ten stories (event, claim, cited passage, counter-source, EN/UK translation decision, reviewer state), prioritising disputed 1989 Suzuka decisions, the 2007 Hungary hearing and 2025 standings. Then develop an independently approved, accessible story reader with Quick / Explore / Deep Dive transitions, without bypassing the existing human approval-controlled publication workflow.
