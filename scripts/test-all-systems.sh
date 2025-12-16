#!/bin/bash

# Comprehensive System Testing Script
# Tests all APIs, forms, and database integrations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

API_URL="${API_URL:-http://localhost:5002}"
TEST_EMAIL="test@researchlab.com"
TEST_PASSWORD="testpass123"
AUTH_TOKEN=""

echo -e "${YELLOW}🧪 Starting Comprehensive System Tests...${NC}\n"

# Function to make API request
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    if [ -z "$token" ]; then
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            "$API_URL$endpoint" \
            ${data:+-d "$data"}
    else
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            "$API_URL$endpoint" \
            ${data:+-d "$data"}
    fi
}

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local token=$6
    
    echo -n "Testing $name... "
    
    response=$(api_request "$method" "$endpoint" "$data" "$token")
    status_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
        -H "Content-Type: application/json" \
        ${token:+-H "Authorization: Bearer $token"} \
        "$API_URL$endpoint" \
        ${data:+-d "$data"})
    
    if [ "$status_code" = "$expected_status" ] || [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Status: $status_code)"
        echo "  Response: $response"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Health Check
echo -e "${YELLOW}1. Health & API Checks${NC}"
test_endpoint "Health Check" "GET" "/api/health" "" "200"
test_endpoint "Root Health" "GET" "/health" "" "200"
echo ""

# 2. Authentication
echo -e "${YELLOW}2. Authentication Tests${NC}"

