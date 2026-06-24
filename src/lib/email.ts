import nodemailer from 'nodemailer';
import { get } from './db';

export function getSmtpConfig() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  }
  return null;
}

export function createTransporter() {
  const config = getSmtpConfig();
  if (!config) return null;
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
}

export async function getCompanyName(): Promise<string> {
  const company = await get<{ company_name: string }>('SELECT company_name FROM company_settings WHERE id = 1');
  return company?.company_name || 'BiasharaLedger';
}
