#!/bin/bash
# Setup template database for multi-tenant BiasharaLedger
# Run this once after schema changes to create/update the template

set -e

PGUSER="${PGUSER:-postgres}"
TEMPLATE_DB="biashara_ledger_template"
SOURCE_DB="${PGDATABASE:-biashara_ledger}"

echo "=== Setting up template database: $TEMPLATE_DB ==="

# 1. Drop existing template if it exists
echo "Dropping old template (if exists)..."
dropdb -U "$PGUSER" "$TEMPLATE_DB" 2>/dev/null || true

# 2. Create template from source DB schema (no data)
echo "Dumping schema from $SOURCE_DB..."
pg_dump -U "$PGUSER" -s "$SOURCE_DB" > /tmp/biashara_ledger_schema.sql

# 3. Create empty template database
echo "Creating template database..."
createdb -U "$PGUSER" "$TEMPLATE_DB"

# 4. Import schema
echo "Importing schema..."
psql -U "$PGUSER" -d "$TEMPLATE_DB" -f /tmp/biashara_ledger_schema.sql

# 5. Remove seed data (company_settings row, roles, etc.)
echo "Cleaning seed data from template..."
psql -U "$PGUSER" -d "$TEMPLATE_DB" -c "DELETE FROM company_settings;"
psql -U "$PGUSER" -d "$TEMPLATE_DB" -c "DELETE FROM roles;"
psql -U "$PGUSER" -d "$TEMPLATE_DB" -c "DELETE FROM users;"
psql -U "$PGUSER" -d "$TEMPLATE_DB" -c "DELETE FROM sessions;"

# 6. Verify
echo "Verifying template..."
psql -U "$PGUSER" -d "$TEMPLATE_DB" -c "\dt"

echo ""
echo "=== Template database '$TEMPLATE_DB' is ready! ==="
echo "New client databases will be cloned from this template."
echo ""
echo "To create a client database manually:"
echo "  createdb -U $PGUSER -T $TEMPLATE_DB client_companyname_123"
echo ""