# Register test user
register_data="{\"email\":\"$TEST_EMAIL\",\"username\":\"testuser\",\"password\":\"$TEST_PASSWORD\",\"first_name\":\"Test\",\"last_name\":\"User\"}"
echo -n "Testing User Registration... "
register_response=$(api_request "POST" "/api/auth/register" "$register_data")
if echo "$register_response" | grep -q "token\|success\|id"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
    # Extract token if available
    AUTH_TOKEN=$(echo "$register_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
else
    echo -e "${YELLOW}⚠ User may already exist${NC}"
fi

# Login
login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
echo -n "Testing Login... "
login_response=$(api_request "POST" "/api/auth/login" "$login_data")
if echo "$login_response" | grep -q "token"; then
    AUTH_TOKEN=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓ PASS${NC} (Token obtained)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "  Response: $login_response"
    ((TESTS_FAILED++))
    exit 1
fi

# Demo login (if available)
test_endpoint "Demo Login" "POST" "/api/auth/demo-login" "{}" "200"
echo ""

# 3. Personal NoteBook
echo -e "${YELLOW}3. Personal NoteBook Tests${NC}"
test_endpoint "Get Notebook Entries" "GET" "/api/lab-notebooks" "" "200" "$AUTH_TOKEN"
test_endpoint "Create Notebook Entry" "POST" "/api/lab-notebooks" "{\"title\":\"Test Entry\",\"content\":\"Test content\",\"date\":\"2025-01-27\"}" "201" "$AUTH_TOKEN"
echo ""

# 4. Protocols
echo -e "${YELLOW}4. Protocols Tests${NC}"
test_endpoint "Get Protocols" "GET" "/api/protocols" "" "200" "$AUTH_TOKEN"
test_endpoint "Create Protocol" "POST" "/api/protocols" "{\"title\":\"Test Protocol\",\"description\":\"Test description\",\"content\":\"Test content\"}" "201" "$AUTH_TOKEN"
echo ""

# 5. Experiment Tracker
echo -e "${YELLOW}5. Experiment Tracker Tests${NC}"
test_endpoint "Get Experiments" "GET" "/api/experiments" "" "200" "$AUTH_TOKEN"
test_endpoint "Get Experiment Templates" "GET" "/api/experiments/templates" "" "200" "$AUTH_TOKEN"
test_endpoint "Get Experiment Analytics" "GET" "/api/experiments/analytics" "" "200" "$AUTH_TOKEN"
echo ""

# 6. Research Tools
echo -e "${YELLOW}6. Research Tools Tests${NC}"
test_endpoint "Get Research Tools" "GET" "/api/research-tools" "" "200" "$AUTH_TOKEN"
echo ""

# 7. Scientist Passport
echo -e "${YELLOW}7. Scientist Passport Tests${NC}"
test_endpoint "Get Scientist Passport" "GET" "/api/scientist-passport" "" "200" "$AUTH_TOKEN"
echo ""

# 8. Paper Library
echo -e "${YELLOW}8. Paper Library Tests${NC}"
test_endpoint "Get Papers" "GET" "/api/papers" "" "200" "$AUTH_TOKEN"
test_endpoint "Search Papers" "GET" "/api/papers/search?query=test" "" "200" "$AUTH_TOKEN"
echo ""

# 9. Settings
echo -e "${YELLOW}9. Settings Tests${NC}"
test_endpoint "Get Settings" "GET" "/api/settings" "" "200" "$AUTH_TOKEN"
echo ""

# 10. AI Research Agent
echo -e "${YELLOW}10. AI Research Agent Tests${NC}"
test_endpoint "AI Chat" "POST" "/api/ai-research-agent/chat" "{\"message\":\"Hello, test message\"}" "200" "$AUTH_TOKEN"
echo ""

# 11. API Management
echo -e "${YELLOW}11. API Management Tests${NC}"
test_endpoint "Get API Keys" "GET" "/api/ai-providers/keys" "" "200" "$AUTH_TOKEN"
test_endpoint "Get Task Assignments" "GET" "/api/api-task-assignments" "" "200" "$AUTH_TOKEN"
test_endpoint "Get Providers" "GET" "/api/ai-providers/providers" "" "200" "$AUTH_TOKEN"
test_endpoint "Get Tasks" "GET" "/api/api-task-assignments/tasks" "" "200" "$AUTH_TOKEN"
echo ""

# 12. Workflows
echo -e "${YELLOW}12. Workflow Tests${NC}"
test_endpoint "Get Workflows" "GET" "/api/workflows" "" "200" "$AUTH_TOKEN"
echo ""

# 13. Agents
echo -e "${YELLOW}13. Agent Tests${NC}"
test_endpoint "Get Available Agents" "GET" "/api/agents" "" "200" "$AUTH_TOKEN"
echo ""

# 14. Orchestrator
echo -e "${YELLOW}14. Orchestrator Tests${NC}"
test_endpoint "Get Workflow Templates" "GET" "/api/orchestrator/templates" "" "200" "$AUTH_TOKEN"
echo ""

# 15. Communications
echo -e "${YELLOW}15. Communications Tests${NC}"
test_endpoint "Get Messages" "GET" "/api/communications/messages" "" "200" "$AUTH_TOKEN"
test_endpoint "Get Connections" "GET" "/api/communications/connections" "" "200" "$AUTH_TOKEN"
echo ""

# 16. Database Integration Tests
echo -e "${YELLOW}16. Database Integration Tests${NC}"

# Test database connection
echo -n "Testing Database Connection... "
if psql -U postgres -d digital_research_manager -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test safety systems tables
echo -n "Testing Safety Systems Tables... "
tables=("approval_requests" "audit_logs" "action_snapshots" "rollback_requests")
all_tables_exist=true
for table in "${tables[@]}"; do
    if ! psql -U postgres -d digital_research_manager -c "\d $table" > /dev/null 2>&1; then
        all_tables_exist=false
        break
    fi
done

if [ "$all_tables_exist" = true ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Some tables missing)"
    ((TESTS_FAILED++))
fi

# Test core tables
echo -n "Testing Core Tables... "
core_tables=("users" "lab_notebook_entries" "protocols" "experiments")
all_core_exist=true
for table in "${core_tables[@]}"; do
    if ! psql -U postgres -d digital_research_manager -c "\d $table" > /dev/null 2>&1; then
        all_core_exist=false
        break
    fi
done

if [ "$all_core_exist" = true ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Some tables missing)"
    ((TESTS_FAILED++))
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
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

