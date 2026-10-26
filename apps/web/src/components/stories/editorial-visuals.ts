import type { ArtKind } from './motorsport-art';

/** Original, interpretive vector illustration directions. Never historical photo or circuit geometry. */
export const editorialVisualDirections: Record<string, { kind: ArtKind; tone: 'coral' | 'mint' | 'violet' | 'gold'; motif: { en: string; uk: string } }> = {
  'lauda-hunt-1976': { kind: 'duel', tone: 'gold', motif: { en: 'Two decisions · One title', uk: 'Два рішення · Один титул' } },
  'senna-prost-1988-89': { kind: 'duel', tone: 'violet', motif: { en: 'Same team · Different destinies', uk: 'Одна команда · Різні долі' } },
  'villeneuve-arnoux-1979': { kind: 'apex', tone: 'coral', motif: { en: 'The battle behind the winner', uk: 'Дуель позаду переможця' } },
  'vettel-monza-2008': { kind: 'velocity', tone: 'mint', motif: { en: 'A team’s first victory', uk: 'Перша перемога команди' } },
  'button-canada-2011': { kind: 'apex', tone: 'violet', motif: { en: 'The long way back', uk: 'Довга дорога назад' } },
  'perez-sakhir-2020': { kind: 'grid', tone: 'gold', motif: { en: 'From the back to the front', uk: 'З останніх позицій до перемоги' } },
  'kubica-bmw-2008': { kind: 'velocity', tone: 'mint', motif: { en: 'An unexpected championship leader', uk: 'Неочікуваний лідер чемпіонату' } },
  'schumacher-ferrari-1996-2000': { kind: 'helmet', tone: 'coral', motif: { en: 'Five years to a title', uk: 'П’ять років до титулу' } },
  'massa-2008': { kind: 'duel', tone: 'gold', motif: { en: 'One race · Two endings', uk: 'Одна гонка · Два фінали' } },
  'brawn-2009': { kind: 'grid', tone: 'mint', motif: { en: 'One extraordinary season', uk: 'Один незвичайний сезон' } },
};
