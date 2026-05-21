#!/bin/bash

# ============================================
# TESTING SCRIPT - ADMIN PANEL FIXES
# ============================================

echo "🧪 TESTING ADMIN PANEL FIXES"
echo "=============================="
echo ""

API_URL="http://localhost:3000/api"
WEB_URL="http://localhost:5173"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# ============================================
# TEST 1: Check if modalities API works
# ============================================
echo -e "${YELLOW}[TEST 1]${NC} Testing GET /api/modalities"
RESPONSE=$(curl -s "$API_URL/modalities")
if echo "$RESPONSE" | grep -q "INDIVIDUAL\|TEAM\|MIXED"; then
  echo -e "${GREEN}✅ PASS${NC} - Modalities API is working"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - Modalities API not responding correctly"
  echo "Response: $RESPONSE"
  ((FAILED++))
fi
echo ""

# ============================================
# TEST 2: Check if categories API works
# ============================================
echo -e "${YELLOW}[TEST 2]${NC} Testing GET /api/categories"
RESPONSE=$(curl -s "$API_URL/categories")
if echo "$RESPONSE" | grep -q "bowType\|gender\|division"; then
  echo -e "${GREEN}✅ PASS${NC} - Categories API is working"
  ((PASSED++))
else
  echo -e "${RED}❌ FAIL${NC} - Categories API not responding correctly"
  echo "Response: $RESPONSE"
  ((FAILED++))
fi
echo ""

# ============================================
# TEST 3: Check compilation errors
# ============================================
echo -e "${YELLOW}[TEST 3]${NC} Checking TypeScript compilation (web)"
cd apps/web 2>/dev/null
if npm run build 2>&1 | grep -q "error"; then
  echo -e "${RED}❌ FAIL${NC} - Web app has compilation errors"
  ((FAILED++))
else
  echo -e "${GREEN}✅ PASS${NC} - Web app compiles without errors"
  ((PASSED++))
fi
cd ../.. 2>/dev/null
echo ""

# ============================================
# TEST 4: Check backend compilation
# ============================================
echo -e "${YELLOW}[TEST 4]${NC} Checking TypeScript compilation (API)"
cd apps/api 2>/dev/null
if npm run build 2>&1 | grep -q "error"; then
  echo -e "${RED}❌ FAIL${NC} - API has compilation errors"
  ((FAILED++))
else
  echo -e "${GREEN}✅ PASS${NC} - API compiles without errors"
  ((PASSED++))
fi
cd ../.. 2>/dev/null
echo ""

# ============================================
# TEST 5: File existence checks
# ============================================
echo -e "${YELLOW}[TEST 5]${NC} Checking required files"
REQUIRED_FILES=(
  "apps/web/src/pages/admin/AdminCategories.tsx"
  "apps/api/src/routes/modality.routes.ts"
  "ADMIN_FIXES_SUMMARY.md"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✅${NC} $file"
    ((PASSED++))
  else
    echo -e "  ${RED}❌${NC} $file NOT FOUND"
    ((FAILED++))
  fi
done
echo ""

# ============================================
# SUMMARY
# ============================================
TOTAL=$((PASSED + FAILED))
echo "=============================="
echo -e "${GREEN}✅ PASSED: $PASSED${NC}"
echo -e "${RED}❌ FAILED: $FAILED${NC}"
echo -e "Total Tests: $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
  exit 1
fi
