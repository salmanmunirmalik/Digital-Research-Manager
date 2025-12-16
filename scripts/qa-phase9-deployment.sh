#!/bin/bash

# Phase 9: Deployment Readiness Testing

set +e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

TOTAL_TESTS=0
PASSED=0
FAILED=0

test_check() {
    local name="$1"
    local command="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $name"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} $name"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  PHASE 9: DEPLOYMENT READINESS TESTING${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cd "$(dirname "$0")/.."

echo -e "${YELLOW}9.1 Build Process${NC}"
test_check "TC-DEPLOY-001: TypeScript compiles" "pnpm run type-check 2>&1 | grep -q 'error TS' && exit 1 || exit 0"
test_check "TC-DEPLOY-002: Frontend build works" "pnpm run build:frontend > /dev/null 2>&1"
test_check "TC-DEPLOY-003: Backend build works" "pnpm run build:backend > /dev/null 2>&1"

echo -e "${YELLOW}9.2 Environment Configuration${NC}"
test_check "TC-DEPLOY-008: .env file exists" "[ -f .env ] || [ -f env.local ] || [ -f env.production ]"
test_check "TC-DEPLOY-009: Database config exists" "[ -f database/config.js ] || [ -f database/config.ts ]"

echo -e "${YELLOW}9.3 Health Endpoints${NC}"
test_check "TC-HEALTH-001: /health endpoint" "curl -s http://localhost:5002/health | grep -q 'healthy'"
test_check "TC-HEALTH-002: /api/health endpoint" "curl -s http://localhost:5002/api/health | grep -q 'healthy'"

echo -e "${YELLOW}9.4 File Structure${NC}"
test_check "TC-DEPLOY-007: package.json exists" "[ -f package.json ]"
test_check "TC-DEPLOY-007: Server index exists" "[ -f server/index.ts ]"
test_check "TC-DEPLOY-007: Frontend entry exists" "[ -f index.tsx ] || [ -f src/main.tsx ]"

echo -e "${YELLOW}9.5 Dependencies${NC}"
test_check "TC-DEPLOY-006: node_modules exists" "[ -d node_modules ]"
test_check "TC-DEPLOY-006: pnpm-lock exists" "[ -f pnpm-lock.yaml ]"

echo ""
echo -e "${BLUE}Phase 9 Summary:${NC} Tests: $TOTAL_TESTS | Passed: $PASSED | Failed: $FAILED"



