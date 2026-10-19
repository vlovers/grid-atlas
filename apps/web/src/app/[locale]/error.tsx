'use client';
import { useTranslations } from 'next-intl';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('UI');
  return <section className="page" role="alert"><h1>{t('errorTitle')}</h1><p>{t('errorBody')}</p><button className="primary" onClick={reset}>{t('retry')}</button></section>;
}
