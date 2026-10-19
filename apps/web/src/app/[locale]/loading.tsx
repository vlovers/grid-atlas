import { useTranslations } from 'next-intl';
export default function Loading() {
  const t = useTranslations('UI');
  return <section className="page" role="status" aria-live="polite"><p className="eyebrow">GRID ATLAS / {t('archive')}</p><h1>{t('loadingTitle')}</h1><p>{t('loadingBody')}</p></section>;
}
