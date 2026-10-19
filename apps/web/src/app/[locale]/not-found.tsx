import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
export default function NotFound() {
  const t = useTranslations('UI');
  return <section className="page"><h1>{t('notFoundTitle')}</h1><p>{t('notFoundBody')}</p><Link className="primary" href="/">{t('home')}</Link></section>;
}
