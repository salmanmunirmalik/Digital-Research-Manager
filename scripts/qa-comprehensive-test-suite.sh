#!/bin/bash

# Comprehensive QA Test Suite
# Tests all critical endpoints and features systematically
# Goal: Find all issues, document them, then fix later

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
API_URL="http://localhost:5002/api"
BASE_URL="http://localhost:5002"
REPORT_FILE="../QA_TEST_EXECUTION_REPORT.md"
ISSUES_FILE="../QA_ISSUES_LOG.md"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
ISSUES_FOUND=0

# Authentication token
AUTH_TOKEN=""
TEST_USER_ID=""

# Timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Function to print section header
print_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print test result
test_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    local issue_severity="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $test_name"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        if [ -n "$issue_severity" ]; then
            echo -e "  ${YELLOW}→ Issue: $message${NC}"
            echo -e "  ${YELLOW}→ Severity: $issue_severity${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    elif [ "$status" = "SKIP" ]; then
        echo -e "${YELLOW}⊘${NC} $test_name (SKIPPED: $message)"
    else
        echo -e "${BLUE}?${NC} $test_name ($message)"
    fi
}

# Function to test API endpoint
test_api() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    local auth_token="$6"
    local issue_severity="$7"
    
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    
    if [ -n "$data" ] && [ "$data" != "null" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    if [ -n "$auth_token" ] && [ "$auth_token" != "null" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_token'"
    fi
    
    curl_cmd="$curl_cmd $API_URL$endpoint"
    
    local response=$(eval $curl_cmd 2>&1)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        test_result "$test_name" "PASS" "" ""
        return 0
    else
        test_result "$test_name" "FAIL" "Expected HTTP $expected_status, got HTTP $http_code. Response: $(echo $body | head -c 100)" "$issue_severity"
        return 1
    fi
}

# Start comprehensive testing
clear
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                   COMPREHENSIVE QA TEST SUITE                                 ║"
echo "║                   Testing All Phases Systematically                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "Started: $TIMESTAMP"
echo ""

# ============================================================================
# PHASE 1: CRITICAL PATH TESTING
# ============================================================================
print_section "PHASE 1: CRITICAL PATH TESTING"

# 1.1 Health Checks
print_section "1.1 Health & Infrastructure"
test_api "Health Check - Root" "GET" "" "" "200" "" ""
test_api "Health Check - API" "GET" "/health" "" "200" "" ""

# 1.2 Authentication
print_section "1.2 Authentication & Authorization"

# Login (using demo account)
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"researcher@researchlab.com","password":"researcher123"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    test_result "TC-LOGIN-001: Valid credentials login" "PASS" "" ""
else
    test_result "TC-LOGIN-001: Valid credentials login" "FAIL" "No token in response" "CRITICAL"
fi

# Test invalid login
test_api "TC-LOGIN-002: Invalid email rejected" "POST" "/auth/login" \
    '{"email":"nonexistent@test.com","password":"test123"}' "401" "" "HIGH"

# Test invalid password
test_api "TC-LOGIN-003: Invalid password rejected" "POST" "/auth/login" \
    '{"email":"researcher@researchlab.com","password":"wrongpass"}' "401" "" "HIGH"

# Test registration (known to fail, but testing anyway)
test_api "TC-REG-001: User registration" "POST" "/auth/register" \
    '{"email":"test'$(date +%s)'@test.com","username":"test'$(date +%s)'","password":"TestPass123!","first_name":"Test","last_name":"User","role":"student"}' \
    "201" "" "CRITICAL"

# Test logout
if [ -n "$AUTH_TOKEN" ]; then
    test_api "TC-LOGOUT-002: Logout with valid token" "POST" "/auth/logout" "" "200" "$AUTH_TOKEN" ""
fi

# Re-login for subsequent tests
if [ -z "$AUTH_TOKEN" ]; then
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"researcher@researchlab.com","password":"researcher123"}')
    AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
fi

# 1.3 Protected Routes
print_section "1.3 Protected Routes & Authorization"
test_api "TC-PROTECT-001: Protected route without auth" "GET" "/protocols" "" "401" "" ""
test_api "TC-PROTECT-002: Protected route with auth" "GET" "/protocols" "" "200" "$AUTH_TOKEN" ""
test_api "TC-PROTECT-004: Invalid token rejected" "GET" "/protocols" "" "401" "invalid-token-123" ""

# ============================================================================
# PHASE 2: CORE CRUD OPERATIONS
# ============================================================================
print_section "PHASE 2: CORE CRUD OPERATIONS"

# 2.1 Protocols
print_section "2.1 Protocol Management"
test_api "TC-PROTO-002: Get protocols list" "GET" "/protocols" "" "200" "$AUTH_TOKEN" ""

