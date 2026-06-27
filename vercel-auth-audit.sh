#!/usr/bin/env bash

clear

echo "======================================================"
echo " BIASHARA LEDGER AUTH + DATABASE DIAGNOSTIC"
echo "======================================================"

echo
echo "[1] Vercel Project"
vercel project ls

echo
echo "[2] Production Environment Variables"
vercel env ls production

echo
echo "[3] Pull Production Environment"
vercel env pull .env.production --environment=production >/dev/null

echo
echo "[4] DATABASE_URL"

DB=$(grep '^DATABASE_URL=' .env.production | cut -d= -f2- | tr -d '"')

if [ -z "$DB" ]; then
    echo "❌ DATABASE_URL is EMPTY"
else
    echo "✅ DATABASE_URL exists"

    if [[ "$DB" == postgres* ]]; then
        echo "✅ Looks like a PostgreSQL connection string"
    else
        echo "❌ DATABASE_URL is malformed"
    fi
fi

echo
echo "[5] ENCRYPTION_KEY"

grep -q '^ENCRYPTION_KEY=' .env.production \
&& echo "✅ ENCRYPTION_KEY exists" \
|| echo "❌ ENCRYPTION_KEY missing"

echo
echo "[6] Database connection code"

grep -n "connectionString\|DATABASE_URL\|localhost\|PGHOST" src/lib/db.ts

echo
echo "[7] Login route"

grep -n "query(\|verifyPassword\|createSession\|adminGet\|adminRun" src/app/api/auth/login/route.ts

echo
echo "[8] Session route"

grep -n "getSessionFromCookies" src/app/api/auth/me/route.ts

echo
echo "[9] Search for localhost"

grep -R "localhost" src --exclude-dir=node_modules

echo
echo "[10] Search for hardcoded database credentials"

grep -R "postgres://" src
grep -R "postgresql://" src

echo
echo "[11] Production logs"

vercel logs biashara-ledger.vercel.app --since=15m

echo
echo "[12] Build"

npm run build >/tmp/build.log 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Build PASSED"
else
    echo "❌ Build FAILED"
    tail -30 /tmp/build.log
fi

echo
echo "======================================================"
echo "SUMMARY"
echo "======================================================"

issues=0

if [ -z "$DB" ]; then
    echo "❌ DATABASE_URL missing"
    ((issues++))
fi

grep -q '^ENCRYPTION_KEY=' .env.production || {
    echo "❌ ENCRYPTION_KEY missing"
    ((issues++))
}

grep -q "localhost" src/lib/db.ts && {
    echo "⚠ localhost fallback still exists"
}

echo
echo "Issues found: $issues"

echo

if [ "$issues" -eq 0 ]; then
    echo "✔ Environment looks healthy."
    echo "✔ Next suspect is the login code itself."
    echo "✔ The 500 error is likely inside POST /api/auth/login."
fi

echo
echo "======================================================"
echo "END OF REPORT"
echo "======================================================"
