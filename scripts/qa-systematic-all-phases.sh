#!/bin/bash

# Systematic QA Testing - All Phases
# Tests all 9 phases from COMPREHENSIVE_E2E_QA_TESTING_PLAN.md

set +e  # Don't exit on errors - we want to test everything

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

API_URL="http://localhost:5002/api"
BASE_URL="http://localhost:5002"
AUTH_TOKEN=""

# Global counters
TOTAL_TESTS=0
TOTAL_PASSED=0
TOTAL_FAILED=0
ISSUES_FOUND=0

print_phase_header() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected="$5"
    local token="$6"
    local severity="$7"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local url="$API_URL$endpoint"
    [ "$endpoint" = "" ] && url="$BASE_URL/health"
    [ "$endpoint" = "/health" ] && url="$BASE_URL$endpoint"
    
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    [ -n "$data" ] && [ "$data" != "null" ] && curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    [ -n "$token" ] && [ "$token" != "null" ] && curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    curl_cmd="$curl_cmd '$url'"
    
    local response=$(eval $curl_cmd 2>&1)
    local code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$code" = "$expected" ]; then
        echo -e "  ${GREEN}✓${NC} $name"
        TOTAL_PASSED=$((TOTAL_PASSED + 1))
        return 0
    else
        echo -e "  ${RED}✗${NC} $name (Expected $expected, got $code)"
        [ -n "$severity" ] && echo -e "      ${YELLOW}→ Issue: $severity${NC}"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
        [ -n "$severity" ] && ISSUES_FOUND=$((ISSUES_FOUND + 1))
        return 1
    fi
}

get_auth_token() {
    local response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"researcher@researchlab.com","password":"researcher123"}')
    AUTH_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
}

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║          SYSTEMATIC QA TESTING - ALL 9 PHASES                               ║"
echo "║          Following Comprehensive E2E Testing Plan                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Get auth token
get_auth_token
[ -n "$AUTH_TOKEN" ] && echo -e "${GREEN}✓${NC} Authentication token obtained" || echo -e "${RED}✗${NC} Failed to get auth token"

# ============================================================================
# PHASE 1: CRITICAL PATH TESTING
# ============================================================================
print_phase_header "PHASE 1: CRITICAL PATH TESTING"

echo -e "${YELLOW}1.1 Health & Infrastructure${NC}"
test_api "Health Check - Root" "GET" "" "" "200" "" ""
test_api "Health Check - API" "GET" "/health" "" "200" "" ""

echo -e "${YELLOW}1.2 Authentication${NC}"
[ -n "$AUTH_TOKEN" ] && echo -e "  ${GREEN}✓${NC} TC-LOGIN-001: Valid credentials login" && TOTAL_PASSED=$((TOTAL_PASSED + 1)) && TOTAL_TESTS=$((TOTAL_TESTS + 1)) || echo -e "  ${RED}✗${NC} TC-LOGIN-001: Login failed" && TOTAL_FAILED=$((TOTAL_FAILED + 1)) && TOTAL_TESTS=$((TOTAL_TESTS + 1))
test_api "TC-LOGIN-002: Invalid email" "POST" "/auth/login" '{"email":"nonexistent@test.com","password":"test"}' "401" "" "HIGH"
test_api "TC-LOGIN-003: Invalid password" "POST" "/auth/login" '{"email":"researcher@researchlab.com","password":"wrong"}' "401" "" "HIGH"
test_api "TC-REG-001: User registration" "POST" "/auth/register" '{"email":"test'$(date +%s)'@test.com","username":"test'$(date +%s)'","password":"TestPass123!","first_name":"T","last_name":"U","role":"student"}' "201" "" "CRITICAL"
test_api "TC-LOGOUT-002: Logout" "POST" "/auth/logout" "" "200" "$AUTH_TOKEN" ""

# Re-authenticate
get_auth_token

