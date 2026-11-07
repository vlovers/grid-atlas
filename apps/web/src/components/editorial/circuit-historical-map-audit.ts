import { dallas1984MagazineMapLeads, dallas1984DirectionDispute } from './circuit-dallas-1984-source-audit.ts';
import { candidateUnnumberedHistoricalRoutes } from './circuit-candidates.ts';

/** Comparison key, deliberately NOT a navigable URL or an evidence locator.
 * Keep original URLs/locators in the observations. Unknown query parameters,
 * including repeated/empty selectors, can select different documents.
 * This key is only a de-duplication aid, not independent authentication.
 */
export function canonicalHistoricalMapSourcePage(rawUrl: string): string {
  const url = new URL(rawUrl);
  // Provenance references must not accept an insecure or credential-bearing
  // variant of a trusted publisher URL as the same authenticated document.
  if (url.protocol !== 'https:' || url.username || url.password || url.port) {
    throw new Error('Historical map source must be an HTTPS URL without credentials or a custom port');
  }
  const bareHost = url.hostname.toLowerCase().replace(/^www\./, '');
  // Only these audited publishers have established www/slash aliases here.
  const knownAliases = ['lapledger.org', 'gdecarli.it'].includes(bareHost);
  const host = knownAliases ? bareHost : url.hostname.toLowerCase();
  const path = knownAliases ? url.pathname.replace(/\/+$/, '') || '/' : url.pathname;
  const archive = host === 'gdecarli.it' && path.startsWith('/php2/');
  const selectors = [...url.searchParams.entries()].filter(([key, value]) => {
    if (/^utm_/i.test(key) || ['fbclid', 'gclid', 'dclid', 'msclkid'].includes(key)) return false;
    if (host === 'lapledger.org' && key === 'source' && value === 'f1db') return false;
    // The existing GdeCarli catalogue uses empty var fields as omitted filters.
    if (archive && /^var[1-5]$/.test(key) && value === '') return false;
    return true;
  });
  // Only the known, distinct archive selectors have order-insensitive semantics.
  // Repeated selectors retain their order; unknown selectors are never discarded.
  if (archive && selectors.every(([key]) => /^var[1-5]$/.test(key)) &&
      new Set(selectors.map(([key]) => key)).size === selectors.length) {
    selectors.sort(([left], [right]) => left.localeCompare(right));
  }
  const query = new URLSearchParams(selectors).toString();
  return host + path + (query ? '?' + query : '');
}

/** References to inspect, never copies of third-party artwork or approval receipts.
 * A modern venue page and a Formula 1 classification cannot establish 1950s–1980s apex numbers.
 */
