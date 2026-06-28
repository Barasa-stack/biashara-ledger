import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  try {
    const secret = req.headers.get('x-migrate-secret');
    if (secret !== 'migrate-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = neon(process.env.DATABASE_URL!);
    const results: string[] = [];

    const adminClients = [
      {
        company_name: 'BiasharaLedger Admin',
        email: 'evanromanoff@gmail.com',
        database_name: 'client_biasharaledger_admin',
        license_key: 'BL-2024-ADMIN-evanromanoff@gmail.com',
        max_users: 999,
        is_active: true,
        is_trial: false,
      },
      {
        company_name: 'fergy solutions',
        email: 'benfergy18@gmail.com',
        database_name: 'client_fergy_solutions_mqw03mjh',
        license_key: 'BL-2026-678c24b3-76f33221',
        max_users: 5,
        is_active: true,
        is_trial: true,
        trial_start_date: '2026-06-27T09:50:39.814Z',
        trial_end_date: '2026-07-11T09:50:39.814Z',
      },
    ];

    for (const c of adminClients) {
      await sql`
        INSERT INTO admin_clients (company_name, email, database_name, license_key, max_users, is_active, is_trial, trial_start_date, trial_end_date)
        VALUES (${c.company_name}, ${c.email}, ${c.database_name}, ${c.license_key}, ${c.max_users}, ${c.is_active}, ${c.is_trial}, ${c.trial_start_date || null}, ${c.trial_end_date || null})
        ON CONFLICT (email) DO UPDATE SET
          company_name = EXCLUDED.company_name,
          license_key = EXCLUDED.license_key,
          max_users = EXCLUDED.max_users,
          is_active = EXCLUDED.is_active
      `;
      results.push(`Admin client '${c.company_name}' (${c.email}) created/updated`);
    }

    const licenseKeys = [
      {
        license_key: 'BL-2024-ADMIN-evanromanoff@gmail.com',
        client_email: 'evanromanoff@gmail.com',
        plan: 'premium',
        is_used: true,
        expires_at: '2126-06-25T17:44:02.851Z',
      },
      {
        license_key: 'BL-2026-678c24b3-76f33221',
        client_email: 'benfergy18@gmail.com',
        plan: 'standard',
        is_used: false,
        expires_at: '2027-06-27T09:50:39.820Z',
      },
    ];

    for (const lk of licenseKeys) {
      const client = await sql`SELECT id FROM admin_clients WHERE email = ${lk.client_email} LIMIT 1`;
      if (client.length > 0) {
        await sql`
          INSERT INTO admin_license_keys (license_key, client_id, plan, is_used, expires_at)
          VALUES (${lk.license_key}, ${client[0].id}, ${lk.plan}, ${lk.is_used}, ${lk.expires_at})
          ON CONFLICT (license_key) DO UPDATE SET
            client_id = EXCLUDED.client_id,
            plan = EXCLUDED.plan,
            is_used = EXCLUDED.is_used,
            expires_at = EXCLUDED.expires_at
        `;
        results.push(`License '${lk.license_key}' created/updated`);
      } else {
        await sql`
          INSERT INTO admin_license_keys (license_key, plan, is_used, expires_at)
          VALUES (${lk.license_key}, ${lk.plan}, ${lk.is_used}, ${lk.expires_at})
          ON CONFLICT (license_key) DO NOTHING
        `;
        results.push(`License '${lk.license_key}' created (no client)`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration complete',
      results,
    });
  } catch (err: any) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
