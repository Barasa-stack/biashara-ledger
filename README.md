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

Run the Nile schema migration before serving production traffic:

```bash
psql "$DATABASE_URL" -f scripts/migrate-to-nile.sql
```

The runtime initializer in `src/lib/schema.ts` also creates the current tables and indexes when the app initializes.

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

Run the tenant isolation check against a Nile database:

```bash
npm run verify:tenant-isolation
```

The script creates two tenants, inserts tenant-specific customers, and fails if either tenant can read the other's data.

Run the application checks:

```bash
npm run build
```

## Existing Data Migration

Use `scripts/migrate-to-nile.sql` for the current Nile schema. The older `scripts/migrate-data.ts` is retained for custom Neon-to-Nile data migration work, but it should be reviewed against the source database schema before running because legacy column names may differ from the current application schema. 
