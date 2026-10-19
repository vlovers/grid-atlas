import type { Metadata } from 'next';
import { getData } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Источники и покрытие архива' };
type Source = { slug: string; homepage_url: string; attribution: string; release_tag: string; artifact_name: string; sha256: string };

export default async function Sources() {
  const sources = await getData<Source>('/api/sources');
  return <section className="page">
    <p className="eyebrow">GRID ATLAS / SOURCES</p><h1>Источники данных</h1>
    <p className="lead">Grid Atlas — независимый исторический архив. Ниже указаны релизы, зарегистрированные при импорте в эту базу.</p>
    {sources.length ? sources.map(source => <article className="source-card" key={`${source.slug}-${source.release_tag}-${source.artifact_name}`}>
      <h2><a href={source.homepage_url} target="_blank" rel="noopener noreferrer">{source.slug.toUpperCase()} ↗</a> · {source.release_tag}</h2>
      <p>{source.attribution}</p><p>Архив: {source.artifact_name}</p><p className="checksum">SHA-256: <code>{source.sha256}</code></p>
    </article>) : <p>Релизы источников пока не загружены.</p>}
    <h2>Как читать архив</h2>
    <p>Архив ограничен загруженным релизом и не обновляется в реальном времени. Статистика вычислена из результатов гонок: сумма очков пилотов не равна официальному зачёту Кубка конструкторов. Спринты, отброшенные результаты и исторические правила зачёта отдельно не рассчитаны.</p>
    <p>Конструктор, участник чемпионата и юридическая организация различаются. Совпадение названий не доказывает преемственность. В истории команд публикуются только связи с источником после отдельного редакционного одобрения; пустой граф означает отсутствие опубликованных связей.</p>
    <p>F1DB распространяет данные по <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Grid Atlas выбирает поля исходного архива и вычисляет сводную статистику. Проверка контрольной суммы подтверждает целостность файла, а не независимую проверку каждого исторического факта.</p>
  </section>;
}
