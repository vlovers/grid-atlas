'use client';
import { useLocale } from 'next-intl';
export default function StoriesError({ reset }: { error: Error; reset: () => void }) {
  const uk = useLocale() === 'uk';
  return <section className="page" role="alert"><h1>{uk ? 'Історії тимчасово недоступні' : 'Stories are temporarily unavailable'}</h1><p>{uk ? 'Не вдалося отримати дані архіву або редакційний матеріал. Спробуйте ще раз.' : 'Archive records or editorial content could not be loaded. Please try again.'}</p><button onClick={reset}>{uk ? 'Повторити' : 'Try again'}</button></section>;
}
