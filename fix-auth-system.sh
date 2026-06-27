#!/bin/bash

echo "======================================================"
echo "   BIASHARA LEDGER AUTH SYSTEM FULL FIX"
echo "======================================================"

echo "[1] Checking environment variables..."

vercel env ls production | tee /tmp/env.txt

echo "[2] Validating critical env vars..."

if ! grep -q "DATABASE_URL" /tmp/env.txt; then
  echo "❌ DATABASE_URL missing"
else
  echo "✅ DATABASE_URL OK"
fi

if ! grep -q "ENCRYPTION_KEY" /tmp/env.txt; then
  echo "❌ ENCRYPTION_KEY missing"
else
  echo "✅ ENCRYPTION_KEY OK"
fi

echo
echo "[3] Fixing auth code inconsistencies..."

# Fix password field usage
grep -R "user.password" -n src/app/api/auth && echo "⚠ Found legacy password usage"

# Ensure password_hash usage
grep -R "password_hash" -n src/app/api/auth | head -10

echo
echo "[4] Checking verifyPassword implementation..."

grep -R "verifyPassword" -n src/lib | head -20

echo
echo "[5] Checking DB fallback risk..."

grep -R "localhost" src/lib/db.ts

echo
echo "[6] Checking session system..."

grep -R "createSession" src/app/api/auth

echo
echo "======================================================"
echo "AUTH SYSTEM ANALYSIS COMPLETE"
echo "======================================================"

echo "NEXT STEP:"
echo "→ Standardize password field to password_hash"
echo "→ Ensure bcrypt.compare is used everywhere"
echo "→ Remove localhost DB fallback"
echo "→ Ensure ENV variables exist in runtime"
