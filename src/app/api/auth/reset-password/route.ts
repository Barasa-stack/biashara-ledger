import { NextResponse } from 'next/server';
import { get, run, adminGet, adminRun, getPoolForDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    let { email, newPassword, otp } = await request.json();
    if (email) email = email.trim().toLowerCase();

    if (!email || !newPassword || !otp) {
      return NextResponse.json({ error: 'Email, new password, and OTP are required' }, { status: 400 });
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters with an uppercase letter and a number' }, { status: 400 });
    }

    // Check admin DB first
    const adminUser = await get('SELECT id FROM users WHERE email = $1', [email]) as any;
    const clientRecord = !adminUser ? await adminGet(
      'SELECT id, database_name FROM admin_clients WHERE email = $1 AND is_active = true',
      [email]
    ) as any : null;

    if (!adminUser && !clientRecord) {
      return NextResponse.json({ error: 'No account found with that email' }, { status: 404 });
    }

    const stored = await get(
      "SELECT * FROM verification_codes WHERE email = $1 AND purpose = 'password_reset' AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
      [email]
    ) as any;

    if (!stored) {
      return NextResponse.json({ error: 'No valid verification code found. Request a new one.' }, { status: 400 });
    }

    if (stored.code !== otp) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await run('UPDATE verification_codes SET used = 1 WHERE id = $1', [stored.id]);

    const passwordHash = hashPassword(newPassword);

    if (adminUser) {
      await run('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, adminUser.id]);
    } else if (clientRecord) {
      const clientPool = getPoolForDatabase(clientRecord.database_name);
      await clientPool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Password reset failed' }, { status: 500 });
  }
}
