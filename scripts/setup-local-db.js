const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  const ADMIN_EMAIL = 'Evanromanoff@gmail.com';
  const ADMIN_PASSWORD = 'Admin123!';

  try {
    console.log('🔄 Setting up database...\n');
    await pool.query('SELECT 1');
    console.log('✅ Database connected successfully!\n');

    console.log('📋 Creating tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        role VARCHAR(50) DEFAULT 'user',
        verified BOOLEAN DEFAULT FALSE,
        subscription_plan VARCHAR(50) DEFAULT 'trial',
        subscription_status VARCHAR(50) DEFAULT 'inactive',
        subscription_expiry TIMESTAMP,
        grace_period_end TIMESTAMP,
        last_reminder_sent TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Users table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2),
        plan_name VARCHAR(100),
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        period_start TIMESTAMP,
        period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Billing history table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        event_type VARCHAR(100),
        description TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Subscription events table');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        client_db VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Sessions table\n');

    console.log('👤 Creating admin user...');
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [ADMIN_EMAIL]);

    if (existing.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await pool.query(
        `INSERT INTO users (email, password, role, verified, subscription_plan, subscription_status, subscription_expiry)
         VALUES ($1, $2, 'admin', true, 'premium', 'active', NOW() + INTERVAL '1 year')`,
        [ADMIN_EMAIL, hashedPassword]
      );
      console.log('  ✅ Admin user created!');
      console.log(`  📧 Email: ${ADMIN_EMAIL}`);
      console.log(`  🔑 Password: ${ADMIN_PASSWORD}`);
    } else {
      console.log('  ℹ️ Admin user already exists');
      console.log(`  📧 Email: ${existing.rows[0].email}`);
    }

    const users = await pool.query('SELECT id, email, role, verified, subscription_status FROM users ORDER BY id');
    console.log('\n📊 Current users:');
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) [${user.verified ? '✅ Verified' : '❌ Unverified'}] - ${user.subscription_status}`);
    });

    console.log('\n🎉 Setup complete!');
    console.log('🔗 Login at: http://localhost:3000/admin/login');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();
