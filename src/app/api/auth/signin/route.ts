import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { adminGet, getOrCreatePool } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`signin:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    let user = (await sql`SELECT * FROM users WHERE email = ${email}`)[0];
    let clientDb = '';

    // Check if user is in a client schema
    if (!user) {
      const clientRecord = await adminGet(
        'SELECT database_name FROM admin_clients WHERE email = $1 AND is_active = true',
        [email]
      );
      if (clientRecord) {
        const schemaName = (clientRecord as any).database_name;
        const pool = getOrCreatePool(5, schemaName);
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        user = result.rows[0];
        clientDb = schemaName;
      }

      // If not in admin_clients, check auto-created user schemas
      if (!user) {
        const schemas = await sql`
          SELECT schema_name FROM information_schema.schemata
          WHERE schema_name LIKE 'usr\_%' OR schema_name LIKE 'cli\_%'
        `;
        for (const row of schemas) {
          const schemaName = row.schema_name as string;
          try {
            const pool = getOrCreatePool(5, schemaName);
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            if (result.rows.length > 0) {
              user = result.rows[0];
              clientDb = schemaName;
              break;
            }
          } catch {}
        }
      }
    }

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      INSERT INTO sessions (user_id, token, expires_at, client_db)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt}, ${clientDb})
    `;

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name || '' }
    });

    response.cookies.set('bl_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
