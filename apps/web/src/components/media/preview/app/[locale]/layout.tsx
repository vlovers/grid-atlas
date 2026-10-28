import type { ReactNode } from 'react';
import './preview.css';
import '../../../../../app/fonts.css';

export const metadata = { title: 'Grid Atlas media preview', robots: { index: false, follow: false } };
export default async function PreviewLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <html lang={locale === 'uk' ? 'uk' : 'en'}><body>{children}</body></html>;
}
