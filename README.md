# BiasharaLedger

BiasharaLedger is a tenant-isolated accounting application using Next.js and Nile/Postgres.

## Nile Setup 

Set these environment variables before running the app:
 
```bash
DATABASE_URL="postgres://..."
NILEDB_API_URL="https://..."
ADMIN_EMAIL="admin@example.com"
JWT_SECRET="replace-me"
ENCRYPTION_KEY="replace-me"
```

The runtime initializer in `src/lib/schema.ts` creates all tables and indexes automatically when the app initializes. No manual SQL migration needed.

## Tenant Isolation

Customer data tables use a composite primary key of `(tenant_id, id)`, and the app sets `nile.tenant_id` before tenant-scoped queries. Pre-authentication and admin routes use explicit admin/global database helpers because they must look up sessions, tenants, licenses, or all customers without a tenant context.

Tenant-scoped tables include:

```text
users, sessions, subscription_events, billing_history, customers, clients,
quotations, sales_invoices, payments, credit_notes, purchase_orders,
purchase_invoices, supplier_payments, debit_notes, employees, salaries,
company_settings, expenses, electron_activity
```

Shared/admin tables intentionally do not use `tenant_id`, including `tenants`, `verification_codes`, `roles`, `admin_clients`, `admin_license_keys`, `license_keys`, `licenses`, `analytics`, `backups`, `app_updates`, `email_logs`, and `offline_sessions`.

## Signup And Login

Signup creates a Nile tenant first, then creates the owner user and default company settings under that tenant. Login stores the user tenant ID in the session table, and authenticated API helpers set the tenant context from that session before CRUD operations.

## Verification

Tenant isolation is enforced at the database level via composite primary keys `(tenant_id, id)` and runtime tenant context (`nile.tenant_id`).

Run the application checks:

```bash
npm run build
```

## Data Migration

For migrating data to a Nile database, use `scripts/migrate-consolidated.sql` against a database that already has the runtime schema created by `src/lib/schema.ts`.
