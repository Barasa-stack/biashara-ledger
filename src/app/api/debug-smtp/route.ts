import { NextResponse } from 'next/server';
import { getSmtpConfig } from '@/lib/email';

export async function GET() {
  const config = await getSmtpConfig();
  if (config) {
    return NextResponse.json({
      found: true,
      host: config.host,
      port: config.port,
      user: config.user,
      pass: config.pass ? '***' : '',
    });
  }
  return NextResponse.json({ found: false });
}
