import type { ReactNode } from 'react';
import '../prototype.css';
export const metadata = { title: 'Grid Atlas · circuit visual proposal', robots: { index: false, follow: false } };
export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  return <html lang={(await params).locale === 'uk' ? 'uk' : 'en'}><body>{children}</body></html>;
}
