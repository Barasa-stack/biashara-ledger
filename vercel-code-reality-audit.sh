#!/bin/bash

PROJECT="biashara-ledger.vercel.app"

echo "======================================================"
echo "   VERCEL DEPLOYED CODE REALITY AUDIT"
echo "======================================================"

echo ""
echo "1. PROJECT INFO (LIVE DEPLOYMENT)"
vercel inspect $PROJECT

echo ""
echo "2. PRODUCTION ENV SNAPSHOT"
vercel env ls production

echo ""
echo "3. PREVIEW ENV SNAPSHOT"
vercel env ls preview

echo ""
echo "4. CRITICAL ENV VALIDATION (REALITY CHECK)"
vercel env pull .env.reality >/dev/null 2>&1

for key in DATABASE_URL ENCRYPTION_KEY JWT_SECRET NEXTAUTH_SECRET PGHOST PGPORT PGPASSWORD; do
  if grep -q "^$key=" .env.reality 2>/dev/null; then
    echo "✔ $key PRESENT"
  else
    echo "❌ $key MISSING"
  fi
done

echo ""
echo "5. DEPLOYMENT LOG FAILURE TRACE"
vercel logs $PROJECT --since=2h | grep -E "500|401|ECONNREFUSED|auth|login|signin|error"

echo ""
echo "6. AUTH ROUTE BEHAVIOR ON PROD"
echo "Checking deployed auth routes..."

curl -s -o /dev/null -w "login_status=%{http_code}\n" \
https://$PROJECT/api/auth/login

curl -s -o /dev/null -w "signin_status=%{http_code}\n" \
https://$PROJECT/api/auth/signin

curl -s -o /dev/null -w "me_status=%{http_code}\n" \
https://$PROJECT/api/auth/me

echo ""
echo "7. CODE STRUCTURE CHECK (LOCAL MIRROR OF DEPLOYED LOGIC)"
echo "DB Layer:"
sed -n '1,200p' src/lib/db.ts | grep -E "DATABASE_URL|localhost|Pool|connection"

echo ""
echo "Auth Layer:"
grep -R "createSession\|verifyPassword\|cookies\|login\|signin" src/app/api/auth -n | head -50

echo ""
echo "Middleware:"
if [ -f src/middleware.ts ]; then
  sed -n '1,200p' src/middleware.ts
else
  echo "NO middleware found"
fi

echo ""
echo "8. CRITICAL FAILURE ANALYSIS"

echo "Checking known failure patterns..."

FAIL=0

grep -q "localhost" src/lib/db.ts && echo "⚠ localhost fallback exists" && FAIL=$((FAIL+1))
grep -q "DATABASE_URL" src/lib/db.ts || echo "⚠ DATABASE_URL not enforced" && FAIL=$((FAIL+1))
grep -q "try {" src/app/api/auth/login 2>/dev/null || echo "⚠ login has weak error handling" && FAIL=$((FAIL+1))

echo ""
echo "9. AUTH FLOW SIMULATION"

echo "Expected flow:"
echo "request → db query → verifyPassword → createSession → cookie → /me"

echo ""
echo "10. ROOT CAUSE MODEL"

echo "If you are seeing:"
echo "- 500 on login"
echo "- 401 on /me"
echo "- ECONNREFUSED 127.0.0.1:5432"

echo ""
echo "THEN THE SYSTEM FAILURE IS:"
echo "❌ DATABASE CONNECTIVITY BREAK BEFORE AUTH EXECUTION"
echo "❌ SESSION NEVER CREATED"
echo "❌ AUTH STATE NEVER INITIALIZED"

echo ""
echo "======================================================"
echo "END OF VERCEL REALITY AUDIT"
echo "======================================================"
