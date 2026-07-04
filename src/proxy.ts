import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PATH = '/admin';
const ADMIN_LOGIN_PATH = '/admin/login';
const ADMIN_API_PREFIX = '/api/admin';

const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https:; frame-ancestors 'none'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";

const DASHBOARD_PATH = '/dashboard';
const DASHBOARD_LOGIN_PATH = '/sign-in';
const RENEW_PATH = '/renew';
const PROTECTED_ROUTES = ['/dashboard', '/admin', '/payment', '/select-package'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('bl_session');

  if (pathname === '/sign-up' && request.method === 'POST') {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  if (pathname.startsWith(ADMIN_PATH) || pathname.startsWith(ADMIN_API_PREFIX)) {
    if (!sessionCookie) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }
  }

  if (pathname.startsWith(DASHBOARD_PATH)) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL(DASHBOARD_LOGIN_PATH, request.url));
    }
  }

  if ((pathname.startsWith('/payment') || pathname.startsWith('/select-package')) && !sessionCookie) {
    return NextResponse.redirect(new URL(DASHBOARD_LOGIN_PATH, request.url));
  }

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`,
    'https://biashara-ledger.vercel.app',
    'https://biasharaledger.com',
  ].filter(Boolean);

  const getCorsHeaders = (origin: string | null) => ({
    'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || '*'),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-csrf-token, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  });

  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }

  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    const response = NextResponse.next();
    Object.entries(getCorsHeaders(origin)).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }

  const response = NextResponse.next();

  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  if (pathname.startsWith('/_next/') || pathname.startsWith('/api/') || pathname.startsWith('/dashboard')) {
    response.headers.set('Content-Security-Policy', CSP);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.svg|downloads/|images/).*)'],
};