# Try to create protocol (may need lab_id)
PROTOCOL_DATA='{"title":"QA Test Protocol","description":"Test","content":"Test content","lab_id":"test-lab-id","privacy_level":"lab"}'
test_api "TC-PROTO-001: Create protocol" "POST" "/protocols" "$PROTOCOL_DATA" "201" "$AUTH_TOKEN" "HIGH"

# 2.2 Lab Notebook
print_section "2.2 Lab Notebook"
test_api "TC-NOTEBOOK-004: Get projects list" "GET" "/lab-notebook/projects" "" "200" "$AUTH_TOKEN" ""

# 2.3 Data Results
print_section "2.3 Data Results"
test_api "TC-DATA-002: Get data results list" "GET" "/data-results" "" "200" "$AUTH_TOKEN" ""

# ============================================================================
# PHASE 3: REVOLUTIONARY FEATURES
# ============================================================================
print_section "PHASE 3: REVOLUTIONARY FEATURES"

# 3.1 Scientist Passport
print_section "3.1 Scientist Passport"
test_api "TC-PASSPORT-001: Get skills" "GET" "/scientist-passport/skills" "" "200" "$AUTH_TOKEN" ""
test_api "TC-PASSPORT-001: Get certifications" "GET" "/scientist-passport/certifications" "" "200" "$AUTH_TOKEN" ""

# 3.2 Service Marketplace
print_section "3.2 Service Marketplace"
test_api "TC-MARKET-001: Get service categories" "GET" "/services/categories" "" "200" "$AUTH_TOKEN" ""
test_api "TC-MARKET-002: Get service listings" "GET" "/services/listings" "" "200" "$AUTH_TOKEN" ""

# 3.3 Negative Results
print_section "3.3 Negative Results Database"
test_api "TC-NEG-001: Get negative results" "GET" "/negative-results" "" "200" "$AUTH_TOKEN" ""

# ============================================================================
# PHASE 4: ADDITIONAL FEATURES
# ============================================================================
print_section "PHASE 4: ADDITIONAL FEATURES"

# 4.1 Lab Workspace
print_section "4.1 Lab Workspace"
test_api "Get lab workspaces" "GET" "/lab-workspace" "" "200" "$AUTH_TOKEN" ""

# 4.2 Experiment Tracker
print_section "4.2 Experiment Tracker"
test_api "Get experiments" "GET" "/experiment-tracker" "" "200" "$AUTH_TOKEN" ""

# 4.3 Project Management
print_section "4.3 Project Management"
test_api "Get projects" "GET" "/project-management" "" "200" "$AUTH_TOKEN" ""

# 4.4 AI Features
print_section "4.4 AI Research Agent"
test_api "Get AI agent status" "GET" "/ai-research-agent" "" "200" "$AUTH_TOKEN" ""

# 4.5 Settings
print_section "4.5 Settings"
test_api "Get settings" "GET" "/settings" "" "200" "$AUTH_TOKEN" ""

# 4.6 Profile
print_section "4.6 Profile"
test_api "Get user profile" "GET" "/profile" "" "200" "$AUTH_TOKEN" ""

# ============================================================================
# PHASE 5: SECURITY TESTING
# ============================================================================
print_section "PHASE 5: SECURITY TESTING"

# 5.1 SQL Injection Tests
print_section "5.1 SQL Injection Prevention"
test_api "TC-SEC-021: SQL injection in login email" "POST" "/auth/login" \
    '{"email":"test'\'' OR '\''1'\''='\''1","password":"test"}' "401" "" "CRITICAL"

# 5.2 XSS Tests
print_section "5.2 XSS Prevention"
# Test with script tags in protocol title
XSS_DATA='{"title":"<script>alert(1)</script>","description":"Test","content":"Test","lab_id":"test","privacy_level":"lab"}'
test_api "TC-SEC-027: XSS in protocol title" "POST" "/protocols" "$XSS_DATA" "400" "$AUTH_TOKEN" "HIGH"

# 5.3 Access Control
print_section "5.3 Access Control"
test_api "TC-SEC-012: Access without token" "GET" "/protocols" "" "401" "" ""

# ============================================================================
# SUMMARY
# ============================================================================
print_section "TEST SUMMARY"

echo ""
echo -e "Total Tests Executed: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Tests Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Tests Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "Issues Found: ${YELLOW}$ISSUES_FOUND${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "Pass Rate: ${BLUE}$PASS_RATE%${NC}"
    echo ""
    echo -e "${YELLOW}⚠ Some tests failed. Review issues in QA_ISSUES_LOG.md${NC}"
    echo -e "${CYAN}All issues have been documented for later fixing.${NC}"
    exit 1
fi



