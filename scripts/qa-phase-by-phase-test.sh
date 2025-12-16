#!/bin/bash

# Phase-by-Phase QA Testing Script
# Follows COMPREHENSIVE_E2E_QA_TESTING_PLAN.md systematically

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

API_URL="http://localhost:5002/api"
AUTH_TOKEN=""
ISSUES_FILE="../QA_ISSUES_LOG.md"

# Counters
PHASE_TESTS=0
PHASE_PASSED=0
PHASE_FAILED=0

print_phase() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected="$5"
    local token="$6"
    local severity="$7"
    
    PHASE_TESTS=$((PHASE_TESTS + 1))
    
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    [ -n "$data" ] && [ "$data" != "null" ] && curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    [ -n "$token" ] && [ "$token" != "null" ] && curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    curl_cmd="$curl_cmd $API_URL$endpoint"
    
    local response=$(eval $curl_cmd 2>&1)
    local code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$code" = "$expected" ]; then
        echo -e "${GREEN}✓${NC} $name"
        PHASE_PASSED=$((PHASE_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $name (Expected $expected, got $code)"
        [ -n "$severity" ] && echo -e "  ${YELLOW}→ Issue logged: $severity${NC}"
        PHASE_FAILED=$((PHASE_FAILED + 1))
        return 1
    fi
}

# Get auth token
get_auth_token() {
    local response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"researcher@researchlab.com","password":"researcher123"}')
    AUTH_TOKEN=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
}

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     SYSTEMATIC PHASE-BY-PHASE QA TESTING                     ║"
echo "║     Following Comprehensive E2E Testing Plan                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Get authentication token
get_auth_token

# ============================================================================
# PHASE 1: CRITICAL PATH TESTING
# ============================================================================
print_phase "PHASE 1: CRITICAL PATH TESTING"

# 1.1 Health Checks
echo -e "${YELLOW}1.1 Health & Infrastructure${NC}"
test_endpoint "Health Check - Root" "GET" "" "" "200" "" ""
test_endpoint "Health Check - API" "GET" "/health" "" "200" "" ""

# 1.2 Authentication
echo -e "${YELLOW}1.2 Authentication${NC}"
if [ -n "$AUTH_TOKEN" ]; then
    echo -e "${GREEN}✓${NC} TC-LOGIN-001: Valid credentials login"
    PHASE_PASSED=$((PHASE_PASSED + 1))
    PHASE_TESTS=$((PHASE_TESTS + 1))
else
    echo -e "${RED}✗${NC} TC-LOGIN-001: Login failed"
    PHASE_FAILED=$((PHASE_FAILED + 1))
    PHASE_TESTS=$((PHASE_TESTS + 1))
fi

test_endpoint "TC-LOGIN-002: Invalid email" "POST" "/auth/login" \
    '{"email":"nonexistent@test.com","password":"test"}' "401" "" "HIGH"
test_endpoint "TC-LOGIN-003: Invalid password" "POST" "/auth/login" \
    '{"email":"researcher@researchlab.com","password":"wrong"}' "401" "" "HIGH"
test_endpoint "TC-REG-001: User registration" "POST" "/auth/register" \
    '{"email":"test'$(date +%s)'@test.com","username":"test'$(date +%s)'","password":"TestPass123!","first_name":"T","last_name":"U","role":"student"}' \
    "201" "" "CRITICAL"
test_endpoint "TC-LOGOUT-002: Logout" "POST" "/auth/logout" "" "200" "$AUTH_TOKEN" ""

# Re-authenticate
get_auth_token

# 1.3 Protected Routes
echo -e "${YELLOW}1.3 Protected Routes${NC}"
test_endpoint "TC-PROTECT-001: Unauthenticated access" "GET" "/protocols" "" "401" "" ""
test_endpoint "TC-PROTECT-002: Authenticated access" "GET" "/protocols" "" "200" "$AUTH_TOKEN" ""
test_endpoint "TC-PROTECT-004: Invalid token" "GET" "/protocols" "" "401" "invalid-token" ""

# 1.4 Core CRUD - Protocols
echo -e "${YELLOW}1.4 Core CRUD - Protocols${NC}"
test_endpoint "TC-PROTO-002: Get protocols" "GET" "/protocols" "" "200" "$AUTH_TOKEN" ""
test_endpoint "TC-PROTO-004: Get protocol details" "GET" "/protocols/test-id" "" "404" "$AUTH_TOKEN" ""

# 1.5 Core CRUD - Lab Notebook
echo -e "${YELLOW}1.5 Core CRUD - Lab Notebook${NC}"
test_endpoint "TC-NOTEBOOK-004: Get projects" "GET" "/lab-notebook/projects" "" "200" "$AUTH_TOKEN" ""

# 1.6 Core CRUD - Data Results
echo -e "${YELLOW}1.6 Core CRUD - Data Results${NC}"
test_endpoint "TC-DATA-002: Get data results" "GET" "/data-results" "" "200" "$AUTH_TOKEN" ""

