import { initCoreTables } from './core';
import { initInventoryModule, initFinancialModule, initAdminModule, initSystemModule } from './modules';
import { initDataMigrations, initConstraints, initIndices, initFinalTenantIdPass } from './migrations';
import { safeExec } from './safe-exec';

export async function initSchema() {
  await initCoreTables();

  await initInventoryModule();
  await initFinancialModule();
  await initAdminModule();
  await initSystemModule();

  await safeExec(`
    INSERT INTO public.admin_users (username, password_hash, email, role)
    VALUES ('admin', '$2b$10$dummy', 'admin@biasharaledger.com', 'super_admin')
    ON CONFLICT (username) DO NOTHING;
  `);

  await safeExec(`
    INSERT INTO public.roles (name, description, permissions) VALUES
      ('admin', 'Full access to all features', '["all"]'),
      ('hr_manager', 'HR and payroll management', '["hr.read","hr.write","payroll.read","payroll.write","dashboard.read"]'),
      ('accountant', 'Accounting and financial reports', '["accounts.read","accounts.write","reports.read","dashboard.read"]'),
      ('employee', 'View own data only', '["dashboard.read","hr.own"]')
    ON CONFLICT (name) DO NOTHING;
  `);

  await initDataMigrations();
  await initConstraints();
  await initIndices();
  await initFinalTenantIdPass();
}
