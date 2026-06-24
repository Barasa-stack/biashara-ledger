import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const transactionId = `PAYPAL-${Date.now()}`;

    return NextResponse.json({
      success: true,
      transactionId,
      message: 'PayPal payment simulated successfully.',
      _demoAutoConfirm: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment failed' }, { status: 500 });
  }
}
