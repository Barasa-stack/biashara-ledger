const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixAllTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Creating missing tables...\n');
    
    // 1. Create admin_notifications table
    console.log('📋 Creating admin_notifications...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.admin_notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'info',
        title TEXT DEFAULT '',
        message TEXT NOT NULL,
        link TEXT DEFAULT '',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('  ✅ admin_notifications created');
    
    // 2. Create sessions table
    console.log('📋 Creating sessions...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.sessions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        tenant_id UUID,
        user_id UUID NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('  ✅ sessions created');
    
    // 3. Check users table columns
    console.log('📋 Checking users table...');
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    
    const colNames = columns.rows.map(r => r.column_name);
    console.log('  Existing columns:', colNames.join(', '));
    
    // Add missing columns
    const missingColumns = [];
    if (!colNames.includes('password_hash')) missingColumns.push('password_hash');
    if (!colNames.includes('subscription_plan')) missingColumns.push('subscription_plan');
    if (!colNames.includes('subscription_status')) missingColumns.push('subscription_status');
    if (!colNames.includes('license_status')) missingColumns.push('license_status');
    if (!colNames.includes('country')) missingColumns.push('country');
    
    if (missingColumns.length > 0) {
      console.log('  ➕ Adding missing columns:', missingColumns.join(', '));
      for (const col of missingColumns) {
        if (col === 'password_hash') {
          await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`);
        } else if (col === 'subscription_plan') {
          await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'trial'`);
        } else if (col === 'subscription_status') {
          await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'`);
        } else if (col === 'license_status') {
          await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS license_status TEXT DEFAULT 'active'`);
        } else if (col === 'country') {
          await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'KE'`);
        }
        console.log(`    ✅ Added ${col}`);
      }
    }
    
    console.log('\n✅ All missing tables and columns created!');
    
    // 4. Ensure the user exists
    console.log('\n📋 Checking user...');
    const userCheck = await pool.query(`
      SELECT id, email, password_hash, verified, tenant_id 
      FROM users 
      WHERE email = 'Mambombaya1992@gmail.com'
    `);
    
    if (userCheck.rows.length === 0) {
      console.log('⚠️ User not found, creating...');
      const hashedPassword = await bcrypt.hash('Kaya1992$', 10);
      
      const tenantResult = await pool.query(`
        SELECT id FROM tenants WHERE name = 'dummy_client'
      `);
      const tenantId = tenantResult.rows.length > 0 ? tenantResult.rows[0].id : null;
      
      await pool.query(`
        INSERT INTO users (
          email, password_hash, tenant_id, verified, first_name, last_name, role,
          subscription_plan, subscription_status, license_status, country, created_at
        ) VALUES (
          $1, $2, $3, true, 'Mambombaya', 'User', 'admin',
          'premium', 'active', 'active', 'KE', NOW()
        )
      `, ['Mambombaya1992@gmail.com', hashedPassword, tenantId]);
      
      console.log('  ✅ User created');
    } else {
      console.log('  ✅ User found');
      console.log('    Email:', userCheck.rows[0].email);
      console.log('    Verified:', userCheck.rows[0].verified ? 'Yes' : 'No');
      console.log('    Tenant:', userCheck.rows[0].tenant_id);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

fixAllTables();
