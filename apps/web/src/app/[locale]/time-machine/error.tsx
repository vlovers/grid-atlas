'use client';

import { useTranslations } from 'next-intl';
import styles from './time-machine.module.css';

export default function TimeMachineError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('UI');
  return <section className={`page ${styles.page}`}>
    <p className="eyebrow">{t('archive')} / {t('timeMachineTitle')}</p>
    <h1>{t('timeMachineTitle')}</h1>
    <p className={styles.error} role="alert">{t('timeMachineUnavailable')}</p>
    <button className="secondary" type="button" onClick={reset}>{t('retry')}</button>
  </section>;
}
