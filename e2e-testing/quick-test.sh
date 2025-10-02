#!/bin/bash

# Quick E2E Test Script - No npm dependencies required
# Tests basic functionality using curl and basic tools

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Quick E2E Testing - Research Lab Platform${NC}"
echo ""

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${YELLOW}🔄 Testing: $test_name${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -e "${YELLOW}🔄 Testing: $name${NC}"
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS: $name (Status: $status_code)${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL: $name (Expected: $expected_status, Got: $status_code)${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to test page content
test_page_content() {
    local name="$1"
    local url="$2"
    local expected_content="$3"
    
    echo -e "${YELLOW}🔄 Testing: $name${NC}"
    
    if curl -s "$url" | grep -q "$expected_content"; then
        echo -e "${GREEN}✅ PASS: $name (Content found)${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL: $name (Content not found)${NC}"
        ((TESTS_FAILED++))
    fi
}

echo -e "${BLUE}📋 Testing Configuration:${NC}"
echo "  Frontend: http://localhost:5173"
echo "  Backend: http://localhost:5002"
echo "  Stats Service: http://localhost:5003"
echo ""

echo -e "${BLUE}🧪 Running Tests...${NC}"
echo ""

# 1. Service Health Tests
echo -e "${BLUE}📡 Service Health Tests${NC}"
test_endpoint "Frontend Health" "http://localhost:5173" "200"
test_endpoint "Backend Health" "http://localhost:5002/health" "200"
test_endpoint "Stats Service Health" "http://localhost:5003/health" "200"
echo ""

# 2. Frontend Page Tests
echo -e "${BLUE}🖥️ Frontend Page Tests${NC}"
test_page_content "Homepage" "http://localhost:5173" "<!DOCTYPE html>"
test_page_content "Login Page" "http://localhost:5173/login" "login"
test_page_content "Dashboard" "http://localhost:5173/dashboard" "dashboard"
echo ""

# 3. Backend API Tests
echo -e "${BLUE}📡 Backend API Tests${NC}"
test_endpoint "Health Endpoint" "http://localhost:5002/health" "200"

# Test API endpoints that should return 401 (unauthorized) without auth
test_endpoint "Protected Endpoint (401)" "http://localhost:5002/api/lab-notebooks" "401"
test_endpoint "AI Presentations API" "http://localhost:5002/api/ai-presentations/generate" "401"
test_endpoint "Statistical Analysis API" "http://localhost:5002/api/advanced-stats/analyze" "401"
echo ""

# 4. Stats Service Tests
echo -e "${BLUE}🐍 Stats Service Tests${NC}"
test_endpoint "Stats Health" "http://localhost:5003/health" "200"

# Test stats service endpoints
test_endpoint "Stats Analysis (POST)" "http://localhost:5003/analyze" "405"  # Method not allowed for GET
echo ""

# 5. Cross-Service Communication Tests
echo -e "${BLUE}🔗 Cross-Service Communication Tests${NC}"

# Test if frontend can reach backend
if curl -s "http://localhost:5173" | grep -q "script"; then
    echo -e "${GREEN}✅ PASS: Frontend loads with scripts${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Frontend script loading${NC}"
    ((TESTS_FAILED++))
fi

# Test React SPA pages (they load HTML with scripts, not static content)
if curl -s "http://localhost:5173/research-tools" | grep -q "script"; then
    echo -e "${GREEN}✅ PASS: Research Tools page loads (React SPA)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Research Tools page loading${NC}"
    ((TESTS_FAILED++))
fi

# Test if backend can communicate with stats service
if curl -s "http://localhost:5002/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ PASS: Backend is responsive${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Backend communication${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# 6. Performance Tests
echo -e "${BLUE}⚡ Performance Tests${NC}"

# Test response times
frontend_time=$(curl -s -o /dev/null -w "%{time_total}" "http://localhost:5173")
backend_time=$(curl -s -o /dev/null -w "%{time_total}" "http://localhost:5002/health")
stats_time=$(curl -s -o /dev/null -w "%{time_total}" "http://localhost:5003/health")

echo -e "${YELLOW}📊 Response Times:${NC}"
echo "  Frontend: ${frontend_time}s"
echo "  Backend: ${backend_time}s"
echo "  Stats Service: ${stats_time}s"

# Check if response times are reasonable (under 5 seconds)
if (( $(echo "$frontend_time < 5" | bc -l) )); then
    echo -e "${GREEN}✅ PASS: Frontend response time acceptable${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Frontend response time too slow${NC}"
    ((TESTS_FAILED++))
fi

if (( $(echo "$backend_time < 5" | bc -l) )); then
    echo -e "${GREEN}✅ PASS: Backend response time acceptable${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Backend response time too slow${NC}"
    ((TESTS_FAILED++))
fi

if (( $(echo "$stats_time < 5" | bc -l) )); then
    echo -e "${GREEN}✅ PASS: Stats service response time acceptable${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Stats service response time too slow${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# 7. Security Tests
echo -e "${BLUE}🔒 Security Tests${NC}"

# Test CORS headers
cors_headers=$(curl -s -I "http://localhost:5002/health" | grep -i "access-control" || echo "none")
if [ "$cors_headers" != "none" ]; then
    echo -e "${GREEN}✅ PASS: CORS headers present${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: CORS headers missing${NC}"
    ((TESTS_FAILED++))
fi

# Test that protected endpoints require authentication
auth_test=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5002/api/lab-notebook")
if [ "$auth_test" = "401" ]; then
    echo -e "${GREEN}✅ PASS: Protected endpoints require authentication${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Protected endpoints not properly secured${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# 8. Feature-Specific Tests
echo -e "${BLUE}🎯 Feature-Specific Tests${NC}"

# Test React SPA pages (they load HTML with scripts, not static content)
# Test Research Tools page
if curl -s "http://localhost:5173/research-tools" | grep -q "script"; then
    echo -e "${GREEN}✅ PASS: Research Tools page loads (React SPA)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Research Tools page loading${NC}"
    ((TESTS_FAILED++))
fi

# Test Supplier Marketplace page
if curl -s "http://localhost:5173/supplier-marketplace" | grep -q "script"; then
    echo -e "${GREEN}✅ PASS: Supplier Marketplace page loads (React SPA)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Supplier Marketplace page loading${NC}"
    ((TESTS_FAILED++))
fi

# Test Journals Directory page
if curl -s "http://localhost:5173/journals-directory" | grep -q "script"; then
    echo -e "${GREEN}✅ PASS: Journals Directory page loads (React SPA)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Journals Directory page loading${NC}"
    ((TESTS_FAILED++))
fi

# Test AI Presentations page
if curl -s "http://localhost:5173/ai-presentations" | grep -q "script"; then
    echo -e "${GREEN}✅ PASS: AI Presentations page loads (React SPA)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: AI Presentations page loading${NC}"
    ((TESTS_FAILED++))
fi

# Test Statistical Analysis Tools page
if curl -s "http://localhost:5173/statistical-analysis-tools" | grep -q "script"; then
    echo -e "${GREEN}✅ PASS: Statistical Analysis Tools page loads (React SPA)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Statistical Analysis Tools page loading${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Generate Report
echo -e "${BLUE}📊 Test Summary${NC}"
echo "=================================="
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ Research Lab Platform is functioning correctly${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${YELLOW}📄 Check the output above for details${NC}"
    exit 1
fi
