import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSmtpConfig } from '@/lib/email';

export async function GET() {
  const config = await getSmtpConfig();
  if (!config) {
    return NextResponse.json({
      found: false,
      env_smtp_host: process.env.SMTP_HOST ? `set (${process.env.SMTP_HOST.length} chars)` : '(not set)',
      env_smtp_user: process.env.SMTP_USER ? `set (${process.env.SMTP_USER.length} chars)` : '(not set)',
      env_smtp_pass: process.env.SMTP_PASSWORD ? `set (${process.env.SMTP_PASSWORD.length} chars)` : '(not set)',
      env_smtp_port: process.env.SMTP_PORT || '(not set)',
    });
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
      user: config.user,
      pass_len: config.pass.length,
      verified: true,
    });
  } catch (err: any) {
    return NextResponse.json({
      found: true,
      host: config.host,
      port: config.port,
      user: config.user,
      pass_len: config.pass.length,
      verified: false,
      error: err.message.split('\n')[0],
    });
  }
}
