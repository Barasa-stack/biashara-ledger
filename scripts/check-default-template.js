const { Pool } = require('pg');
require('dotenv').config();

async function checkDefaultTemplate() {
  console.log('🔍 Checking default_tenant template...\n');
  console.log('═'.repeat(60));
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. Check if default_tenant exists
    const tenantResult = await pool.query(`
      SELECT id, name, created_at 
      FROM public.tenants 
      WHERE name = 'default_tenant'
    `);
    
    if (tenantResult.rows.length === 0) {
      console.log('❌ default_tenant not found!');
      console.log('   Creating it now...');
      
      await pool.query(`
        INSERT INTO public.tenants (id, name) 
        VALUES (gen_random_uuid(), 'default_tenant')
      `);
      console.log('✅ default_tenant created!');
      
      // Re-fetch
      const newResult = await pool.query(`
        SELECT id, name, created_at 
        FROM public.tenants 
        WHERE name = 'default_tenant'
      `);
      console.log(`  ID: ${newResult.rows[0].id}`);
      console.log(`  Created: ${newResult.rows[0].created_at}`);
    } else {
      console.log('✅ default_tenant exists:');
      console.log(`  ID: ${tenantResult.rows[0].id}`);
      console.log(`  Created: ${tenantResult.rows[0].created_at}`);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('📋 Checking company_settings for default_tenant...\n');
    
    // 2. Check company_settings
    const tenantId = tenantResult.rows[0].id;
    const settingsResult = await pool.query(`
      SELECT 
        company_name,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_pass,
        email,
        phone,
        country,
        created_at
      FROM public.company_settings 
      WHERE tenant_id = $1
    `, [tenantId]);
    
    if (settingsResult.rows.length === 0) {
      console.log('✅ NO company settings - CORRECT!');
      console.log('   This means new tenants won\'t inherit SMTP settings.');
    } else {
      const settings = settingsResult.rows[0];
      console.log('⚠️ Company settings found:');
      console.log(`  Company: ${settings.company_name || 'Not set'}`);
      console.log(`  SMTP Host: ${settings.smtp_host || 'Not set'}`);
      console.log(`  SMTP User: ${settings.smtp_user || 'Not set'}`);
      console.log(`  Email: ${settings.email || 'Not set'}`);
      console.log('\n   ⚠️ This is NOT ideal for a template.');
      console.log('   New tenants would inherit these settings.');
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('📋 Checking essential tables in default_tenant...\n');
    
    // 3. Check if essential tables exist
    const tenantPool = new Pool({
      connectionString: `postgresql://postgres@localhost:5432/default_tenant`,
    });
    
    const essentialTables = [
      'quotations',
      'sales_invoices', 
      'customers',
      'clients',
      'payments',
      'expenses',
      'employees',
      'company_settings'
    ];
    
    let missingTables = [];
    let existingTables = [];
    
    for (const table of essentialTables) {
      const check = await tenantPool.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        )
      `);
      
      if (check.rows[0].exists) {
        existingTables.push(table);
      } else {
        missingTables.push(table);
      }
    }
    
    console.log('  ✅ Tables that exist:');
    existingTables.forEach(t => console.log(`    - ${t}`));
    
    if (missingTables.length > 0) {
      console.log('  ❌ Missing tables:');
      missingTables.forEach(t => console.log(`    - ${t}`));
    }
    
    // 4. Check if essential columns exist
    console.log('\n  🔍 Checking essential columns in quotations...');
    
    const columnsResult = await tenantPool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quotations'
      ORDER BY column_name
    `);
    
    if (columnsResult.rows.length === 0) {
      console.log('  ❌ quotations table does not exist or has no columns');
    } else {
      const columnNames = columnsResult.rows.map(r => r.column_name);
      console.log(`  ✅ quotations has ${columnsResult.rows.length} columns`);
      
      const essentialColumns = ['vat_rate', 'currency', 'exchange_rate', 'discounts'];
      const missingColumns = essentialColumns.filter(c => !columnNames.includes(c));
      
      if (missingColumns.length === 0) {
        console.log('  ✅ All essential columns exist in quotations');
      } else {
        console.log(`  ⚠️ Missing columns in quotations: ${missingColumns.join(', ')}`);
      }
    }
    
    await tenantPool.end();
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 SUMMARY - default_tenant template health:');
    
    const allTablesExist = missingTables.length === 0;
    const hasEssentialColumns = columnsResult.rows.length > 0 && 
      ['vat_rate', 'currency', 'exchange_rate', 'discounts'].every(c => 
        columnsResult.rows.some(r => r.column_name === c)
      );
    const hasNoSMTP = settingsResult.rows.length === 0;
    
    console.log(`  ${allTablesExist ? '✅' : '⚠️'} All essential tables exist: ${allTablesExist ? 'Yes' : 'No'}`);
    console.log(`  ${hasEssentialColumns ? '✅' : '⚠️'} Essential columns exist: ${hasEssentialColumns ? 'Yes' : 'No'}`);
    console.log(`  ${hasNoSMTP ? '✅' : '⚠️'} No SMTP settings (clean template): ${hasNoSMTP ? 'Yes' : 'No'}`);
    
    if (allTablesExist && hasEssentialColumns && hasNoSMTP) {
      console.log('\n🎉 default_tenant is PERFECT! Ready to be used as a template!');
    } else {
      console.log('\n⚠️ default_tenant needs some fixes.');
    }
    
    console.log('\n📝 To access default_tenant:');
    console.log('   Database: default_tenant');
    console.log('   User: Any user with tenant_id = default_tenant ID');
    console.log('   Or create a test user directly in the database');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkDefaultTemplate();
