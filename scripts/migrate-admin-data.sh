#!/bin/bash
# Migrate existing data from biashara_ledger to the admin's own client database
# Run after setting up the template database
#
# This script:
# 1. Creates a client database for the admin (evanromanoff@gmail.com)
# 2. Copies all data into it
# 3. Registers the client in admin_clients

set -e

PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-biashara_ledger}"
ADMIN_EMAIL="${ADMIN_EMAIL:-evanromanoff@gmail.com}"
ADMIN_CLIENT_DB="client_biasharaledger_admin"
TEMPLATE_DB="biashara_ledger_template"

echo "=== Migrating existing data to admin's client database ==="

# 1. Create admin's client database from template
echo "Creating admin client database: $ADMIN_CLIENT_DB ..."
dropdb -U "$PGUSER" "$ADMIN_CLIENT_DB" 2>/dev/null || true
createdb -U "$PGUSER" -T "$TEMPLATE_DB" "$ADMIN_CLIENT_DB"

# 2. Copy data from source to admin client DB
echo "Copying users data..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM users) TO '/tmp/users_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY users FROM '/tmp/users_data.csv' CSV HEADER"

echo "Copying customers data..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM customers) TO '/tmp/customers_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY customers FROM '/tmp/customers_data.csv' CSV HEADER"

echo "Copying clients (suppliers) data..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM clients) TO '/tmp/clients_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY clients FROM '/tmp/clients_data.csv' CSV HEADER"

echo "Copying employees data..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM employees) TO '/tmp/employees_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY employees FROM '/tmp/employees_data.csv' CSV HEADER"

echo "Copying company_settings..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM company_settings) TO '/tmp/company_settings_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY company_settings FROM '/tmp/company_settings_data.csv' CSV HEADER"

echo "Copying sales_invoices..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM sales_invoices) TO '/tmp/sales_invoices_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY sales_invoices FROM '/tmp/sales_invoices_data.csv' CSV HEADER"

echo "Copying quotations..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM quotations) TO '/tmp/quotations_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY quotations FROM '/tmp/quotations_data.csv' CSV HEADER"

echo "Copying payments..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM payments) TO '/tmp/payments_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY payments FROM '/tmp/payments_data.csv' CSV HEADER"

echo "Copying credit_notes..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM credit_notes) TO '/tmp/credit_notes_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY credit_notes FROM '/tmp/credit_notes_data.csv' CSV HEADER"

echo "Copying expenses..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM expenses) TO '/tmp/expenses_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY expenses FROM '/tmp/expenses_data.csv' CSV HEADER"

echo "Copying purchase_orders..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM purchase_orders) TO '/tmp/purchase_orders_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY purchase_orders FROM '/tmp/purchase_orders_data.csv' CSV HEADER"

echo "Copying purchase_invoices..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM purchase_invoices) TO '/tmp/purchase_invoices_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY purchase_invoices FROM '/tmp/purchase_invoices_data.csv' CSV HEADER"

echo "Copying debit_notes..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM debit_notes) TO '/tmp/debit_notes_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY debit_notes FROM '/tmp/debit_notes_data.csv' CSV HEADER"

echo "Copying salaries..."
psql -U "$PGUSER" -d "$PGDATABASE" -c "\COPY (SELECT * FROM salaries) TO '/tmp/salaries_data.csv' CSV HEADER"
psql -U "$PGUSER" -d "$ADMIN_CLIENT_DB" -c "\COPY salaries FROM '/tmp/salaries_data.csv' CSV HEADER"

# 3. Generate license key and register admin client
echo "Registering admin client in admin_clients table..."
LICENSE_KEY="BL-2024-ADMIN-${ADMIN_EMAIL}"

psql -U "$PGUSER" -d "$PGDATABASE" -c "
INSERT INTO admin_clients (company_name, email, database_name, license_key, max_users, is_active, is_trial)
VALUES ('BiasharaLedger Admin', '$ADMIN_EMAIL', '$ADMIN_CLIENT_DB', '$LICENSE_KEY', 999, true, false)
ON CONFLICT (email) DO UPDATE SET database_name = '$ADMIN_CLIENT_DB', license_key = '$LICENSE_KEY', is_active = true;
"

psql -U "$PGUSER" -d "$PGDATABASE" -c "
INSERT INTO admin_license_keys (license_key, client_id, plan, is_used, expires_at)
SELECT '$LICENSE_KEY', id, 'premium', true, CURRENT_TIMESTAMP + INTERVAL '100 years'
FROM admin_clients WHERE email = '$ADMIN_EMAIL'
ON CONFLICT (license_key) DO NOTHING;
"

echo ""
echo "=== Migration Complete! ==="
echo "Admin client database: $ADMIN_CLIENT_DB"
echo "License Key: $LICENSE_KEY"
echo ""
echo "NOTE: Admin users (evanromanoff@gmail.com) still authenticate"
echo "against the main biashara_ledger database. The admin client DB"
echo "is where the demo data lives."
echo ""
echo "New clients will get fresh databases cloned from the template."
echo ""
