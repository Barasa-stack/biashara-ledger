#!/bin/bash

# ========================================
# BiasharaLedger Full Audit Script
# Run this from the project root (vibe-app/)
# ========================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASS="✅"
FAIL="❌"
WARN="⚠️"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  BiasharaLedger Full Audit${NC}"
echo -e "${BLUE}=========================================${NC}"

# ------------------------------------------------------------
# 1. Pricing – USD only (no KES)
# ------------------------------------------------------------
echo -e "\n${YELLOW}[1] Pricing – USD only (no KES)${NC}"
if grep -r -i "KES" --include="*.tsx" --include="*.ts" --include="*.js" src/ >/dev/null 2>&1; then
  echo -e "  ${FAIL} Found 'KES' references (likely not USD only)"
  grep -r -i "KES" --include="*.tsx" --include="*.ts" --include="*.js" src/ | head -5
else
  echo -e "  ${PASS} No 'KES' found – prices are in USD"
fi

# ------------------------------------------------------------
# 2. Country selection on sign-up
# ------------------------------------------------------------
echo -e "\n${YELLOW}[2] Country selection on sign-up${NC}"
if [ -f "src/lib/countries.ts" ]; then
  COUNT=$(grep -c "dialCode" src/lib/countries.ts || true)
  if [ "$COUNT" -gt 50 ]; then
    echo -e "  ${PASS} Found countries list with $COUNT entries"
  else
    echo -e "  ${FAIL} countries.ts exists but has fewer than 50 entries (got $COUNT)"
  fi
else
  echo -e "  ${FAIL} src/lib/countries.ts not found"
fi

# ------------------------------------------------------------
# 3. Dashboard sidebar – all premium menu items
# ------------------------------------------------------------
echo -e "\n${YELLOW}[3] Dashboard sidebar – premium menu items${NC}"
SIDEBAR="src/components/dashboard/Sidebar.tsx"
if [ ! -f "$SIDEBAR" ]; then
  echo -e "  ${FAIL} Sidebar file not found at $SIDEBAR"
else
  ITEMS=(
    "Dashboard"
    "Customers & Suppliers"
    "Sales"
    "Purchases"
    "HR & Payroll"
    "Expenses"
    "Inventory"
    "Other Income/Expenses"
    "Capital Transactions"
    "Budgets"
    "Exchange Rates"
    "Chart of Accounts"
    "Journal Entries"
    "Banking"
    "Fixed Assets"
    "Automation"
    "CRM Pipeline"
    "Projects"
    "Developer"
    "Financial Reports"
    "Notifications"
    "Subscription"
    "Company Settings"
  )
  MISSING=()
  for item in "${ITEMS[@]}"; do
    if ! grep -q "$item" "$SIDEBAR"; then
      MISSING+=("$item")
    fi
  done
  if [ ${#MISSING[@]} -eq 0 ]; then
    echo -e "  ${PASS} All ${#ITEMS[@]} premium menu items found"
  else
    echo -e "  ${FAIL} Missing items: ${MISSING[*]}"
  fi
fi

# ------------------------------------------------------------
# 4. All pages exist (routes for each menu item)
# ------------------------------------------------------------
echo -e "\n${YELLOW}[4] All page routes exist${NC}"
ROUTES=(
  "dashboard"
  "dashboard/customers"
  "dashboard/sales"
  "dashboard/purchases"
  "dashboard/hr"
  "dashboard/expenses"
  "dashboard/inventory"
  "dashboard/other-income"
  "dashboard/capital"
  "dashboard/budgets"
  "dashboard/exchange-rates"
  "dashboard/chart-of-accounts"
  "dashboard/journal-entries"
  "dashboard/banking"
  "dashboard/fixed-assets"
  "dashboard/automation"
  "dashboard/crm"
  "dashboard/projects"
  "dashboard/developer"
  "dashboard/financial-reports"
  "dashboard/notifications"
  "dashboard/subscription"
  "dashboard/settings"
)
MISSING_ROUTES=()
for route in "${ROUTES[@]}"; do
  if [ ! -d "src/app/$route" ] && [ ! -f "src/app/$route/page.tsx" ]; then
    MISSING_ROUTES+=("$route")
  fi
done
if [ ${#MISSING_ROUTES[@]} -eq 0 ]; then
  echo -e "  ${PASS} All ${#ROUTES[@]} routes exist"
else
  echo -e "  ${FAIL} Missing routes: ${MISSING_ROUTES[*]}"
fi

# ------------------------------------------------------------
# 5. Multi-tenant – each table has user_id column
# ------------------------------------------------------------
echo -e "\n${YELLOW}[5] Multi-tenant – user_id column in tables${NC}"
if [ -f "prisma/schema.prisma" ]; then
  TABLES=$(grep -E "^model [A-Za-z]+" prisma/schema.prisma | awk '{print $2}')
  MISSING_USER_ID=()
  for table in $TABLES; do
    if [[ "$table" == "User" || "$table" == "Session" || "$table" == "Account" || "$table" == "VerificationToken" ]]; then
      continue
    fi
    if ! grep -A20 "model $table" prisma/schema.prisma | grep -q "userId"; then
      MISSING_USER_ID+=("$table")
    fi
  done
  if [ ${#MISSING_USER_ID[@]} -eq 0 ]; then
    echo -e "  ${PASS} All business tables have a userId field"
  else
    echo -e "  ${FAIL} Tables missing userId: ${MISSING_USER_ID[*]}"
  fi
else
  echo -e "  ${WARN} No Prisma schema found – skipping"
fi

# ------------------------------------------------------------
# 6. Desktop (Electron) setup
# ------------------------------------------------------------
echo -e "\n${YELLOW}[6] Desktop (Electron) setup${NC}"
if [ -f "electron/main.cjs" ]; then
  if grep -q "BrowserWindow" electron/main.cjs; then
    echo -e "  ${PASS} Electron main process exists with BrowserWindow"
  else
    echo -e "  ${FAIL} electron/main.cjs found but missing BrowserWindow"
  fi
else
  echo -e "  ${FAIL} electron/main.cjs not found"
fi

# ------------------------------------------------------------
# 7. TypeScript errors (excluding known license.ts issue)
# ------------------------------------------------------------
echo -e "\n${YELLOW}[7] TypeScript errors (excluding known license.ts)${NC}"
if command -v tsc &> /dev/null; then
  ERR=$(tsc --noEmit 2>&1 | grep -v "src/lib/license.ts(224,1)" | head -20 || true)
  if [ -z "$ERR" ]; then
    echo -e "  ${PASS} No TypeScript errors (other than known license.ts)"
  else
    echo -e "  ${FAIL} TypeScript errors found:"
    echo "$ERR" | sed 's/^/    /'
  fi
else
  echo -e "  ${WARN} tsc not found – skipping TS check"
fi

# ------------------------------------------------------------
# 8. Linting (ESLint) – optional
# ------------------------------------------------------------
echo -e "\n${YELLOW}[8] Linting (ESLint)${NC}"
if [ -f ".eslintrc.json" ] || [ -f ".eslintrc.js" ]; then
  echo -e "  ${PASS} ESLint config present"
else
  echo -e "  ${WARN} No ESLint config found – linting not configured"
fi

# ------------------------------------------------------------
# Final summary
# ------------------------------------------------------------
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}Audit complete.${NC}"
echo -e "${BLUE}=========================================${NC}"

exit 0
