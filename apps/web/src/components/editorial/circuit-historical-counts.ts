import { candidateUnnumberedHistoricalRoutes } from './circuit-candidates.ts';

/** Research observations, NEVER official FIA apex numbering. F1DB values on
 * Lap Ledger are derivative data, not independent corroboration. */
type CountObservation = {
  circuit_id: string; layout_id: string; period: string; turns: number;
  basis: 'f1db_layout_attribute' | 'page_headline' | 'principal_corners_only' | 'modern_short_course';
  source_url: string; locator: string;
  source_family: 'f1db_derivative' | 'secondary_summary' | 'circuit_history' | 'venue_official_modern';
  caveat: { en: string; uk: string };
};
export const historicalCornerCountObservations: readonly CountObservation[] = [
  { circuit_id:'dallas', layout_id:'dallas-1', period:'1984', turns:23, basis:'f1db_layout_attribute', source_url:'https://lapledger.org/circuits/dallas', locator:'F1DB layout dallas-1 / 3.901 km / 23 turns / 1984', source_family:'f1db_derivative', caveat:{en:'F1DB geometry count, not a numbered 1984 apex chart.',uk:'Кількість за геометрією F1DB, не нумерована схема апексів 1984 року.'}},
  { circuit_id:'dallas', layout_id:'dallas-1', period:'1984', turns:24, basis:'page_headline', source_url:'https://lapledger.org/circuits/dallas', locator:'Page summary / Turns 24, against F1DB 23 on same page', source_family:'secondary_summary', caveat:{en:'Same page, two different counts; not independent evidence.',uk:'На одній сторінці два різні числа; це не незалежні докази.'}},
  { circuit_id:'dallas', layout_id:'dallas-1', period:'1984', turns:12, basis:'principal_corners_only', source_url:'https://www.racingcircuits.info/north-america/usa/dallas-fair-park.html', locator:'Circuit History / 12 main corners and several chicanes', source_family:'circuit_history', caveat:{en:'Twelve MAIN corners plus chicanes, not twelve total apices.',uk:'Дванадцять ОСНОВНИХ поворотів плюс шикани, не дванадцять апексів загалом.'}},
  { circuit_id:'ain-diab', layout_id:'ain-diab-1', period:'1958', turns:18, basis:'f1db_layout_attribute', source_url:'https://lapledger.org/circuits/ain-diab', locator:'F1DB layout ain-diab-1 / 7.618 km / 18 turns / 1958', source_family:'f1db_derivative', caveat:{en:'No independently numbered 1958 diagram.',uk:'Немає незалежно перевіреної нумерованої схеми 1958 року.'}},
  { circuit_id:'ain-diab', layout_id:'ain-diab-1', period:'1958', turns:15, basis:'page_headline', source_url:'https://lapledger.org/circuits/ain-diab', locator:'Page summary / Turns 15, F1DB row says 18', source_family:'secondary_summary', caveat:{en:'Page count differs from its F1DB row.',uk:'Загальна кількість не збігається з рядком F1DB.'}},
  { circuit_id:'ain-diab', layout_id:'ain-diab-1', period:'1958', turns:11, basis:'page_headline', source_url:'https://www.f1-fansite.com/f1-circuits/ain-diab-circuit-layout-records/', locator:'Track Geometry / Corners 11, page labelled 1958', source_family:'secondary_summary', caveat:{en:'Counting convention unspecified; not period FIA evidence.',uk:'Правило підрахунку не вказане; це не доказ FIA епохи.'}},
  { circuit_id:'clermont-ferrand', layout_id:'clermont-ferrand-1', period:'1972', turns:48, basis:'f1db_layout_attribute', source_url:'https://lapledger.org/circuits/charade', locator:'F1DB clermont-ferrand-1 / 8.055 km / 48 turns / 1965–1972', source_family:'f1db_derivative', caveat:{en:'Original long F1 route, not individually numbered apices.',uk:'Первісна довга траса F1, а не окремо пронумеровані апекси.'}},
  { circuit_id:'clermont-ferrand', layout_id:'clermont-ferrand-1', period:'1972', turns:51, basis:'page_headline', source_url:'https://lapledger.org/circuits/charade', locator:'Page summary / Turns 51, same page F1DB long layout 48', source_family:'secondary_summary', caveat:{en:'Same long-layout page reports different count conventions.',uk:'На сторінці довгої конфігурації наведені різні правила підрахунку.'}},
  { circuit_id:'clermont-ferrand', layout_id:'charade-modern-1989', period:'1989–present', turns:18, basis:'modern_short_course', source_url:'https://www.charade.fr/circuit/presentation/', locator:'Présentation / 3,975 m and 18 virages; original 8,055 km shortened in 1989', source_family:'venue_official_modern', caveat:{en:'Official CURRENT circuit only; never backdate to 1972.',uk:'Офіційні дані СУЧАСНОЇ траси; не переносити на 1972 рік.'}},
  { circuit_id:'detroit', layout_id:'detroit-1', period:'1982', turns:24, basis:'f1db_layout_attribute', source_url:'https://lapledger.org/circuits/detroit', locator:'Every layout / F1DB detroit-1 / 4.168 km / 24 turns / 1982', source_family:'f1db_derivative', caveat:{en:'1982 original layout only; not verified FIA apex numbers.',uk:'Лише початкова конфігурація 1982 року; не перевірені номери FIA.'}},
  { circuit_id:'detroit', layout_id:'detroit-2', period:'1983–1988', turns:22, basis:'f1db_layout_attribute', source_url:'https://lapledger.org/circuits/detroit', locator:'F1DB detroit-2 / 4.023 km / 22 turns / 1983–1988', source_family:'f1db_derivative', caveat:{en:'Different later route; exclude from 1982 count.',uk:'Інший пізніший маршрут; виключити з підрахунку 1982 року.'}},
  { circuit_id:'detroit', layout_id:'detroit-2', period:'1983–1988', turns:17, basis:'page_headline', source_url:'https://lapledger.org/circuits/detroit', locator:'Page headline / current 4.023 km / Turns 17', source_family:'secondary_summary', caveat:{en:'Headline describes latest layout, not 1982.',uk:'Заголовок описує пізнішу конфігурацію, не 1982 рік.'}},
];
export const historicalCornerCountReviewByCircuit = candidateUnnumberedHistoricalRoutes.map(route => {
  const observations = historicalCornerCountObservations.filter(x => x.circuit_id === route.circuit_id);
  const same = observations.filter(x => x.layout_id === route.layout_id && x.period === route.period);
  const other = observations.filter(x => x.layout_id !== route.layout_id || x.period !== route.period);
  const values = [...new Set(same.map(x => x.turns))].sort((a,b) => a-b);
  return {
    circuit_id: route.circuit_id, layout_id: route.layout_id, historical_period: route.period,
    observations, same_layout_observations: same, excluded_other_era_observations: other,
    competing_same_layout_counts: values,
    count_disagreement_unresolved: values.length > 1,
    no_count_comparison_available: values.length === 0,
    independently_authenticated_numbered_map: false as const,
    per_apex_crosswalk_verified: false as const,
    media_reuse_approved: false as const,
    publication_allowed: false as const,
    review_request: values.length > 1 ? {
      en: 'Reconcile competing count conventions with a dated map for the exact historical layout. Counted chicanes are not automatically individual FIA apices; do not copy third-party maps.',
      uk: 'Зіставити різні правила підрахунку з датованою схемою точної історичної конфігурації. Шикани не стають автоматично окремими апексами FIA; не копіювати сторонні карти.',
    } : {
      en: 'Obtain a dated independently authenticated numbered map for the exact historical layout. A later layout or database count cannot justify apex numbering or media reuse.',
      uk: 'Отримати датовану незалежно перевірену нумеровану схему саме цієї історичної конфігурації. Пізніша схема чи кількість у базі не дозволяють нумерацію апексів або повторне використання медіа.',
    },
  };
});
