import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSmtpConfig } from '@/lib/email';

export async function GET() {
  const config = await getSmtpConfig();
  if (!config) {
    return NextResponse.json({ found: false });
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });

  try {
    await transporter.verify();
    return NextResponse.json({
      found: true,
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      verified: true,
    });
  } catch (err: any) {
    return NextResponse.json({
      found: true,
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      verified: false,
      error: err.message,
    });
  }
}
