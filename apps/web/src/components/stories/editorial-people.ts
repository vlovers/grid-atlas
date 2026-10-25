/** Historical names are editorial pointers, not resolved archive entity IDs. */
export const storyPeople = {
  "lauda-hunt-1976": [
    [
      "niki-lauda",
      "Niki Lauda",
      "Нікі Лауда"
    ],
    [
      "james-hunt",
      "James Hunt",
      "Джеймс Гант"
    ]
  ],
  "senna-prost-1988-89": [
    [
      "ayrton-senna",
      "Ayrton Senna",
      "Айртон Сенна"
    ],
    [
      "alain-prost",
      "Alain Prost",
      "Ален Прост"
    ]
  ],
  "villeneuve-arnoux-1979": [
    [
      "gilles-villeneuve",
      "Gilles Villeneuve",
      "Жиль Вільньов"
    ],
    [
      "rene-arnoux",
      "René Arnoux",
      "Рене Арну"
    ]
  ],
  "vettel-monza-2008": [
    [
      "sebastian-vettel",
      "Sebastian Vettel",
      "Себастьян Феттель"
    ]
  ],
  "button-canada-2011": [
    [
      "jenson-button",
      "Jenson Button",
      "Дженсон Баттон"
    ],
    [
      "sebastian-vettel",
      "Sebastian Vettel",
      "Себастьян Феттель"
    ]
  ],
  "perez-sakhir-2020": [
    [
      "sergio-perez",
      "Sergio Pérez",
      "Серхіо Перес"
    ],
    [
      "george-russell",
      "George Russell",
      "Джордж Расселл"
    ]
  ],
  "kubica-bmw-2008": [
    [
      "robert-kubica",
      "Robert Kubica",
      "Роберт Кубіца"
    ],
    [
      "nick-heidfeld",
      "Nick Heidfeld",
      "Нік Гайдфельд"
    ]
  ],
  "schumacher-ferrari-1996-2000": [
    [
      "michael-schumacher",
      "Michael Schumacher",
      "Міхаель Шумахер"
    ]
  ],
  "massa-2008": [
    [
      "felipe-massa",
      "Felipe Massa",
      "Феліпе Масса"
    ],
    [
      "lewis-hamilton",
      "Lewis Hamilton",
      "Льюїс Гамільтон"
    ]
  ],
  "brawn-2009": [
    [
      "jenson-button",
      "Jenson Button",
      "Дженсон Баттон"
    ],
    [
      "rubens-barrichello",
      "Rubens Barrichello",
      "Рубенс Баррікелло"
    ]
  ]
} as const;
export function storyPeopleFor(slug: string) { return storyPeople[slug as keyof typeof storyPeople] ?? []; }
