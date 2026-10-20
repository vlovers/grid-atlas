import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const localize = createMiddleware(routing);
export default function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(
    "x-grid-atlas-location",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return localize(new NextRequest(request, { headers }));
}
// Keep static reviewed media and discovery endpoints at the origin root.
// Other dotted paths still receive the existing localized not-found behavior.
// prettier-ignore
export const config = { matcher: '/((?!api(?:/|$)|media(?:/|$)|_next(?:/|$)|_vercel(?:/|$)|sitemap\\.xml$|robots\\.txt$).*)' };
