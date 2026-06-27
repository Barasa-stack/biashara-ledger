#!/bin/bash
echo "🔍 Auditing database connection strings..."
echo "========================================"

# Check for hardcoded localhost:5432
if grep -rqiE '(localhost|127\.0\.0\.1):5432' --exclude-dir={node_modules,.next,.git,dist} .; then
    echo "❌ AUDIT RESULT: YES (Hardcoded connection found!)"
    echo ""
    echo "📁 Files with hardcoded connections:"
    grep -rE '(localhost|127\.0\.0\.1):5432' --exclude-dir={node_modules,.next,.git,dist} .
else
    echo "✅ AUDIT RESULT: NO (Looking good!)"
fi

echo ""
echo "========================================"
echo "📋 Environment Files:"
ls -la .env* 2>/dev/null || echo "No .env files found"

echo ""
echo "📋 DATABASE_URL in .env:"
grep DATABASE_URL .env 2>/dev/null || echo "DATABASE_URL not set in .env"

echo ""
echo "📋 Prisma Schema:"
grep -A2 "datasource db" prisma/schema.prisma 2>/dev/null || echo "Prisma schema not found"
