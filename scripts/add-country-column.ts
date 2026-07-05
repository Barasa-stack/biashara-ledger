import { nile } from '@/lib/nile';

async function addCountryColumn() {
  try {
    await nile.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='users' AND column_name='country') THEN
          ALTER TABLE users ADD COLUMN country VARCHAR(100);
        END IF;
      END $$;
    `);
    console.log('✅ country column added to users table');
  } catch (error) {
    console.error('❌ Failed to add column:', error);
  }
}

addCountryColumn();
