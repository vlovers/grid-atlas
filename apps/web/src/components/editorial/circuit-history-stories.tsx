import { Link } from '@/i18n/navigation';
import styles from './circuit-history-stories.module.css';

type Story = { title: string; introduction: string; moments: readonly { year: string; title: string; description: string; url: string }[] };
type LocaleStory = { en: Story; uk: Story };
const history: Record<string, LocaleStory> = {
  monaco: {
    en: { title: 'A city transformed into a racetrack', introduction: 'The Monaco Grand Prix began in 1929, long before the Formula 1 World Championship. Its narrow streets reward precision and punish small mistakes.', moments: [
      { year: '1929', title: 'Racing arrives in Monte Carlo', description: 'Antony Noghès organised Monaco’s first Grand Prix, establishing a street-racing tradition older than the World Championship.', url: 'https://www.formula1.com/en/racing/2023/monaco' },
      { year: '2003', title: 'Not a single overtake', description: 'Formula 1 records no passing moves at the 2003 Grand Prix — a striking example of how difficult overtaking can be on these streets.', url: 'https://www.formula1.com/en/racing/2023/monaco' }
    ]},
    uk: { title: 'Місто, яке стає гоночною трасою', introduction: 'Історія Гран-прі Монако почалася в 1929 році — задовго до чемпіонату світу Формули-1. Вузькі вулиці винагороджують точність і майже не пробачають помилок.', moments: [
      { year: '1929', title: 'Гонки приходять до Монте-Карло', description: 'Антоні Ноге організував перший Гран-прі Монако, започаткувавши традицію вуличних перегонів, старшу за чемпіонат світу.', url: 'https://www.formula1.com/en/racing/2023/monaco' },
      { year: '2003', title: 'Жодного обгону', description: 'За даними Формули-1, на Гран-прі 2003 року не було жодного обгону. Це яскравий приклад того, наскільки важко випереджати суперників на цих вулицях.', url: 'https://www.formula1.com/en/racing/2023/monaco' }
    ]}
  },
  monza: {
    en: { title: 'Where thousandths of a second matter', introduction: 'Monza’s long straights and slipstream battles have created some of Formula 1’s closest finishes.', moments: [
      { year: '1971', title: 'The closest finish', description: 'Peter Gethin beat Ronnie Peterson by only 0.010 seconds in a dramatic five-car finish.', url: 'https://www.formula1.com/en/results/1971/races/299/italy/race-result' },
      { year: '2020', title: 'Gasly’s breakthrough', description: 'Pierre Gasly held off Carlos Sainz to claim his first Formula 1 victory at Monza.', url: 'https://www.formula1.com/en/latest/article/gasly-takes-maiden-win-in-monza-thriller-from-sainz-as-penalty-leaves.2wjQyiSgOy8ggwcJlWHhsi' }
    ]},
    uk: { title: 'Тут усе вирішують тисячні секунди', introduction: 'Довгі прямі Монци та боротьба у повітряному потоці подарували Формулі-1 одні з найщільніших фінішів.', moments: [
      { year: '1971', title: 'Найщільніший фініш', description: 'Пітер Гетин випередив Ронні Петерсона лише на 0,010 секунди після неймовірної боротьби першої п’ятірки.', url: 'https://www.formula1.com/en/results/1971/races/299/italy/race-result' },
      { year: '2020', title: 'Прорив Гаслі', description: 'П’єр Гаслі стримав Карлоса Сайнса та здобув свою першу перемогу у Формулі-1 саме в Монці.', url: 'https://www.formula1.com/en/latest/article/gasly-takes-maiden-win-in-monza-thriller-from-sainz-as-penalty-leaves.2wjQyiSgOy8ggwcJlWHhsi' }
    ]}
  },
  suzuka: {
    en: { title: 'A figure-eight of championship drama', introduction: 'Suzuka’s unique crossing layout became the stage for one of Formula 1’s fiercest rivalries.', moments: [
      { year: '1988', title: 'Senna’s first title', description: 'After a poor start, Ayrton Senna recovered to win and secure his first World Championship.', url: 'https://www.formula1.com/en/latest/article/what-makes-the-japanese-grand-prix-special-and-why-you-should-see-it.eFK4inb6tYknE3luYyh8f' },
      { year: '1989', title: 'The Senna–Prost collision', description: 'The McLaren team-mates collided at the chicane. Senna was disqualified, leaving Prost with the championship.', url: 'https://www.formula1.com/en/latest/article/what-makes-the-japanese-grand-prix-special-and-why-you-should-see-it.eFK4inb6tYknE3luYyh8f' }
    ]},
    uk: { title: 'Вісімка чемпіонських драм', introduction: 'Незвичне кільце Сузуки з перетином на різних рівнях стало сценою одного з найгостріших протистоянь Формули-1.', moments: [
      { year: '1988', title: 'Перший титул Сенни', description: 'Після невдалого старту Айртон Сенна відігрався, переміг і здобув свій перший чемпіонський титул.', url: 'https://www.formula1.com/en/latest/article/what-makes-the-japanese-grand-prix-special-and-why-you-should-see-it.eFK4inb6tYknE3luYyh8f' },
      { year: '1989', title: 'Зіткнення Сенни та Проста', description: 'Напарники McLaren зіткнулися в шикані. Згодом Сенну дискваліфікували, і чемпіоном став Прост.', url: 'https://www.formula1.com/en/latest/article/what-makes-the-japanese-grand-prix-special-and-why-you-should-see-it.eFK4inb6tYknE3luYyh8f' }
    ]}
  },
  silverstone: {
    en: { title: 'The World Championship starts here', introduction: 'Silverstone grew out of an RAF airfield to host the opening race of the new Formula 1 World Championship.', moments: [
      { year: '1950', title: 'The first championship race', description: 'On 13 May, Giuseppe Farina won the inaugural Formula 1 World Championship Grand Prix in an Alfa Romeo.', url: 'https://www.formula1.com/en/information/great-britain-silverstone-circuit.2DtFVI1FjkYgLVdGhbAIv0' },
      { year: '1987', title: 'Mansell’s charge', description: 'Nigel Mansell chased down Nelson Piquet, then passed his Williams team-mate at Stowe with three laps remaining.', url: 'https://www.formula1.com/en/latest/article/from-wet-weather-mastery-to-last-lap-shocks-10-of-the-most-memorable-wins-at.3CKqgTx7juBp8nglWBgffT.3CKqgTx7juBp8nglWBgffT' }
    ]},
    uk: { title: 'Тут почався чемпіонат світу', introduction: 'Сільверстоун виріс із військового аеродрому RAF і прийняв перший етап нового чемпіонату світу Формули-1.', moments: [
      { year: '1950', title: 'Перша гонка чемпіонату', description: '13 травня Джузеппе Фаріна виграв перший етап чемпіонату світу Формули-1 за кермом Alfa Romeo.', url: 'https://www.formula1.com/en/information/great-britain-silverstone-circuit.2DtFVI1FjkYgLVdGhbAIv0' },
      { year: '1987', title: 'Атака Менселла', description: 'Найджел Менселл наздогнав Нельсона Піке та обігнав напарника по Williams у повороті Stowe за три кола до фінішу.', url: 'https://www.formula1.com/en/latest/article/from-wet-weather-mastery-to-last-lap-shocks-10-of-the-most-memorable-wins-at.3CKqgTx7juBp8nglWBgffT.3CKqgTx7juBp8nglWBgffT' }
    ]}
  },
  'spa-francorchamps': {
    en: { title: 'One name, radically different circuits', introduction: 'The historic road circuit through the Ardennes was far longer than the modern Spa. Its evolving route is part of the story.', moments: [
      { year: '1950', title: 'Fangio at the old Spa', description: 'Juan Manuel Fangio won the Belgian Grand Prix on the original long road course.', url: 'https://www.formula1.com/en/results/1950/races/98/belgium/race-result' },
      { year: '1983', title: 'A transformed return', description: 'Formula 1 returned to a shortened, redesigned Spa-Francorchamps after the old-road-course era.', url: 'https://www.formula1.com/en/information/belgium-circuit-de-spa-francorchamps.3LltuYaAXVRU8iezEsjzGw' }
    ]},
    uk: { title: 'Одна назва — зовсім різні траси', introduction: 'Історичне кільце дорогами Арденн було значно довшим за сучасну Спа. Зміни маршруту — важлива частина її історії.', moments: [
      { year: '1950', title: 'Фанхіо на старій Спа', description: 'Хуан-Мануель Фанхіо виграв Гран-прі Бельгії на довгому історичному маршруті.', url: 'https://www.formula1.com/en/results/1950/races/98/belgium/race-result' },
      { year: '1983', title: 'Повернення на оновлену трасу', description: 'Формула-1 повернулася на коротшу, перебудовану Спа-Франкоршам після епохи довгого дорожнього кільця.', url: 'https://www.formula1.com/en/information/belgium-circuit-de-spa-francorchamps.3LltuYaAXVRU8iezEsjzGw' }
    ]}
  }
};

