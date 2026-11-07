/** Research leads only. Neither magazine map has been inspected or licensed. */
export const dallas1984MagazineMapLeads = [
  {
    layout_id: 'dallas-1', period: '1984', stage: 'definitive' as const,
    publication: 'Rombo', issue: '9 (150)', published_date: '1984-02-28', page: 13,
    catalog_url: 'https://www.gdecarli.it/php2/riviste.php?var1=2&var2=1&var3=1984&var4=',
    actual_map_inspected: false as const, numbered_apex_crosswalk_verified: false as const,
    media_reuse_approved: false as const,
    next_step: { en: 'Obtain Rombo 9 (150), page 13 and authenticate the definitive 1984 layout, then independently verify each numbered apex and image rights.',
      uk: 'Отримати Rombo 9 (150), сторінка 13, перевірити остаточну конфігурацію 1984 року, а потім незалежно звірити кожен апекс і права на зображення.' },
  },
  {
    layout_id: 'dallas-1', period: '1984', stage: 'provisional' as const,
    publication: 'Rombo', issue: '12 (153)', published_date: '1984-03-20', page: 12,
    catalog_url: 'https://www.gdecarli.it/php2/riviste.php?var1=2&var2=1&var3=1984&var4=',
    actual_map_inspected: false as const, numbered_apex_crosswalk_verified: false as const,
    media_reuse_approved: false as const,
    next_step: { en: 'Obtain Rombo 12 (153), page 12; label this map provisional and never transfer its start line or numbered turns to the raced configuration.',
      uk: 'Отримати Rombo 12 (153), сторінка 12; позначити схему як попередню й не переносити її стартову лінію чи номери поворотів на маршрут перегонів.' },
  },
] as const;

/** Two derivative claims disagree about the direction of the raced 1984 layout. */
export const dallas1984DirectionClaims = [
  {
    layout_id: 'dallas-1', period: '1984', direction: 'anticlockwise' as const,
    source_url: 'https://www.gdecarli.it/php2/circuit.php?var1=1993&var2=2',
    locator: 'Dallas Fair Park / 1984 / Direction Anticlockwise; red raced vs green early proposals',
    independently_authenticated_from_period_map: false as const,
  },
  {
    layout_id: 'dallas-1', period: '1984', direction: 'clockwise' as const,
    source_url: 'https://lapledger.org/circuits/dallas',
    locator: 'Fair Park / Direction clockwise; F1DB layout dallas-1',
    independently_authenticated_from_period_map: false as const,
  },
] as const;

export const dallas1984DirectionDispute = {
  circuit_id: 'dallas', layout_id: 'dallas-1', period: '1984',
  competing_directions: [...new Set(dallas1984DirectionClaims.map(x => x.direction))],
  unresolved: new Set(dallas1984DirectionClaims.map(x => x.direction)).size > 1,
  authenticated_race_direction: null,
  official_turn_directions_verified: false as const,
  publication_allowed: false as const,
  review_request: {
    en: 'Resolve clockwise versus anticlockwise using an authenticated period map of the raced configuration, not a proposal or modern database. Do not approve individual left/right bends.',
    uk: 'Зіставити напрями за автентичною картою саме перегонів, а не за проєктом чи сучасною базою. Не затверджувати окремі ліві або праві повороти.',
  },
} as const;
