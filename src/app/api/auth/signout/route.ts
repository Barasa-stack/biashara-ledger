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
  response.cookies.clear('bl_session');

  return response;
}
