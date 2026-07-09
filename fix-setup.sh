#!/bin/bash

set -e

echo "========================================="
echo " BIASHARA LEDGER AUTO FIX"
echo "========================================="

DB="src/lib/db.ts"

echo
echo "[1/5] Checking .env.local..."

touch .env.local

if ! grep -q "^ENCRYPTION_KEY=" .env.local; then
  KEY=$(openssl rand -hex 32)
  echo "" >> .env.local
  echo "ENCRYPTION_KEY=$KEY" >> .env.local
  echo "✓ Generated ENCRYPTION_KEY"
else
  echo "✓ ENCRYPTION_KEY already exists"
fi

if grep -q "^DATABASE_URL=" .env.local; then
  echo "✓ DATABASE_URL exists"
else
  echo "⚠ DATABASE_URL missing from .env.local"
fi

echo
echo "[2/5] Backing up db.ts..."
cp "$DB" "$DB.bak"

echo
echo "[3/5] Updating db.ts..."

perl -0777 -i -pe 's/new Pool\(\{\s*host:\s*process\.env\.PGHOST\s*\|\|\s*'\''localhost'\''\s*,\s*port:\s*parseInt\(process\.env\.PGPORT\s*\|\|\s*'\''5432'\''\)\s*,\s*database\s*,\s*user:\s*process\.env\.PGUSER\s*\|\|\s*'\''postgres'\''\s*,\s*password:\s*process\.env\.PGPASSWORD\s*\|\|\s*'\'''\''\s*,\s*max\s*,\s*idleTimeoutMillis:\s*30000\s*,\s*connectionTimeoutMillis:\s*5000\s*,\s*\}\)/new Pool(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 } : { host: process.env.PGHOST || '\''localhost'\'', port: parseInt(process.env.PGPORT || '\''5432'\''), database, user: process.env.PGUSER || '\''postgres'\'', password: process.env.PGPASSWORD || '\'''\'', max, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 })/sg' "$DB" || true

echo
echo "[4/5] Verification"

grep -n "connectionString" "$DB" || echo "❌ DATABASE_URL still not used"

grep -n "localhost" "$DB"

grep ENCRYPTION_KEY .env.local

echo
echo "[5/5] Build test"

npm run build || true

echo
echo "========================================="
echo "DONE"
echo "========================================="
echo
echo "Next run:"
echo
echo "vercel env add ENCRYPTION_KEY production"
echo "vercel env add ENCRYPTION_KEY preview"
echo
echo "vercel env ls"
echo
echo "If build passes:"
echo
echo "vercel --prod"

