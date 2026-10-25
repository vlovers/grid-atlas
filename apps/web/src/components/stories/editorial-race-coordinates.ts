/** Curated year/round coordinates, resolved against actual race IDs at runtime. */
export const editorialRaceCoordinates = {
  "lauda-hunt-1976": [
    [
      1976,
      16,
      "Fuji title decider",
      "Фінал у Фудзі"
    ]
  ],
  "senna-prost-1988-89": [
    [
      1988,
      15,
      "Suzuka 1988",
      "Сузука 1988"
    ],
    [
      1989,
      15,
      "Suzuka 1989",
      "Сузука 1989"
    ]
  ],
  "villeneuve-arnoux-1979": [
    [
      1979,
      8,
      "French Grand Prix at Dijon",
      "Гран-прі Франції в Діжоні"
    ]
  ],
  "vettel-monza-2008": [
    [
      2008,
      14,
      "Italian Grand Prix",
      "Гран-прі Італії"
    ]
  ],
  "button-canada-2011": [
    [
      2011,
      7,
      "Canadian Grand Prix",
      "Гран-прі Канади"
    ]
  ],
  "perez-sakhir-2020": [
    [
      2020,
      16,
      "Sakhir Grand Prix",
      "Гран-прі Сахіру"
    ]
  ],
  "kubica-bmw-2008": [
    [
      2008,
      7,
      "Canadian Grand Prix",
      "Гран-прі Канади"
    ]
  ],
  "schumacher-ferrari-1996-2000": [
    [
      2000,
      16,
      "Japanese Grand Prix",
      "Гран-прі Японії"
    ]
  ],
  "massa-2008": [
    [
      2008,
      18,
      "Brazilian Grand Prix",
      "Гран-прі Бразилії"
    ]
  ],
  "brawn-2009": [
    [
      2009,
      1,
      "Australian Grand Prix",
      "Гран-прі Австралії"
    ],
    [
      2009,
      16,
      "Brazilian Grand Prix",
      "Гран-прі Бразилії"
    ]
  ]
} as const;
export function storyRaceCoordinates(slug: string) { return editorialRaceCoordinates[slug as keyof typeof editorialRaceCoordinates] ?? []; }
