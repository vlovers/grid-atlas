import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);
// Keep discovery endpoints at the origin root; other dotted paths still 404.
export const config = { matcher: '/((?!api(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|sitemap\\.xml$|robots\\.txt$).*)' };
