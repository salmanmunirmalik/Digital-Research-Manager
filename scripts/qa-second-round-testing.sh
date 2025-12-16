#!/bin/bash

# QA Second Round Testing Script
# Tests all fixes made during the fixing phase

set -e

echo "🧪 QA SECOND ROUND TESTING"
echo "=========================="
echo ""
echo "Testing all fixes from the fixing phase..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
SKIPPED=0

# Base URL
BASE_URL="${API_URL:-http://localhost:5002}"
TOKEN="${AUTH_TOKEN:-demo-token-123}"

# Test counter
test_count=0

# Function to run a test
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="${5:-200}"
    
    test_count=$((test_count + 1))
    echo "[$test_count] Testing: $test_name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL$endpoint" 2>&1)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} - HTTP $http_code (expected $expected_status)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - HTTP $http_code (expected $expected_status)"
        echo "Response: $body" | head -c 200
        echo ""
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to test without auth (should return 401)
run_test_no_auth() {
    local test_name="$1"
    local endpoint="$2"
    
    test_count=$((test_count + 1))
    echo "[$test_count] Testing: $test_name (no auth - should return 401)"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "401" ]; then
        echo -e "${GREEN}✅ PASS${NC} - HTTP 401 (authentication required)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} - HTTP $http_code (expected 401)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "📋 TEST SUITE 1: CRIT-002 - HTTP 500 Errors Fixed"
echo "=================================================="
echo ""

# Test all endpoints that were fixed for HTTP 500 errors
run_test "GET /api/protocols" "GET" "/api/protocols"
run_test "GET /api/lab-notebooks" "GET" "/api/lab-notebooks"
run_test "GET /api/labs" "GET" "/api/labs"
run_test "GET /api/inventory" "GET" "/api/inventory"
run_test "GET /api/instruments" "GET" "/api/instruments"
run_test "GET /api/scientist-passport/skills" "GET" "/api/scientist-passport/skills"
run_test "GET /api/settings" "GET" "/api/settings"
run_test "GET /api/services/categories" "GET" "/api/services/categories"
run_test "GET /api/negative-results" "GET" "/api/negative-results"
run_test "GET /api/lab-workspace" "GET" "/api/lab-workspace"

echo ""
echo "📋 TEST SUITE 2: HIGH-002 - Missing Endpoints Fixed"
echo "====================================================="
echo ""

# Test all endpoints that were added/mounted
run_test "GET /api/experiment-tracker" "GET" "/api/experiment-tracker"
run_test "GET /api/project-management/projects" "GET" "/api/project-management/projects"
run_test "GET /api/ai-research-agent" "GET" "/api/ai-research-agent"
run_test "GET /api/data-results" "GET" "/api/data-results"
run_test "GET /api/auth/profile" "GET" "/api/auth/profile"

echo ""
echo "📋 TEST SUITE 3: HIGH-001 - Login Error Handling"
echo "=================================================="
echo ""

# Test login with invalid credentials (should return 401, not 500)
run_test "POST /api/auth/login (invalid email)" "POST" "/api/auth/login" '{"email":"nonexistent@test.com","password":"wrongpass"}' "401"
run_test "POST /api/auth/login (invalid password)" "POST" "/api/auth/login" '{"email":"researcher@researchlab.com","password":"wrongpass"}' "401"

echo ""
echo "📋 TEST SUITE 4: Authentication Required (Safety Checks)"
echo "=========================================================="
echo ""

# Test that endpoints require authentication
run_test_no_auth "GET /api/protocols (no auth)" "/api/protocols"
run_test_no_auth "GET /api/lab-notebooks (no auth)" "/api/lab-notebooks"
run_test_no_auth "GET /api/labs (no auth)" "/api/labs"

echo ""
echo "📋 TEST SUITE 5: CRIT-003 - TypeScript Compilation"
echo "==================================================="
echo ""

echo "[$((test_count + 1))] Testing: TypeScript compilation"
if pnpm run type-check > /tmp/typecheck.log 2>&1; then
    echo -e "${GREEN}✅ PASS${NC} - TypeScript compilation successful"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAIL${NC} - TypeScript compilation errors found"
    echo "Errors:"
    tail -20 /tmp/typecheck.log
    FAILED=$((FAILED + 1))
fi
test_count=$((test_count + 1))

echo ""
echo "📊 TEST RESULTS SUMMARY"
echo "======================="
echo ""
echo -e "Total Tests: $test_count"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
    exit 1
fi



