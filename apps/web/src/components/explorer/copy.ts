const en = {
  title: "History, connected.",
  kicker: "HISTORY EXPLORER / THE NETWORK",
  intro: "Choose a season. Follow a connection. Open the races behind it.",
  core: "Focus",
  observed: "Connected by race results",
  neighbors: "Drivers and constructors",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  reset: "Return to center",
  pan: "Pan network",
  left: "Pan left",
  right: "Pan right",
  up: "Pan up",
  down: "Pan down",
  controls: "Network controls",
  help: "Arrow keys pan; + and − zoom; Home returns to center. Tab reaches each identity. On mobile, use the connection list below.",
  window: "Network window",
  previous: "Previous network window",
  next: "Next network window",
  slice:
    "The map shows a part of the season’s connections. The list includes every loaded association; additional records are available through pagination.",
  all: "Browse all season connections",
  list: "All loaded connections",
  evidence: "Race evidence / selected pair",
  loading: "Loading exact race records…",
  error:
    "Race records are temporarily unavailable. The evidence page remains available.",
  retry: "Retry race preview",
  noRaces: "No imported race records were returned for this pair and season.",
  more: "Open all race evidence",
  preview:
    "Preview of recorded races, ordered by round; limited to three. Counts refer to this pair only.",
  machine: "Compare another season",
  profile: "Focus profile",
  season: "Open season",
  emptyTitle: "A quiet year in these records.",
  empty:
    "No race results connect this driver and constructor in this season. Missing records do not prove that an association never existed.",
  invalidSelection:
    "This selection is outside the loaded graph slice. Showing its first association; use the paginated list to find other records.",
};
const uk: Record<keyof typeof en, string> = {
  title: "Історія у зв’язках.",
  kicker: "ДОСЛІДНИК ІСТОРІЇ / МЕРЕЖА",
  intro: "Оберіть сезон. Простежте зв’язок. Відкрийте гонки за ним.",
  core: "У фокусі",
  observed: "Зв’язок за результатами гонок",
  neighbors: "Пілоти й конструктори",
  zoomIn: "Збільшити",
  zoomOut: "Зменшити",
  reset: "Повернутися до центру",
  pan: "Переміщення мережі",
  left: "Перемістити ліворуч",
  right: "Перемістити праворуч",
  up: "Перемістити вгору",
  down: "Перемістити вниз",
  controls: "Керування мережею",
  help: "Стрілки переміщують; + та − змінюють масштаб; Home повертає до центру. Tab переходить між ідентичностями. На мобільному скористайтеся списком нижче.",
  window: "Вікно мережі",
  previous: "Попереднє вікно мережі",
  next: "Наступне вікно мережі",
  slice:
    "Мапа показує частину зв’язків сезону. Список містить усі завантажені зв’язки; інші записи доступні через сторінки.",
  all: "Усі зв’язки сезону",
  list: "Усі завантажені зв’язки",
  evidence: "Записи гонок / вибрана пара",
  loading: "Завантаження точних записів гонок…",
  error:
    "Записи гонок тимчасово недоступні. Сторінка підтверджень залишається доступною.",
  retry: "Повторити завантаження гонок",
  noRaces: "Для цієї пари й сезону не повернуто записів гонок.",
  more: "Відкрити всі записи гонок",
  preview:
    "Перегляд зафіксованих гонок за раундом, до трьох записів. Лічильники стосуються лише цієї пари.",
  machine: "Порівняти інший сезон",
  profile: "Профіль у фокусі",
  season: "Відкрити сезон",
  emptyTitle: "Тихий рік у цих записах.",
  empty:
    "За цей сезон немає результатів, що пов’язують пілота й конструктора. Відсутність записів не доводить, що зв’язку ніколи не було.",
  invalidSelection:
    "Цей вибір поза завантаженим зрізом графа. Показано перший зв’язок; інші записи шукайте у списку зі сторінками.",
};
export const explorerCopy = { en, uk };

export function recordCountLabel(
  count: number,
  locale: "en" | "uk",
  unit: "races" | "entries",
) {
  if (locale === "en")
    return `${count} ${unit === "races" ? (count === 1 ? "race with results" : "races with results") : count === 1 ? "result entry" : "result entries"}`;
  const plural = new Intl.PluralRules("uk").select(count);
  const word =
    unit === "races"
      ? plural === "one"
        ? "гонка із результатами"
        : plural === "few"
          ? "гонки із результатами"
          : "гонок із результатами"
      : plural === "one"
        ? "запис результату"
        : plural === "few"
          ? "записи результатів"
          : "записів результатів";
  return `${count} ${word}`;
}
