#!/bin/bash

# E2E Testing Script for Recommendations and Notebook Summaries
# This script tests the API endpoints for the new features

echo "🧪 E2E Testing - Recommendations & Notebook Summaries"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:5002/api}"
TOKEN="${AUTH_TOKEN:-}"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5
    
    echo -n "Testing: $test_name... "
    
    if [ -z "$TOKEN" ]; then
        echo -e "${YELLOW}SKIPPED (no auth token)${NC}"
        return
    fi
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET \
            "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST \
            "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
        echo "  Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Check if server is running
echo "🔍 Checking server status..."
if curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" | grep -q "200\|404"; then
    echo -e "${GREEN}✓ Server is reachable${NC}"
else
    echo -e "${RED}✗ Server is not reachable at $API_URL${NC}"
    echo "  Please start the server first: npm run dev:server"
    exit 1
fi

echo ""
echo "📋 Running API Tests..."
echo ""

# Test Recommendations Endpoints
echo "=== Recommendations API Tests ==="
test_endpoint "GET" "/recommendations/protocols?limit=5" "" "200" "Get Protocol Recommendations"
test_endpoint "GET" "/recommendations/papers?limit=10" "" "200" "Get Paper Recommendations"
test_endpoint "GET" "/recommendations/services?type=requester&limit=5" "" "200" "Get Service Recommendations"

# Test Feedback Endpoint (if we have a recommendation ID)
test_endpoint "POST" "/recommendations/feedback" \
    '{"recommendationId": "test-id", "itemId": "test-item", "itemType": "protocols", "feedback": "positive"}' \
    "200\|201" "Submit Recommendation Feedback"

# Test Tracking Endpoint
test_endpoint "POST" "/recommendations/track" \
    '{"itemId": "test-item", "itemType": "protocols", "eventType": "view"}' \
    "200\|201" "Track Recommendation Event"

echo ""
echo "=== Notebook Summaries API Tests ==="
test_endpoint "POST" "/notebook-summaries/generate" \
    '{"summaryType": "daily", "dateRange": {"start": "2025-01-27", "end": "2025-01-27"}}' \
    "200\|201" "Generate Daily Summary"

test_endpoint "POST" "/notebook-summaries/generate" \
    '{"summaryType": "weekly", "dateRange": {"start": "2025-01-20", "end": "2025-01-27"}}' \
    "200\|201" "Generate Weekly Summary"

echo ""
echo "=================================================="
echo "📊 Test Results:"
echo "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo "  ${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi


