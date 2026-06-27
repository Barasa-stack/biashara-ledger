#!/bin/bash

echo "===================================================="
echo " BIASHARA LEDGER DATABASE AUDIT"
echo "===================================================="

echo
echo "1. DATABASE_URL in local env"
grep "^DATABASE_URL=" .env.local 2>/dev/null || echo "❌ DATABASE_URL not found in .env.local"

echo
echo "2. ENCRYPTION_KEY in local env"
grep "^ENCRYPTION_KEY=" .env.local 2>/dev/null || echo "❌ ENCRYPTION_KEY missing"

echo
echo "3. Checking db.ts uses DATABASE_URL..."
grep -n "DATABASE_URL" src/lib/db.ts

echo
echo "4. Checking db.ts uses localhost..."
grep -n "localhost" src/lib/db.ts

echo
echo "5. Checking db.ts uses PGHOST..."
grep -n "PGHOST" src/lib/db.ts

echo
echo "6. Checking for connectionString..."
grep -n "connectionString" src/lib/db.ts

echo
echo "7. Checking Pool creation..."
grep -n "new Pool" src/lib/db.ts

echo
echo "8. Searching for hardcoded localhost..."
grep -RIn "localhost" src | grep -v node_modules

echo
echo "9. Searching for 127.0.0.1..."
grep -RIn "127.0.0.1" src

echo
echo "10. Searching for DATABASE_URL usage..."
grep -RIn "DATABASE_URL" src

echo
echo "11. Searching for PGHOST usage..."
grep -RIn "PGHOST" src

echo
echo "12. Searching for ENCRYPTION_KEY..."
grep -RIn "ENCRYPTION_KEY" src

echo
echo "13. Checking Vercel project"
vercel project ls 2>/dev/null || true

echo
echo "14. Pulling Vercel environment..."
vercel env pull .env.vercel >/dev/null 2>&1

echo
echo "15. DATABASE_URL on Vercel"
grep "^DATABASE_URL=" .env.vercel 2>/dev/null || echo "❌ DATABASE_URL missing on Vercel"

echo
echo "16. ENCRYPTION_KEY on Vercel"
grep "^ENCRYPTION_KEY=" .env.vercel 2>/dev/null || echo "❌ ENCRYPTION_KEY missing on Vercel"

echo
echo "17. PGHOST on Vercel"
grep "^PGHOST=" .env.vercel 2>/dev/null || echo "❌ PGHOST not set"

echo
echo "18. PGDATABASE on Vercel"
grep "^PGDATABASE=" .env.vercel 2>/dev/null || echo "❌ PGDATABASE not set"

echo
echo "19. PGPASSWORD on Vercel"
grep "^PGPASSWORD=" .env.vercel 2>/dev/null || echo "❌ PGPASSWORD not set"

echo
echo "20. Build test"
npm run build

echo
echo "===================================================="
echo " AUDIT COMPLETE"
echo "===================================================="