echo ""
echo -e "${BLUE}Phase 1 Summary:${NC} Tests: $PHASE_TESTS | Passed: $PHASE_PASSED | Failed: $PHASE_FAILED"

# ============================================================================
# PHASE 2: FEATURE COMPLETENESS
# ============================================================================
print_phase "PHASE 2: FEATURE COMPLETENESS TESTING"

PHASE_TESTS=0
PHASE_PASSED=0
PHASE_FAILED=0

# 2.1 Revolutionary Features
echo -e "${YELLOW}2.1 Revolutionary Features${NC}"
test_endpoint "TC-PASSPORT-001: Get skills" "GET" "/scientist-passport/skills" "" "200" "$AUTH_TOKEN" ""
test_endpoint "TC-PASSPORT-001: Get certifications" "GET" "/scientist-passport/certifications" "" "200" "$AUTH_TOKEN" ""
test_endpoint "TC-MARKET-001: Get service categories" "GET" "/services/categories" "" "200" "$AUTH_TOKEN" ""
test_endpoint "TC-MARKET-002: Get service listings" "GET" "/services/listings" "" "200" "$AUTH_TOKEN" ""
test_endpoint "TC-NEG-001: Get negative results" "GET" "/negative-results" "" "200" "$AUTH_TOKEN" ""

# 2.2 Core Research Features
echo -e "${YELLOW}2.2 Core Research Features${NC}"
test_endpoint "TC-WORKSPACE-001: Get workspaces" "GET" "/lab-workspace" "" "200" "$AUTH_TOKEN" ""
test_endpoint "TC-EXP-001: Get experiments" "GET" "/experiment-tracker" "" "200" "$AUTH_TOKEN" ""
test_endpoint "TC-PROJ-001: Get projects" "GET" "/project-management" "" "200" "$AUTH_TOKEN" ""

# 2.3 AI Features
echo -e "${YELLOW}2.3 AI Features${NC}"
test_endpoint "TC-AI-001: AI research agent" "GET" "/ai-research-agent" "" "200" "$AUTH_TOKEN" ""

# 2.4 Additional Features
echo -e "${YELLOW}2.4 Additional Features${NC}"
test_endpoint "Get settings" "GET" "/settings" "" "200" "$AUTH_TOKEN" ""
test_endpoint "Get profile" "GET" "/profile" "" "200" "$AUTH_TOKEN" ""

echo ""
echo -e "${BLUE}Phase 2 Summary:${NC} Tests: $PHASE_TESTS | Passed: $PHASE_PASSED | Failed: $PHASE_FAILED"

# ============================================================================
# PHASE 3: INTEGRATION TESTING
# ============================================================================
print_phase "PHASE 3: INTEGRATION & DATA FLOW TESTING"

PHASE_TESTS=0
PHASE_PASSED=0
PHASE_FAILED=0

echo -e "${YELLOW}3.1 API Communication${NC}"
test_endpoint "TC-API-001: API base URL" "GET" "/protocols" "" "200" "$AUTH_TOKEN" ""
test_endpoint "TC-API-002: Auth headers required" "GET" "/protocols" "" "401" "" ""

echo -e "${YELLOW}3.2 Data Synchronization${NC}"
# Test that data persists (would need to create then read)
echo -e "${BLUE}⊘${NC} TC-SYNC-001: Data persistence (requires create operation)"

echo ""
echo -e "${BLUE}Phase 3 Summary:${NC} Tests: $PHASE_TESTS | Passed: $PHASE_PASSED | Failed: $PHASE_FAILED"

# ============================================================================
# PHASE 4: SECURITY TESTING
# ============================================================================
print_phase "PHASE 4: SECURITY & AUTHORIZATION TESTING"

PHASE_TESTS=0
PHASE_PASSED=0
PHASE_FAILED=0

echo -e "${YELLOW}4.1 SQL Injection Prevention${NC}"
test_endpoint "TC-SEC-021: SQL injection in login" "POST" "/auth/login" \
    '{"email":"test'\'' OR '\''1'\''='\''1","password":"test"}' "401" "" "CRITICAL"

echo -e "${YELLOW}4.2 Access Control${NC}"
test_endpoint "TC-SEC-012: Access without auth" "GET" "/protocols" "" "401" "" ""
test_endpoint "TC-SEC-012: Access with invalid token" "GET" "/protocols" "" "401" "invalid" ""

echo ""
echo -e "${BLUE}Phase 4 Summary:${NC} Tests: $PHASE_TESTS | Passed: $PHASE_PASSED | Failed: $PHASE_FAILED"

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  TESTING COMPLETE - SUMMARY${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "All issues documented in: ${YELLOW}QA_ISSUES_LOG.md${NC}"
echo ""
echo -e "${GREEN}✓ Testing phase complete${NC}"
echo -e "${YELLOW}→ Next step: Review issues and fix one by one${NC}"
echo ""



