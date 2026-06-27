if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
import { NextResponse } from 'next/server';
import { get, adminGet, adminQuery, getPoolForDatabase } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth-server';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkUserTrialStatus } from '@/lib/license';
import { verifyCredentialsInClientDb } from '@/lib/admin';

export async function POST(request: Request) {
  try {
    let { email, password } = await request.json();
    if (email) email = email.trim().toLowerCase();

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = checkRateLimit(`signin:${ip}`, 5, 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    // Step 1: Try admin DB first (legacy/admin users)
    const adminUser = await get('SELECT * FROM users WHERE email = $1', [email]) as any;
    if (adminUser) {
      if (!verifyPassword(password, adminUser.password_hash)) {
        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }
      if (!adminUser.verified) {
        return NextResponse.json({ success: false, error: 'Please verify your email before signing in.' }, { status: 403 });
      }

      const { token } = await createSession(adminUser.id);
      const trialStatus = await checkUserTrialStatus(adminUser.id);

      const response = NextResponse.json({
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.first_name,
          lastName: adminUser.last_name,
          name: [adminUser.first_name, adminUser.last_name].filter(Boolean).join(' ') || adminUser.email.split('@')[0],
          phone: adminUser.phone,
          subscriptionPlan: adminUser.subscription_plan,
          subscriptionStatus: adminUser.subscription_status,
          subscriptionExpiry: adminUser.subscription_expiry,
          verified: !!adminUser.verified,
          licenseStatus: adminUser.license_status || 'trial',
          licenseKey: adminUser.license_key || null,
        },
        trial: trialStatus,
        token,
      });

      response.cookies.set('bl_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // Step 2: Check if user belongs to a client database
    const clientRecord = await adminGet(
      'SELECT id, database_name, company_name FROM admin_clients WHERE email = $1 AND is_active = true',
      [email]
    );

    if (!clientRecord) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    const clientDb = (clientRecord as any).database_name;
    const clientUser = await verifyCredentialsInClientDb(clientDb, email, password);

    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Create session in admin DB with client_db reference
    const { token } = await createSession(clientUser.id, clientDb);
    const clientPool = getPoolForDatabase(clientDb);
    const trialEndRows = await clientPool.query('SELECT trial_end_date FROM users WHERE id = $1', [clientUser.id]);

    const response = NextResponse.json({
      success: true,
      user: {
        id: clientUser.id,
        email: clientUser.email,
        firstName: clientUser.first_name || '',
        lastName: clientUser.last_name || '',
        name: [clientUser.first_name, clientUser.last_name].filter(Boolean).join(' ') || clientUser.email.split('@')[0],
        phone: clientUser.phone || '',
        subscriptionPlan: clientUser.subscription_plan || 'trial',
        subscriptionStatus: clientUser.subscription_status || 'active',
        subscriptionExpiry: clientUser.subscription_expiry,
        verified: !!clientUser.verified,
        licenseStatus: clientUser.license_status || 'trial',
        licenseKey: clientUser.license_key || null,
      },
      trial: {
        is_trial: !!clientUser.trial_end_date,
        end_date: trialEndRows.rows[0]?.trial_end_date || clientUser.trial_end_date,
      },
      token,
    });

    response.cookies.set('bl_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Sign in failed' }, { status: 500 });
  }
}
