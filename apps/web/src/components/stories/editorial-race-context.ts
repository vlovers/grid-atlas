/** Concise editorial context for archive-linked race milestones; not a lap-by-lap reconstruction. */
export const editorialRaceContext = {
  "lauda-hunt-1976": [
    [
      "Lauda chose to withdraw in dangerous conditions; Hunt finished third and secured the title by a single point.",
      "Лауда вирішив зійти через небезпечні умови; Гант фінішував третім і здобув титул із перевагою в одне очко."
    ]
  ],
  "senna-prost-1988-89": [
    [
      "Senna won at Suzuka and clinched his first world championship under the era’s best-results scoring rule.",
      "Сенна переміг у Сузуці й здобув свій перший титул за тодішньою системою заліку найкращих результатів."
    ],
    [
      "A collision between the McLaren teammates reshaped the title fight; Prost became world champion.",
      "Зіткнення напарників по McLaren змінило боротьбу за титул; чемпіоном світу став Прост."
    ]
  ],
  "villeneuve-arnoux-1979": [
    [
      "Jabouille won for Renault; Villeneuve and Arnoux fought wheel-to-wheel for second place.",
      "Жабуй переміг за Renault, а Вільньов та Арну боролися колесо в колесо за друге місце."
    ]
  ],
  "vettel-monza-2008": [
    [
      "In the rain, Vettel delivered Toro Rosso’s first Grand Prix victory—not a Red Bull Racing win.",
      "Під дощем Феттель приніс Toro Rosso першу перемогу в Гран-прі — не Red Bull Racing."
    ]
  ],
  "button-canada-2011": [
    [
      "After interruptions and setbacks, Button passed Vettel on the final lap to win in Montreal.",
      "Після зупинок і невдач Баттон обійшов Феттеля на останньому колі та переміг у Монреалі."
    ]
  ],
  "perez-sakhir-2020": [
    [
      "Pérez recovered from a first-lap setback to take his maiden victory as Russell’s Mercedes opportunity unravelled.",
      "Перес відігрався після невдачі на першому колі й здобув першу перемогу, поки шанс Расселла за Mercedes зник."
    ]
  ],
  "kubica-bmw-2008": [
    [
      "Kubica led a BMW Sauber one-two finish and briefly moved into the championship lead.",
      "Кубіца очолив подвійний фініш BMW Sauber і ненадовго вийшов у лідери чемпіонату."
    ]
  ],
  "schumacher-ferrari-1996-2000": [
    [
      "Victory at Suzuka sealed Schumacher’s first drivers’ title with Ferrari and ended a 21-year wait for the team.",
      "Перемога в Сузуці принесла Шумахеру перший титул із Ferrari й завершила 21-річне очікування команди."
    ]
  ],
  "massa-2008": [
    [
      "Massa won at home, but Hamilton’s fifth-place finish secured the drivers’ championship.",
      "Масса переміг удома, але п’яте місце Гамільтона забезпечило йому чемпіонський титул."
    ]
  ],
  "brawn-2009": [
    [
      "Button won the season opener as the newly rescued Brawn GP began its remarkable campaign.",
      "Баттон виграв стартову гонку сезону, і врятована Brawn GP розпочала незвичайний чемпіонат."
    ],
    [
      "Button clinched the drivers’ title in Brazil; Brawn GP also secured the constructors’ championship.",
      "Баттон здобув титул у Бразилії; Brawn GP також гарантувала собі Кубок конструкторів."
    ]
  ]
} as const;
export function storyRaceContext(slug: string, index: number, locale: 'en' | 'uk') {
  const notes = editorialRaceContext[slug as keyof typeof editorialRaceContext];
  const pair = notes?.[index];
  return pair?.[locale === 'uk' ? 1 : 0] ?? null;
}