export function CircuitHistoryStories({ circuitId, locale }: { circuitId: string; locale: 'en' | 'uk' }) {
  const entry = history[circuitId]?.[locale];
  if (!entry) return null;
  return <section className={styles.story} data-testid="circuit-historical-stories" aria-labelledby="circuit-stories-heading">
    <p className={styles.kicker}>{locale === 'uk' ? 'Історії траси' : 'Circuit stories'}</p>
    <p className={styles.review}>{locale === 'uk' ? 'Перевірено за допомогою ШІ · Незалежна редакторська перевірка ще не завершена' : 'AI-reviewed · Independent editorial verification pending'}</p>
    <h2 id="circuit-stories-heading">{entry.title}</h2>
    <p className={styles.introduction}>{entry.introduction}</p>
    <div className={styles.timeline}>{entry.moments.map(moment => <article className={styles.moment} key={moment.year}>
      <span className={styles.year}>{moment.year}</span>
      <div><h3>{moment.title}</h3><p>{moment.description}</p>
        <a href={moment.url} target="_blank" rel="noopener noreferrer">{locale === 'uk' ? 'Джерело: Formula 1' : 'Source: Formula 1'} ↗</a>
      </div>
    </article>)}</div>
    <p className={styles.explore}><Link href="/sources">{locale === 'uk' ? 'Про наші історичні джерела' : 'About our historical sources'}</Link></p>
  </section>;
}
