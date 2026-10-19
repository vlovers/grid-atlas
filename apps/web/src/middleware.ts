import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);
// There are no public file assets. Unknown dotted paths also need a localized
// 404; Next's own assets and the separate API remain outside locale routing.
export const config = { matcher: '/((?!api(?:/|$)|_next(?:/|$)|_vercel(?:/|$)).*)' };
