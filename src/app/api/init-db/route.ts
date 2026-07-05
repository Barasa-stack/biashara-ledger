import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = process.env.NILEDB_USER;
    const password = process.env.NILEDB_PASSWORD;
    const host = process.env.NILEDB_HOST || 'us-west-2.db.thenile.dev';
    const port = process.env.NILEDB_PORT || '5432';
    const database = process.env.NILEDB_DATABASE || 'Biasharaledger_App';
    
    if (!user || !password) {
      return NextResponse.json({ error: 'Nile credentials not set' }, { status: 500 });
    }
    
    const connectionString = `postgres://${user}:${password}@${host}:${port}/${database}`;
    
    const pool = new Pool({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });

    // Create tenants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create default tenant
    let tenantId;
    const tenantCheck = await pool.query(`
      SELECT id FROM tenants WHERE name = 'default_tenant'
    `);
    
    if (tenantCheck.rows.length === 0) {
      const tenantResult = await pool.query(`
        INSERT INTO tenants (id, name) 
        VALUES (gen_random_uuid(), 'default_tenant')
        RETURNING id
      `);
      tenantId = tenantResult.rows[0].id;
    } else {
      tenantId = tenantCheck.rows[0].id;
    }

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT DEFAULT '',
        last_name TEXT DEFAULT '',
        role TEXT DEFAULT 'user',
        verified BOOLEAN DEFAULT true,
        subscription_plan TEXT DEFAULT 'premium',
        subscription_status TEXT DEFAULT 'active',
        license_status TEXT DEFAULT 'active',
        country TEXT DEFAULT 'KE',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (id)
      )
    `);

    // Create admin user
    const adminEmail = 'digitalbaroz@gmail.com';
    const adminPassword = 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await pool.query(`
      INSERT INTO users (
        email, password_hash, tenant_id, verified, 
        first_name, last_name, role, 
        subscription_plan, subscription_status, license_status,
        country, created_at
      ) VALUES (
        $1, $2, $3, true,
        'Admin', 'User', 'admin',
        'premium', 'active', 'active',
        'KE', NOW()
      )
      ON CONFLICT (email) DO NOTHING
    `, [adminEmail, hashedPassword, tenantId]);

    await pool.end();

    return NextResponse.json({ 
      success: true, 
      message: 'Database initialized successfully!',
      tenantId: tenantId,
      adminEmail: adminEmail,
      password: adminPassword
    });
  } catch (err: any) {
    console.error('Init error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
