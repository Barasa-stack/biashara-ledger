import { adminRun, withTenantContext } from '../src/lib/db';

const email = 'mambombaya1992@gmail.com';

async function main() {
  // Get user's tenant_id
  const user = await adminRun(
    `SELECT id, tenant_id FROM users WHERE email = $1`,
    [email]
  );
  
  // Update subscription plan
  await adminRun(
    `UPDATE users SET subscription_plan = 'Premium', subscription_status = 'active', license_status = 'active' WHERE email = $1`,
    [email]
  );
  
  console.log('Subscription updated to Premium');
}

main().catch(console.error);
