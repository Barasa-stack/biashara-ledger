import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

export async function setCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  if (existing) return existing;
  
  const token = generateCsrfToken();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
  return token;
}

export async function getCsrfToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  
  if (!cookieToken) return false;

  const contentType = request.headers.get('content-type') || '';
  let headerToken: string | null = null;

  if (contentType.includes('application/json')) {
    try {
      const body = await request.clone().json();
      headerToken = body._csrf || body.csrf_token || null;
    } catch {
      headerToken = null;
    }
  }

  if (!headerToken) {
    headerToken = request.headers.get(CSRF_HEADER_NAME);
  }

  if (!headerToken) return false;

  return timingSafeEqual(cookieToken, headerToken);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function csrfMiddleware(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return handler(request);
    }

    const valid = await validateCsrfToken(request);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return handler(request);
  };
}