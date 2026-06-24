import { NextResponse } from 'next/server';
import { setCsrfToken } from '@/lib/csrf';

export async function GET() {
  const token = await setCsrfToken();
  return NextResponse.json({ token });
}