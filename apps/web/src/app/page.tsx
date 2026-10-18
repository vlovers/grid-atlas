import Link from 'next/link';
export default function Home() {
  return <><section className="hero"><p className="eyebrow">FORMULA 1 · ИСТОРИЧЕСКИЙ АРХИВ С 1950 ГОДА</p><h1>Вся история <em>Формулы-1.</em><br/>В одном атласе.</h1>
    <p className="lead">Найдите пилота или конструктора, откройте сезон и исследуйте результаты Гран-при. Данные ограничены загруженным релизом F1DB.</p>
    <div className="actions"><Link className="primary" href="/seasons">Исследовать сезоны ↗</Link><Link className="secondary" href="/drivers">Найти пилота →</Link><Link className="secondary" href="/constructors">Найти конструктора →</Link><Link className="secondary" href="/circuits">Исследовать трассы →</Link></div>
  </section><section className="columns">
    <article><span className="index">01 / HISTORY</span><h2><Link href="/seasons">Сезон за сезоном ↗</Link></h2><p>Календари чемпионатов, трассы и результаты с первого сезона 1950 года.</p></article>
    <article><span className="index">02 / LINEAGE</span><h2><Link href="/lineage">История команд ↗</Link></h2><p>Конструкторы и участники чемпионата различаются. Исторические связи публикуются после отдельной проверки источников.</p></article>
    <article><span className="index">03 / PROVENANCE</span><h2><Link href="/sources">Источники архива ↗</Link></h2><p>Релиз F1DB, контрольная сумма и ограничения статистики. Архив не обновляется в реальном времени.</p></article>
  </section></>;
}
