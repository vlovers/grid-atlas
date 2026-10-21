import { getLocale } from 'next-intl/server';
export default async function MissingStory() {
  const locale = (await getLocale()) === 'en' ? 'en' : 'uk';
  return <section className="page"><h1>{locale === 'uk' ? 'Історію не знайдено' : 'Story not found'}</h1><a href={`/${locale}/stories`}>{locale === 'uk' ? 'До історій пілотів' : 'Back to driver stories'}</a></section>;
}
