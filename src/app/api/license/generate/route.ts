import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { generateLicenseKey, storeLicenseKey } from '@/lib/license';
import { sendLicenseEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email, plan, name } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await get('SELECT id FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (!user) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    const licensePlan = plan || 'standard';
    const licenseKey = generateLicenseKey(email, licensePlan);
    await storeLicenseKey(licenseKey, email, licensePlan, (user as any).id);

    const emailResult = await sendLicenseEmail(email, licenseKey, licensePlan, name || email);

    return NextResponse.json({
      success: true,
      licenseKey,
      plan: licensePlan,
      emailSent: emailResult.sent,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'License generation failed' }, { status: 500 });
  }
}
