import { RecordDetail } from '@/components/discovery/record-detail';
import { archiveCopy } from './archive-copy';
import styles from './archive.module.css';

const notes = {
  en: {
    season: 'The calendar links each round to its race classification. Driver and constructor championship tables retain the source’s championship points; race-result sums are a different measure. Open a driver or constructor to follow the same season from their perspective.',
    race: 'Read the position text alongside each result, including shared drives and retirement reasons. A classification records an outcome; it does not describe the sequence of events during the race. Follow a driver, constructor or circuit link to explore the surrounding records.',
    circuit: 'A circuit identity can have several historical layouts. Select a recorded year and event before reading length or corner counts. The outline belongs to that configuration; it is an illustration, with its own attribution, rather than a surveyed map.',
  },
  uk: {
    season: 'Календар пов’язує кожен етап із його класифікацією. Таблиці пілотів і конструкторів зберігають очки чемпіонату за джерелом; суми гоночних результатів — інший показник. Відкрийте пілота або конструктора, щоб дослідити той самий сезон з іншого боку.',
    race: 'Читайте позицію разом із даними результату, зокрема позначками спільного автомобіля та причинами вибуття. Класифікація фіксує підсумок, а не відтворює перебіг гонки. Посилання на пілотів, конструкторів і трасу відкривають пов’язані записи.',
    circuit: 'Одна траса може мати кілька історичних конфігурацій. Оберіть зафіксований рік та етап перед переглядом довжини й кількості поворотів. Контур належить конкретній конфігурації: це ілюстрація з окремою атрибуцією, а не геодезична карта.',
  },
};

/** Reading guidance for archive records; never an unreviewed race narrative. */
export function RecordReadingNote({ kind, locale }: { kind: 'season' | 'race' | 'circuit'; locale: 'uk' | 'en' }) {
  const t = archiveCopy[locale];
  return <aside className={styles.context} data-testid="record-reading-note">
    <h3>{t.reading}</h3><p>{notes[locale][kind]}</p>
    <RecordDetail detail={{ label: t.editorial, text: t.scope, source: { href: `/${locale}/sources`, label: t.source } }} />
  </aside>;
}
