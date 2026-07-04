const { Pool } = require('pg');
require('dotenv').config();

async function checkSMTPSettings() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check if company_settings table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'company_settings'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ company_settings table does not exist!');
      console.log('Please run the database setup first.');
      process.exit(1);
    }
    
    // Check company_settings for SMTP
    const result = await pool.query(`
      SELECT 
        company_name,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_pass,
        email,
        phone
      FROM public.company_settings 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const settings = result.rows[0];
      console.log('📋 SMTP Settings from database:');
      console.log('  Company:', settings.company_name || 'Not set');
      console.log('  SMTP Host:', settings.smtp_host || 'Not set');
      console.log('  SMTP Port:', settings.smtp_port || 'Not set');
      console.log('  SMTP User:', settings.smtp_user || 'Not set');
      console.log('  SMTP Pass:', settings.smtp_pass ? '******** (set)' : 'Not set');
      console.log('  Email:', settings.email || 'Not set');
      console.log('  Phone:', settings.phone || 'Not set');
      
      if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
        console.log('\n⚠️ SMTP settings are incomplete in the database!');
        console.log('Please configure them in the admin panel.');
      } else {
        console.log('\n✅ SMTP settings are configured in the database.');
      }
    } else {
      console.log('⚠️ No company settings found in database');
      console.log('Please configure SMTP in the admin panel first.');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkSMTPSettings();
