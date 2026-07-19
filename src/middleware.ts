import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_LOGIN_PATH = '/admin/login';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin') || pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('bl_session')?.value;
  if (!sessionToken) {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
  }

  try {
    const apiUrl = new URL('/api/auth/me', request.url);
    const response = await fetch(apiUrl.toString(), {
      headers: { cookie: `bl_session=${sessionToken}` },
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }

    const data = await response.json();
    if (data?.user?.role !== 'super_admin') {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
    }
  } catch {
    return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
