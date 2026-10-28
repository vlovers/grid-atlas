/**
 * Supplemental contextual references for seven existing public circuit summaries.
 * They narrow the review queue; they are NOT independent editorial approval.
 * Primary results records and all longform publication gates remain unchanged.
 */
export type CircuitContextEvidence = { url: string; scope: { en: string; uk: string } };

export const circuitContextEvidence: Readonly<Record<string, CircuitContextEvidence>> = {
  'estoril': { url: 'https://www.formula1.com/en/latest/article/he-obliterated-the-opposition-remembering-sennas-first-f1-win.1nwtFllIepudRwA7iesUaj', scope: { en: "The account describes the wet conditions and Senna’s first victory in 1985.", uk: "Матеріал описує дощові умови та першу перемогу Сенни 1985 року." } },
  'marina-bay': { url: 'https://www.formula1.com/en/latest/article/moments-in-time-the-singapore-grand-prix.EkbLahNFlbNLF23He5jwU', scope: { en: "The retrospective discusses the first night race and the later 2008 crash investigation.", uk: "Огляд описує першу нічну гонку та подальше розслідування аварії 2008 року." } },
  'adelaide': { url: 'https://www.formula1.com/en/latest/article/from-mansells-tyre-failure-to-leclercs-loss-of-power-8-reliability-moments-that-proved-pivotal-in-a-title-battle.6etiGRgHPVuAjoWfKLL4Cx.6etiGRgHPVuAjoWfKLL4Cx', scope: { en: "The retrospective recounts Mansell’s tyre failure and Prost’s 1986 title.", uk: "Огляд розповідає про пошкодження шини Менселла та титул Проста 1986 року." } },
  'zolder': { url: 'https://www.formula1.com/en/latest/article/5-reasons-f1-fans-are-still-in-awe-of-the-legendary-gilles-villeneuve.6Dvc1Wh0NMPqZNqBIwIZHU', scope: { en: "The retrospective describes Villeneuve’s fatal qualifying accident in 1982.", uk: "Огляд описує смертельну аварію Вільнева у кваліфікації 1982 року." } },
  'aida': { url: 'https://www.formula1.com/en/results/1994/races/606/pacific/qualifying', scope: { en: "The qualifying record confirms Senna and Schumacher’s starting order, not the race incident.", uk: "Протокол кваліфікації підтверджує порядок Сенни й Шумахера, але не обставини стартової аварії." } },
  'rouen': { url: 'https://www.formula1.com/en/latest/article/a-history-of-the-french-gp-in-7-circuits.4jWYb4usZay2AK6geWksCo', scope: { en: "The Rouen section records Schlesser’s death in 1968, not every detail of the narrative.", uk: "Розділ про Руан згадує загибель Шлессера 1968 року, але не підтверджує кожну деталь оповіді." } },
  'montjuic': { url: 'https://www.formula1.com/en/latest/article/from-pedralbes-to-catalunya-a-short-history-of-the-5-venues-to-have-hosted.3VMs6iFXohT6vY7cLAGfgF', scope: { en: "The Montjuïc section covers the fatal 1975 accident and the end of F1 racing there.", uk: "Розділ про Монжуїк описує смертельну аварію 1975 року та завершення перегонів Ф1 на цій трасі." } },
};

export function getCircuitContextEvidence(circuitId: string): CircuitContextEvidence | undefined {
  return circuitContextEvidence[circuitId];
}
