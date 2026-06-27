#!/usr/bin/env bash

echo "======================================================"
echo "🔥 BIASHARA LEDGER VERCEL AUTH FIX"
echo "======================================================"

echo ""
echo "[1] Checking Vercel project..."
vercel project ls

echo ""
echo "[2] Checking DATABASE_URL..."
vercel env ls production | grep DATABASE_URL || {
  echo "❌ DATABASE_URL missing - STOP"
  exit 1
}

echo ""
echo "[3] Ensuring JWT_SECRET exists..."
JWT_SECRET=$(openssl rand -base64 32)

echo "$JWT_SECRET" | vercel env add JWT_SECRET production

echo ""
echo "[4] Ensuring ENCRYPTION_KEY exists..."
ENCRYPTION_KEY=$(openssl rand -base64 32)

echo "$ENCRYPTION_KEY" | vercel env add ENCRYPTION_KEY production

echo ""
echo "[5] Fixing localhost URLs safely..."

find src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
  sed -i '' 's|http://localhost:3000|https://biashara-ledger.vercel.app|g' "$file"
done

echo ""
echo "[6] Cleaning build..."
rm -rf .next

echo ""
echo "[7] Building project..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ BUILD FAILED"
  exit 1
fi

echo ""
echo "[8] Deploying to Vercel..."
vercel --prod

echo ""
echo "======================================================"
echo "✅ DONE - CHECK LOGIN NOW"
echo "======================================================"