echo -e "${YELLOW}1.3 Protected Routes${NC}"
test_api "TC-PROTECT-001: Unauthenticated access" "GET" "/protocols" "" "401" "" ""
test_api "TC-PROTECT-002: Authenticated access" "GET" "/protocols" "" "200" "$AUTH_TOKEN" ""
test_api "TC-PROTECT-004: Invalid token" "GET" "/protocols" "" "401" "invalid-token" ""

echo -e "${YELLOW}1.4 Core CRUD - Protocols${NC}"
test_api "TC-PROTO-002: Get protocols" "GET" "/protocols" "" "200" "$AUTH_TOKEN" ""
test_api "TC-PROTO-004: Get protocol details" "GET" "/protocols/00000000-0000-0000-0000-000000000000" "" "404" "$AUTH_TOKEN" ""

echo -e "${YELLOW}1.5 Core CRUD - Lab Notebook${NC}"
test_api "TC-NOTEBOOK-004: Get lab notebooks" "GET" "/lab-notebooks" "" "200" "$AUTH_TOKEN" ""

echo -e "${YELLOW}1.6 Core CRUD - Data Results${NC}"
test_api "TC-DATA-002: Get data results" "GET" "/data-results" "" "200" "$AUTH_TOKEN" ""

# ============================================================================
# PHASE 2: FEATURE COMPLETENESS
# ============================================================================
print_phase_header "PHASE 2: FEATURE COMPLETENESS TESTING"

echo -e "${YELLOW}2.1 Revolutionary Features - Scientist Passport${NC}"
test_api "TC-PASSPORT-001: Get skills" "GET" "/scientist-passport/skills" "" "200" "$AUTH_TOKEN" ""
test_api "TC-PASSPORT-001: Get certifications" "GET" "/scientist-passport/certifications" "" "200" "$AUTH_TOKEN" ""

echo -e "${YELLOW}2.2 Revolutionary Features - Service Marketplace${NC}"
test_api "TC-MARKET-001: Get service categories" "GET" "/services/categories" "" "200" "$AUTH_TOKEN" ""
test_api "TC-MARKET-002: Get service listings" "GET" "/services/listings" "" "200" "$AUTH_TOKEN" ""

echo -e "${YELLOW}2.3 Revolutionary Features - Negative Results${NC}"
test_api "TC-NEG-001: Get negative results" "GET" "/negative-results" "" "200" "$AUTH_TOKEN" ""

echo -e "${YELLOW}2.4 Core Research Features${NC}"
test_api "TC-WORKSPACE-001: Get lab workspaces" "GET" "/lab-workspace" "" "200" "$AUTH_TOKEN" ""
test_api "TC-EXP-001: Get experiments" "GET" "/experiment-tracker" "" "200" "$AUTH_TOKEN" ""
test_api "TC-PROJ-001: Get projects" "GET" "/project-management" "" "200" "$AUTH_TOKEN" ""

echo -e "${YELLOW}2.5 AI Features${NC}"
test_api "TC-AI-001: AI research agent" "GET" "/ai-research-agent" "" "200" "$AUTH_TOKEN" ""

echo -e "${YELLOW}2.6 Additional Features${NC}"
test_api "Get settings" "GET" "/settings" "" "200" "$AUTH_TOKEN" ""
test_api "Get profile" "GET" "/profile" "" "200" "$AUTH_TOKEN" ""
test_api "Get labs" "GET" "/labs" "" "200" "$AUTH_TOKEN" ""
test_api "Get inventory" "GET" "/inventory" "" "200" "$AUTH_TOKEN" ""
test_api "Get instruments" "GET" "/instruments" "" "200" "$AUTH_TOKEN" ""

# ============================================================================
# PHASE 3: INTEGRATION TESTING
# ============================================================================
print_phase_header "PHASE 3: INTEGRATION & DATA FLOW TESTING"

