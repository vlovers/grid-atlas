/** Editorial reading paths. These are navigational suggestions, not verified race-record identifiers. */
export const editorialMomentPaths = {
  'lauda-hunt-1976': { en: ['The championship before the accident', 'Return to the grid', 'The decision at Fuji', 'The title and the right to stop'], uk: ['Чемпіонат до аварії', 'Повернення на старт', 'Рішення у Фудзі', 'Титул і право зупинитися'] },
  'senna-prost-1988-89': { en: ['A dominant McLaren', 'Points that counted', 'Two drivers, one garage', 'The confrontation at Suzuka'], uk: ['Домінування McLaren', 'Очки, які враховували', 'Два пілоти, один гараж', 'Протистояння в Сузуці'] },
  'villeneuve-arnoux-1979': { en: ['A new engine era', 'Jabouille wins', 'The fight for second', 'Why both stories matter'], uk: ['Нова ера двигунів', 'Перемога Жабуя', 'Боротьба за друге місце', 'Чому важливі обидві історії'] },
  'vettel-monza-2008': { en: ['An unexpected pole', 'Racing in the rain', 'Toro Rosso wins', 'The road after Monza'], uk: ['Несподіваний поул', 'Гонка під дощем', 'Перемога Toro Rosso', 'Шлях після Монци'] },
  'button-canada-2011': { en: ['A changing track', 'Setbacks and restarts', 'The pursuit', 'The final lap'], uk: ['Мінлива траса', 'Невдачі та рестарти', 'Переслідування', 'Останнє коло'] },
  'perez-sakhir-2020': { en: ['The first-lap setback', 'Russell in a Mercedes', 'The race changes', 'Pérez takes his chance'], uk: ['Невдача на першому колі', 'Расселл у Mercedes', 'Перелом гонки', 'Перес використовує шанс'] },
  'kubica-bmw-2008': { en: ['BMW Sauber rises', 'The Montreal breakthrough', 'Leading the standings', 'The rest of the season'], uk: ['Підйом BMW Sauber', 'Прорив у Монреалі', 'Лідерство в чемпіонаті', 'Решта сезону'] },
  'schumacher-ferrari-1996-2000': { en: ['Arrival at Ferrari', 'Victories without a title', 'The setbacks', 'Suzuka 2000'], uk: ['Прихід до Ferrari', 'Перемоги без титулу', 'Невдачі', 'Сузука-2000'] },
  'massa-2008': { en: ['The title arithmetic', 'A home victory', 'The fight behind', 'Two finish lines'], uk: ['Арифметика титулу', 'Домашня перемога', 'Боротьба позаду', 'Дві фінішні лінії'] },
  'brawn-2009': { en: ['Honda withdraws', 'A team survives', 'An extraordinary opening', 'The championship'], uk: ['Honda йде', 'Команда виживає', 'Неймовірний початок', 'Чемпіонство'] },
} as const;

export function editorialMomentPath(slug: string, locale: 'en' | 'uk') {
  const record = editorialMomentPaths[slug as keyof typeof editorialMomentPaths];
  return record ? record[locale] : null;
}
