import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);
// Keep static reviewed media and discovery endpoints at the origin root.
// Other dotted paths still receive the existing localized not-found behavior.
export const config = { matcher: '/((?!api(?:/|$)|media(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|sitemap\\.xml$|robots\\.txt$).*)' };
