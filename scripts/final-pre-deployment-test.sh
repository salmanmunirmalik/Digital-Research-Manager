#!/bin/bash

# Final Pre-Deployment Testing Script
# Runs comprehensive tests before deployment

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🧪 Running Final Pre-Deployment Tests...${NC}\n"

TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_step() {
    local name=$1
    local command=$2
    
    echo -n "Testing $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Check Node.js version
echo -e "${YELLOW}1. Environment Checks${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "  ${GREEN}✓ Node.js version: $(node -v)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "  ${RED}✗ Node.js version too old: $(node -v) (requires 18+)${NC}"
    ((TESTS_FAILED++))
fi

# 2. Check pnpm
if command -v pnpm &> /dev/null; then
    echo -e "  ${GREEN}✓ pnpm installed: $(pnpm -v)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "  ${RED}✗ pnpm not installed${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# 3. Install dependencies
echo -e "${YELLOW}2. Dependencies${NC}"
test_step "Dependencies installed" "pnpm install --frozen-lockfile"
echo ""

# 4. Type checking
echo -e "${YELLOW}3. Type Checking${NC}"
test_step "TypeScript type check" "pnpm run type-check"
echo ""

# 5. Linting
echo -e "${YELLOW}4. Code Quality${NC}"
test_step "ESLint check" "pnpm run lint:check"
echo ""

# 6. Frontend build
echo -e "${YELLOW}5. Frontend Build${NC}"
test_step "Frontend build" "pnpm run build:frontend"
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo -e "  ${GREEN}✓ Frontend build files exist${NC}"
    ((TESTS_PASSED++))
else
    echo -e "  ${RED}✗ Frontend build files missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# 7. Backend build
echo -e "${YELLOW}6. Backend Build${NC}"
test_step "Backend build" "pnpm run build:backend"
if [ -d "dist/server" ]; then
    echo -e "  ${GREEN}✓ Backend build files exist${NC}"
    ((TESTS_PASSED++))
else
    echo -e "  ${RED}✗ Backend build files missing${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# 8. Database migrations check
echo -e "${YELLOW}7. Database Migrations${NC}"
if [ -d "database/migrations" ] && [ "$(ls -A database/migrations/*.sql 2>/dev/null | wc -l)" -gt 0 ]; then
    echo -e "  ${GREEN}✓ Migration files found${NC}"
    ((TESTS_PASSED++))
else
    echo -e "  ${YELLOW}⚠ No migration files found${NC}"
fi
echo ""

# 9. Check for critical files
echo -e "${YELLOW}8. Critical Files${NC}"
CRITICAL_FILES=(
    "package.json"
    "server/index.ts"
    "App.tsx"
    "database/config.ts"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓ $file${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "  ${RED}✗ $file missing${NC}"
        ((TESTS_FAILED++))
    fi
done
echo ""

# 10. Check build output size
echo -e "${YELLOW}9. Build Output${NC}"
if [ -d "dist" ]; then
    FRONTEND_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    echo -e "  ${GREEN}✓ Frontend build size: $FRONTEND_SIZE${NC}"
    ((TESTS_PASSED++))
fi

if [ -d "dist/server" ]; then
    BACKEND_SIZE=$(du -sh dist/server 2>/dev/null | cut -f1)
    echo -e "  ${GREEN}✓ Backend build size: $BACKEND_SIZE${NC}"
    ((TESTS_PASSED++))
fi
echo ""

# Summary
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}Total: $((TESTS_PASSED + TESTS_FAILED))${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Ready for deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix issues before deployment.${NC}"
    exit 1
fi

