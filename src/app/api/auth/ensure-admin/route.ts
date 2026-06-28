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

    const existing = await sql`SELECT id FROM users WHERE email = ${ADMIN_EMAIL}`;
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Admin user already exists', email: ADMIN_EMAIL });
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await sql`
      INSERT INTO users (email, password_hash, role, verified, subscription_plan, subscription_status, subscription_expiry)
      VALUES (${ADMIN_EMAIL}, ${hash}, 'admin', true, 'premium', 'active', NOW() + INTERVAL '1 year')
    `;

    return NextResponse.json({
      message: 'Admin user created',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
  } catch (err: any) {
    console.error('Ensure-admin error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
