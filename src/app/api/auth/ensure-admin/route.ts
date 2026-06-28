import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization');
    if (auth !== 'setup') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const ADMIN_EMAIL = 'digitalbaroz@gmail.com';
    const ADMIN_PASSWORD = 'Admin123!';

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await sql`
      INSERT INTO users (email, password_hash, role, verified, subscription_plan, subscription_status, subscription_expiry)
      VALUES (${ADMIN_EMAIL}, ${hash}, 'admin', true, 'premium', 'active', NOW() + INTERVAL '1 year')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'admin',
        verified = true,
        subscription_status = 'active',
        subscription_expiry = NOW() + INTERVAL '1 year'
    `;

    return NextResponse.json({
      message: 'Admin user created/updated',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
  } catch (err: any) {
    console.error('Ensure-admin error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
