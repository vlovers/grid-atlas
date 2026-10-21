import { getLocale } from 'next-intl/server';
export default async function LoadingStories() {
  const uk = (await getLocale()) === 'uk';
  return <section className="page" role="status"><h1>{uk ? 'Завантажуємо історії…' : 'Loading the stories…'}</h1><p>{uk ? 'Шукаємо зафіксовані сезони та джерела.' : 'Finding recorded seasons and sources.'}</p></section>;
}