echo -e "${YELLOW}3.1 API Communication${NC}"
test_api "TC-API-001: API base URL works" "GET" "/protocols" "" "200" "$AUTH_TOKEN" ""
test_api "TC-API-002: Auth headers required" "GET" "/protocols" "" "401" "" ""

echo -e "${YELLOW}3.2 Data Synchronization${NC}"
echo -e "  ${BLUE}⊘${NC} TC-SYNC-001: Data persistence (requires create operation - tested separately)"

# ============================================================================
# PHASE 4: SECURITY TESTING
# ============================================================================
print_phase_header "PHASE 4: SECURITY & AUTHORIZATION TESTING"

echo -e "${YELLOW}4.1 SQL Injection Prevention${NC}"
test_api "TC-SEC-021: SQL injection in login" "POST" "/auth/login" '{"email":"test'\'' OR '\''1'\''='\''1","password":"test"}' "401" "" "CRITICAL"

echo -e "${YELLOW}4.2 Access Control${NC}"
test_api "TC-SEC-012: Access without auth" "GET" "/protocols" "" "401" "" ""
test_api "TC-SEC-012: Access with invalid token" "GET" "/protocols" "" "401" "invalid-token" ""

echo -e "${YELLOW}4.3 XSS Prevention${NC}"
echo -e "  ${BLUE}⊘${NC} TC-SEC-027: XSS testing (requires frontend testing)"

# ============================================================================
# PHASE 5: PERFORMANCE TESTING
# ============================================================================
print_phase_header "PHASE 5: PERFORMANCE & SCALABILITY TESTING"

echo -e "${YELLOW}5.1 Response Times${NC}"
START=$(date +%s%N)
curl -s -H "Authorization: Bearer $AUTH_TOKEN" "$API_URL/protocols" > /dev/null
END=$(date +%s%N)
DURATION=$(( (END - START) / 1000000 ))
if [ $DURATION -lt 500 ]; then
    echo -e "  ${GREEN}✓${NC} TC-PERF-005: API response time < 500ms ($DURATION ms)"
    TOTAL_PASSED=$((TOTAL_PASSED + 1))
else
    echo -e "  ${RED}✗${NC} TC-PERF-005: API response time > 500ms ($DURATION ms)"
    TOTAL_FAILED=$((TOTAL_FAILED + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# ============================================================================
# PHASE 6-9: MANUAL/SPECIALIZED TESTING
# ============================================================================
print_phase_header "PHASE 6-9: SPECIALIZED TESTING"

echo -e "${YELLOW}Phase 6: Browser Compatibility${NC}"
echo -e "  ${BLUE}⊘${NC} Requires manual browser testing (Chrome, Firefox, Safari, Edge)"

echo -e "${YELLOW}Phase 7: UX & Accessibility${NC}"
echo -e "  ${BLUE}⊘${NC} Requires manual accessibility testing"

echo -e "${YELLOW}Phase 8: Error Handling${NC}"
echo -e "  ${BLUE}⊘${NC} Tested in previous phases (401, 404 responses)"

echo -e "${YELLOW}Phase 9: Deployment Readiness${NC}"
echo -e "  ${BLUE}⊘${NC} Requires build and deployment testing"

# ============================================================================
# FINAL SUMMARY
# ============================================================================
print_phase_header "TESTING SUMMARY"

echo ""
echo -e "Total Tests Executed: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Tests Passed: ${GREEN}$TOTAL_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TOTAL_FAILED${NC}"
echo -e "Issues Found: ${YELLOW}$ISSUES_FOUND${NC}"

if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))
    echo -e "Pass Rate: ${BLUE}$PASS_RATE%${NC}"
fi

echo ""
echo -e "${CYAN}All issues documented in: QA_ISSUES_LOG.md${NC}"
echo -e "${GREEN}✓ Automated testing phase complete${NC}"
echo -e "${YELLOW}→ Next: Review issues and fix one by one${NC}"
echo ""



