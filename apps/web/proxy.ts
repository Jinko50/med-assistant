import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { backendConfigured } from './lib/config';
import { isLocale } from './lib/i18n';

export async function proxy(request: NextRequest) {
  const locale = request.nextUrl.pathname.split('/')[1];
  request.headers.set('x-med-locale', isLocale(locale) ? locale : 'en');
  let response = NextResponse.next({ request });
  if (backendConfigured() && /\/(workspace|records|login)(\/|$)/.test(request.nextUrl.pathname)) {
    const client = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
      global: { fetch: (url, init) => fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(10000) }) },
    });
    try { await client.auth.getUser(); } catch { /* DAL will fail closed. Do not log tokens. */ }
  }
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'] };
