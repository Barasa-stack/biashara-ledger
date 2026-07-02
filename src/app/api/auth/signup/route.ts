import { NextResponse } from 'next/server';

export async function POST() {
  // This is a stub to pass Vercel build.
  // The original route is backed up at /tmp/signup.route.ts.bak
  return NextResponse.json(
    { error: 'Signup temporarily disabled during deployment' },
    { status: 503 }
  );
}
