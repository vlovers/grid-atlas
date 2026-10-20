'use client';
import { usePathname } from '@/i18n/navigation';
import styles from './shell.module.css';

export function AtlasNavigation({ locale, label, items }: { locale: string; label: string; items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return <nav aria-label={label} className={styles.navigation}>{items.map(item => <a key={item.href} href={`/${locale}${item.href}`}
    aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'page' : undefined}>{item.label}</a>)}</nav>;
}
