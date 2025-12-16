#!/bin/bash

# QA Phase 1.1: Authentication & Authorization Testing Script
# This script systematically tests all authentication flows

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:5002/api"
TEST_EMAIL="qa_test_$(date +%s)@test.com"
TEST_USERNAME="qa_test_$(date +%s)"
TEST_PASSWORD="TestPass123!"
TEST_FIRST_NAME="QA"
TEST_LAST_NAME="Test"

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to print test header
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Function to test API endpoint
test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    local auth_token="$6"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    echo -n "Testing: $test_name... "
    
    # Build curl command
    CURL_CMD="curl -s -w '\n%{http_code}' -X $method"
    
    if [ -n "$data" ]; then
        CURL_CMD="$CURL_CMD -H 'Content-Type: application/json' -d '$data'"
    fi
    
    if [ -n "$auth_token" ]; then
        CURL_CMD="$CURL_CMD -H 'Authorization: Bearer $auth_token'"
    fi
    
    CURL_CMD="$CURL_CMD $API_URL$endpoint"
    
    # Execute and capture response
    RESPONSE=$(eval $CURL_CMD 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    # Check result
    if [ "$HTTP_CODE" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$BODY" | head -c 200
        echo ""
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got HTTP $HTTP_CODE)"
        echo "Response: $BODY"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Start testing
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  QA Phase 1.1: Authentication & Authorization Testing   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# TEST 1.1.1: User Registration
# ============================================
print_header "TEST 1.1.1: User Registration"

# TC-REG-001: New user can register with valid email
REG_DATA="{\"email\":\"$TEST_EMAIL\",\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"$TEST_FIRST_NAME\",\"last_name\":\"$TEST_LAST_NAME\",\"role\":\"student\"}"
test_endpoint "TC-REG-001: Register new user" "POST" "/auth/register" "$REG_DATA" "201"
REG_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")

# TC-REG-002: Registration validates email format
INVALID_EMAIL_DATA="{\"email\":\"invalid-email\",\"username\":\"test2\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\",\"role\":\"student\"}"
test_endpoint "TC-REG-002: Invalid email format rejected" "POST" "/auth/register" "$INVALID_EMAIL_DATA" "400"

# TC-REG-003: Registration validates password strength
# Note: Frontend validation, but should also check backend
WEAK_PASSWORD_DATA="{\"email\":\"test2@test.com\",\"username\":\"test2\",\"password\":\"123\",\"first_name\":\"Test\",\"last_name\":\"User\",\"role\":\"student\"}"
test_endpoint "TC-REG-003: Weak password rejected" "POST" "/auth/register" "$WEAK_PASSWORD_DATA" "400"

# TC-REG-004: Duplicate email registration is rejected
test_endpoint "TC-REG-004: Duplicate email rejected" "POST" "/auth/register" "$REG_DATA" "400"

# TC-REG-005: Registration creates user in database
# Verified by successful registration above

# TC-REG-010: Registration prevents SQL injection
SQL_INJECTION_DATA="{\"email\":\"test' OR '1'='1@test.com\",\"username\":\"test3\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\",\"role\":\"student\"}"
test_endpoint "TC-REG-010: SQL injection prevented" "POST" "/auth/register" "$SQL_INJECTION_DATA" "400"

# ============================================
# TEST 1.1.2: User Login
# ============================================
print_header "TEST 1.1.2: User Login"

# TC-LOGIN-001: Valid credentials allow login
LOGIN_DATA="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
test_endpoint "TC-LOGIN-001: Valid credentials login" "POST" "/auth/login" "$LOGIN_DATA" "200"
LOGIN_TOKEN=$(echo "$BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")

# TC-LOGIN-002: Invalid email shows appropriate error
INVALID_EMAIL_LOGIN="{\"email\":\"nonexistent@test.com\",\"password\":\"$TEST_PASSWORD\"}"
test_endpoint "TC-LOGIN-002: Invalid email rejected" "POST" "/auth/login" "$INVALID_EMAIL_LOGIN" "401"

# TC-LOGIN-003: Invalid password shows appropriate error
INVALID_PASSWORD_LOGIN="{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}"
test_endpoint "TC-LOGIN-003: Invalid password rejected" "POST" "/auth/login" "$INVALID_PASSWORD_LOGIN" "401"

# TC-LOGIN-004: Login generates valid JWT token
if [ -n "$LOGIN_TOKEN" ]; then
    echo -e "${GREEN}✓ PASS${NC} TC-LOGIN-004: JWT token generated"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
else
    echo -e "${RED}✗ FAIL${NC} TC-LOGIN-004: No token in response"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
fi

# TC-LOGIN-011: Login prevents SQL injection
SQL_INJECTION_LOGIN="{\"email\":\"test' OR '1'='1\",\"password\":\"$TEST_PASSWORD\"}"
test_endpoint "TC-LOGIN-011: SQL injection prevented" "POST" "/auth/login" "$SQL_INJECTION_LOGIN" "401"

# ============================================
# TEST 1.1.3: User Logout
# ============================================
print_header "TEST 1.1.3: User Logout"

# TC-LOGOUT-002: Logout clears authentication token
if [ -n "$LOGIN_TOKEN" ]; then
    test_endpoint "TC-LOGOUT-002: Logout with valid token" "POST" "/auth/logout" "" "200" "$LOGIN_TOKEN"
else
    echo -e "${YELLOW}⚠ SKIP${NC} TC-LOGOUT-002: No token available"
fi

# ============================================
# TEST 1.1.4: Protected Routes
# ============================================
print_header "TEST 1.1.4: Protected Routes"

# TC-PROTECT-001: Unauthenticated users redirected from protected routes
test_endpoint "TC-PROTECT-001: Protected route without auth" "GET" "/protocols" "" "401"

# TC-PROTECT-002: Authenticated users can access protected routes
if [ -n "$LOGIN_TOKEN" ]; then
    test_endpoint "TC-PROTECT-002: Protected route with auth" "GET" "/protocols" "" "200" "$LOGIN_TOKEN"
else
    # Get a new token
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" -H "Content-Type: application/json" -d "$LOGIN_DATA")
    LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
    if [ -n "$LOGIN_TOKEN" ]; then
        test_endpoint "TC-PROTECT-002: Protected route with auth" "GET" "/protocols" "" "200" "$LOGIN_TOKEN"
    fi
fi

# TC-PROTECT-004: Invalid tokens are rejected
test_endpoint "TC-PROTECT-004: Invalid token rejected" "GET" "/protocols" "" "401" "invalid-token-12345"

# ============================================
# Summary
# ============================================
print_header "TEST SUMMARY"

echo -e "Total Tests: ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All authentication tests passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}✗ Some tests failed. Review the output above.${NC}"
    exit 1
fi




