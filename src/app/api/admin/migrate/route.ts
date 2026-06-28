import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  const url = req.url;
  console.log('Migrate endpoint called, url:', url);

  try {
    const parsed = new URL(url);
    const secret = parsed.searchParams.get('secret');
    console.log('Secret from query:', secret);

    if (secret !== 'migrate-admin-2024') {
      return NextResponse.json({ error: 'Unauthorized', url, secret }, { status: 401 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const clients = [
      ['BiasharaLedger Admin', 'evanromanoff@gmail.com', 'client_biasharaledger_admin', 'BL-2024-ADMIN-evanromanoff@gmail.com', 999, true, false],
      ['fergy solutions', 'benfergy18@gmail.com', 'client_fergy_solutions_mqw03mjh', 'BL-2026-678c24b3-76f33221', 5, true, true],
    ];

    const results: string[] = [];
    for (const [name, email, db, lk, max, active, trial] of clients) {
      await sql`
        INSERT INTO admin_clients (company_name, email, database_name, license_key, max_users, is_active, is_trial)
        VALUES (${name}, ${email}, ${db}, ${lk}, ${max}, ${active}, ${trial})
        ON CONFLICT (email) DO UPDATE SET company_name = EXCLUDED.company_name, license_key = EXCLUDED.license_key, is_active = EXCLUDED.is_active
      `;
      results.push(`Client: ${name}`);
    }

    const keys = [
      ['BL-2024-ADMIN-evanromanoff@gmail.com', 'evanromanoff@gmail.com', 'premium', true, '2126-06-25T17:44:02.851Z'],
      ['BL-2026-678c24b3-76f33221', 'benfergy18@gmail.com', 'standard', false, '2027-06-27T09:50:39.820Z'],
    ];

    for (const [lk, email, plan, used, expires] of keys) {
      const client = await sql`SELECT id FROM admin_clients WHERE email = ${email} LIMIT 1`;
      if (client.length > 0) {
        await sql`
          INSERT INTO admin_license_keys (license_key, client_id, plan, is_used, expires_at)
          VALUES (${lk}, ${client[0].id}, ${plan}, ${used}, ${expires})
          ON CONFLICT (license_key) DO UPDATE SET client_id = EXCLUDED.client_id, plan = EXCLUDED.plan, is_used = EXCLUDED.is_used
        `;
        results.push(`License: ${lk}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
