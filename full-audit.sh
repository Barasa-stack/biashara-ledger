#!/usr/bin/env bash

clear

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ISSUES=()

check() {
    if eval "$2" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        ISSUES+=("$1")
    fi
}

echo "=========================================================="
echo "        BIASHARA LEDGER COMPLETE SYSTEM AUDIT"
echo "=========================================================="
echo

echo "PROJECT"
check ".env.local exists" "[ -f .env.local ]"
check "package.json exists" "[ -f package.json ]"
check "src exists" "[ -d src ]"

echo
echo "ENVIRONMENT"

check "DATABASE_URL exists in .env.local" "grep -q '^DATABASE_URL=' .env.local"
check "ENCRYPTION_KEY exists in .env.local" "grep -q '^ENCRYPTION_KEY=' .env.local"

echo
echo "DATABASE"

grep -n "connectionString" src/lib/db.ts 2>/dev/null
grep -n "DATABASE_URL" src/lib/db.ts 2>/dev/null
grep -n "localhost" src/lib/db.ts 2>/dev/null

echo
echo "AUTH ROUTES"

find src/app/api/auth -type f 2>/dev/null

echo
echo "LOCALHOST REFERENCES"

grep -RInE "localhost|127\.0\.0\.1" src electron scripts 2>/dev/null

echo
echo "DATABASE_URL REFERENCES"

grep -RIn "DATABASE_URL" src 2>/dev/null

echo
echo "ENCRYPTION"

grep -RIn "ENCRYPTION_KEY" src 2>/dev/null

echo
echo "LARGE FILES (>50MB)"

find . -type f -size +50M 2>/dev/null

echo
echo "DIRECTORY SIZES"

du -sh .git .next node_modules public 2>/dev/null

echo
echo "VERCEL"

vercel whoami 2>/dev/null
echo
vercel env ls 2>/dev/null

echo
echo "BUILD"

npm run build

echo
echo "=========================================================="
echo "SUMMARY"
echo "=========================================================="

if [ ${#ISSUES[@]} -eq 0 ]; then
    echo -e "${GREEN}No immediate structural problems detected.${NC}"
else
    echo
    echo -e "${YELLOW}Problems detected:${NC}"
    for issue in "${ISSUES[@]}"; do
        echo " • $issue"
    done
fi

echo
echo "Audit finished."
