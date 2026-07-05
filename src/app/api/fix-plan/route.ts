import { NextResponse } from 'next/server';
import { adminRun } from '@/lib/db';

export async function GET() {
  try {
    await adminRun(
      `UPDATE users SET subscription_plan = 'Premium', subscription_status = 'active', license_status = 'active' WHERE email = 'mambombaya1992@gmail.com'`
    );
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
