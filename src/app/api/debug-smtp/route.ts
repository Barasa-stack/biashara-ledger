import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const port = process.env.SMTP_PORT || '587';

  if (!host || !user || !pass) {
    return NextResponse.json({
      error: 'Missing SMTP env vars',
      host: host ? 'ok' : 'missing',
      user: user ? 'ok' : 'missing',
      pass: pass ? `ok (${pass.length} chars)` : 'missing',
    });
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: port === '465',
    auth: { user, pass },
  });

  try {
    await transporter.verify();
    return NextResponse.json({ success: true, message: 'SMTP connection verified!' });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message.split('\n')[0],
      code: err.code,
    });
  }
}