export const historicalMapReferenceAudit = [
  {
    circuit_id: "ain-diab", layout_id: "ain-diab-1", period: "1958",
    source_url: "https://www.motorsportmagazine.com/archive/article/november-1958/14/grand-prix-du-maroc-2/", source_role: "contemporary_race_report",
    source_published_year: 1958,
    recorded_asset_license: null,
    limitation: { en: "The contemporary race report provides event context, not a numbered apex chart.", uk: "Репортаж тієї епохи описує перегони, а не нумеровану схему апексів." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "ain-diab", layout_id: "ain-diab-1", period: "1958",
    source_url: "https://www.formula1.com/en/results/1958/races/168/morocco/race-result", source_role: "official_race_result_not_geometry",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "Official classification confirms the race, not the number or location of bends.", uk: "Офіційна класифікація підтверджує перегони, а не кількість чи місце поворотів." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "clermont-ferrand", layout_id: "clermont-ferrand-1", period: "1972",
    source_url: "https://www.racingcircuits.info/europe/france/charade.html", source_role: "retrospective_layout_reference",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "Historic long-course drawing is not an authenticated numbered 1972 FIA map; link only.", uk: "Історична схема довгої траси не є перевіреною нумерованою картою FIA 1972 року; лише посилання." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "clermont-ferrand", layout_id: "clermont-ferrand-1", period: "1972",
    source_url: "https://www.charade.fr/circuit/presentation/", source_role: "official_modern_venue_not_period_map",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "The venue's modern 18-turn short course cannot number the 8.055-km 1972 route.", uk: "Сучасна коротка траса з 18 поворотами не визначає нумерацію маршруту 1972 року завдовжки 8,055 км." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "dallas", layout_id: "dallas-1", period: "1984",
    source_url: "https://www.racingcircuits.info/north-america/usa/dallas-fair-park.html", source_role: "retrospective_layout_reference",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "Twelve main corners plus chicanes is a counting convention, not an FIA 1984 apex chart.", uk: "Дванадцять основних поворотів і шикани — правило підрахунку, не карта апексів FIA 1984 року." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "dallas", layout_id: "dallas-1", period: "1984",
    source_url: "https://www.formula1.com/en/results/1984/races/474/dallas/race-result", source_role: "official_race_result_not_geometry",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "The official race result cannot locate the fifteen diagram-inferred Dallas bends.", uk: "Офіційний результат не визначає місце п’ятнадцяти поворотів Далласа, відновлених за схемою." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "dallas", layout_id: "dallas-1", period: "1984",
    source_url: "https://www.gdecarli.it/php2/circuit.php?var1=1993&var2=2", source_role: "retrospective_layout_version_comparison",
    source_published_year: null, recorded_asset_license: null,
    limitation: { en: "The later reconstruction distinguishes the red raced 1984 route from green proposals with a different start line and calls the raced route anticlockwise; not a numbered period FIA map.", uk: "Пізніша реконструкція відрізняє червоний маршрут перегонів від зелених проєктів з іншою стартовою лінією та називає напрям проти годинникової стрілки; це не нумерована карта FIA епохи." },
    independently_authenticated_period_numbered_map: false, imported_media_asset: false, media_reuse_approved: false,
  },
  {
    circuit_id: "dallas", layout_id: "dallas-1", period: "1984",
    source_url: "https://www.gdecarli.it/php2/riviste.php?var1=2&var2=1&var3=1984&var4=", source_role: "period_magazine_map_catalog_not_scans",
    source_published_year: null, recorded_asset_license: null,
    limitation: { en: "Rombo 9 (28 February 1984, p. 13) catalogs a definitive map, while Rombo 12 (20 March 1984, p. 12) catalogs a provisional map. The actual magazine pages have not been inspected.", uk: "Rombo 9 (28 лютого 1984, с. 13) містить у каталозі остаточну схему, а Rombo 12 (20 березня 1984, с. 12) — попередню. Самі сторінки журналів не перевірені." },
    independently_authenticated_period_numbered_map: false, imported_media_asset: false, media_reuse_approved: false,
  },
  {
    circuit_id: "dallas", layout_id: "dallas-1", period: "1984",
    source_url: "https://lapledger.org/circuits/dallas", source_role: "derivative_direction_claim_in_conflict",
    source_published_year: null, recorded_asset_license: null,
    limitation: { en: "The derivative page labels Dallas clockwise, contradicting the anticlockwise reconstruction. Neither claim authenticates the 1984 race direction or individual apex orientations.", uk: "Похідна сторінка називає напрям за годинниковою стрілкою, на відміну від реконструкції. Жодне твердження не підтверджує напрям перегонів 1984 року чи окремих апексів." },
    independently_authenticated_period_numbered_map: false, imported_media_asset: false, media_reuse_approved: false,
  },
  {
    circuit_id: "detroit", layout_id: "detroit-1", period: "1982",
    source_url: "https://www.racingcircuits.info/north-america/usa/detroit.html", source_role: "retrospective_layout_reference",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "Keep the original 1982 route separate from the 1983–1988 revisions and modern IndyCar map.", uk: "Початкову конфігурацію 1982 року не можна змішувати зі змінами 1983–1988 років і сучасною картою IndyCar." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "detroit", layout_id: "detroit-1", period: "1982",
    source_url: "https://www.formula1.com/en/results/1982/races/443/detroit/race-result", source_role: "official_race_result_not_geometry",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "Official 1982 classification is not evidence of 24 numbered individual FIA apices.", uk: "Офіційна класифікація 1982 року не доводить існування 24 пронумерованих апексів FIA." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "pescara", layout_id: "pescara-1", period: "1957",
    source_url: "https://www.racingcircuits.info/europe/italy/pescara.html", source_role: "retrospective_layout_reference",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "The later historical outline cannot disambiguate the two candidate Esse di Cappelle complexes.", uk: "Пізніша історична схема не розрізняє дві можливі зв’язки Esse di Cappelle." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "pescara", layout_id: "pescara-1", period: "1957",
    source_url: "https://www.formula1.com/en/results/1957/races/156/pescara/race-result", source_role: "official_race_result_not_geometry",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "The 1957 result dates the event but does not validate the reported 24-bend count.", uk: "Результат 1957 року підтверджує дату, але не перевіряє заявлені 24 повороти." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "porto", layout_id: "porto-1", period: "1958–1960",
    source_url: "https://www.motorsportmagazine.com/archive/article/october-1958/31/vii-grande/", source_role: "contemporary_race_report",
    source_published_year: 1958,
    recorded_asset_license: null,
    limitation: { en: "The report describes tram tracks and the lap sequence, without a numbered 1958 FIA apex map.", uk: "Репортаж описує трамвайні колії й послідовність маршруту без нумерованої карти FIA 1958 року." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "porto", layout_id: "porto-1", period: "1958–1960",
    source_url: "https://www.formula1.com/en/results/1960/races/185/portugal/race-result", source_role: "official_race_result_not_geometry",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "The 1960 classification cannot reconcile the derivative fourteen-versus-nineteen-turn counts.", uk: "Класифікація 1960 року не усуває суперечності між похідними підрахунками 14 та 19 поворотів." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "sebring", layout_id: "sebring-1", period: "1959",
    source_url: "https://www.motorsportmagazine.com/archive/article/january-1960/16/the-first-grand-prix-of-the-united-states/", source_role: "contemporary_race_report",
    source_published_year: 1960,
    recorded_asset_license: null,
    limitation: { en: "A contemporary lap description supports bend order, not numbered FIA apex positions.", uk: "Опис кола тієї епохи підтверджує послідовність віражів, але не їхню нумерацію FIA." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "sebring", layout_id: "sebring-1", period: "1959",
    source_url: "https://commons.wikimedia.org/wiki/File:Circuit_Sebring_1959.svg", source_role: "later_redrawn_historical_map",
    source_published_year: 2010,
    recorded_asset_license: "CC BY-SA 3.0 Unported; CC BY-SA 3.0 Germany; GFDL 1.2+ (Oliver Pohlmann)",
    limitation: { en: "The 2010 Oliver Pohlmann illustration is dual/multi-licensed, but is not a 1959 FIA-numbered map. No asset imported or reuse approved.", uk: "Ілюстрація Олівера Польманна 2010 року має кілька ліцензій, але не є нумерованою картою FIA 1959 року. Файл не імпортовано, використання не схвалено." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
  {
    circuit_id: "sebring", layout_id: "sebring-1", period: "1959",
    source_url: "https://www.formula1.com/en/results/1959/races/177/united-states/race-result", source_role: "official_race_result_not_geometry",
    source_published_year: null,
    recorded_asset_license: null,
    limitation: { en: "The 12 December 1959 result is not evidence for modern Sebring Turn 17 or its layout.", uk: "Результат від 12 грудня 1959 року не підтверджує сучасний 17-й поворот Себринга чи його конфігурацію." },
    independently_authenticated_period_numbered_map: false,
    imported_media_asset: false,
    media_reuse_approved: false,
  },
] as const;

export const historicalMapRightsReviewByCircuit = candidateUnnumberedHistoricalRoutes.map(route => {
  const references = historicalMapReferenceAudit.filter(item =>
    item.circuit_id === route.circuit_id && item.layout_id === route.layout_id && item.period === route.period);
  return {
    circuit_id: route.circuit_id,
    layout_id: route.layout_id,
    period: route.period,
    references,
    period_map_version_leads: route.circuit_id === 'dallas' ? dallas1984MagazineMapLeads : [],
    direction_dispute: route.circuit_id === 'dallas' ? dallas1984DirectionDispute : null,
    source_references: references.length,
    // Count canonical pages, not URL variants or multiple claims from one page.
    // This is a provenance diagnostic, NEVER an independent FIA-map approval.
    distinct_source_pages: new Set(references.map(item => canonicalHistoricalMapSourcePage(item.source_url))).size,
    duplicate_source_pages: references.length -
      new Set(references.map(item => canonicalHistoricalMapSourcePage(item.source_url))).size,
    recorded_license_pages: references.filter(item => item.recorded_asset_license !== null).length,
    independently_authenticated_period_numbered_maps: 0,
    numbered_apex_crosswalk_verified: false as const,
    imported_media_assets: 0,
    media_reuse_approved: false as const,
    publication_allowed: false as const,
  };
});
