import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/auth-server';
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('bl_session')?.value;
  if (token) {
    await deleteSession(token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('bl_session', '', { maxAge: 0 });
  response.cookies.set('bl_device_token', '', { maxAge: 0 });
  response.cookies.set('user_plan', '', { maxAge: 0 });
  response.cookies.set('user_subscription_expiry', '', { maxAge: 0 });

  return response;
}
