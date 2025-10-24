#!/bin/bash

# Dashboard E2E Test Script
# Tests dashboard functionality

set -e

BASE_URL="http://localhost:5173"
TIMEOUT=10

echo "🧪 Dashboard E2E Test Suite"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" -m $TIMEOUT "$url" || echo "000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $http_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        ((FAILED++))
        return 1
    fi
}

# Start
echo "📍 Testing Dashboard Page"
echo "------------------------"

# Test 1: Dashboard page loads
test_endpoint "Dashboard page" "$BASE_URL/dashboard" 200

# Test 2: Dashboard API endpoints
echo ""
echo "📍 Testing Dashboard API Endpoints"
echo "------------------------"

# Test dashboard stats endpoint
test_endpoint "Dashboard Stats API" "$BASE_URL/api/dashboard/stats" 200

# Test calendar events endpoint
test_endpoint "Calendar Events API" "$BASE_URL/api/calendar/events" 200

# Test recent activity endpoint
test_endpoint "Recent Activity API" "$BASE_URL/api/dashboard/recent-activity" 200

# Test 3: Check if dashboard is a React app
echo ""
echo "📍 Testing React App Structure"
echo "------------------------"

response=$(curl -s -m $TIMEOUT "$BASE_URL/dashboard" || echo "")

if echo "$response" | grep -q "react"; then
    echo -e "${GREEN}✓ React app detected${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ React not detected in response${NC}"
fi

# Test 4: Check for authentication
echo ""
echo "📍 Testing Authentication"
echo "------------------------"

if echo "$response" | grep -q "login\|Login\|auth"; then
    echo -e "${GREEN}✓ Authentication system detected${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ No authentication detected${NC}"
fi

# Summary
echo ""
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
