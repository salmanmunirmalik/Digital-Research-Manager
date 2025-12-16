#!/bin/bash

# API Endpoints Test Script
# Tests all critical API endpoints when server is running

set -e

API_URL="${PLAYWRIGHT_API_URL:-http://localhost:5002}"
DEMO_TOKEN="${DEMO_AUTH_TOKEN:-demo-token-123}"

echo "🧪 Testing API Endpoints"
echo "API URL: $API_URL"
echo "========================="
echo ""

PASSED=0
FAILED=0

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=${4:-200}
    local data=$5
    
    local url="$API_URL$endpoint"
    local status_code
    
    if [ "$method" == "GET" ]; then
        status_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $DEMO_TOKEN" \
            "$url")
    elif [ "$method" == "POST" ]; then
        status_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $DEMO_TOKEN" \
            -H "Content-Type: application/json" \
            -X POST \
            -d "$data" \
            "$url")
    else
        status_code=$(curl -s -o /dev/null -w "%{http_code}" \
            -H "Authorization: Bearer $DEMO_TOKEN" \
            -X "$method" \
            "$url")
    fi
    
    if [ "$status_code" == "$expected_status" ]; then
        echo "✅ PASS: $description ($method $endpoint) - Status: $status_code"
        ((PASSED++))
        return 0
    else
        echo "❌ FAIL: $description ($method $endpoint) - Expected: $expected_status, Got: $status_code"
        ((FAILED++))
        return 1
    fi
}

# Health checks
echo "📡 Health & Status Endpoints"
test_endpoint "GET" "/health" "Health check"
test_endpoint "GET" "/api/health" "API health check"

# Authentication
echo ""
echo "🔐 Authentication Endpoints"
test_endpoint "POST" "/api/auth/login" "Login endpoint" "200" '{"email":"researcher@researchlab.com","password":"researcher123"}'
test_endpoint "GET" "/api/auth/profile" "Get user profile"

# Core Features
echo ""
echo "📚 Personal NoteBook Endpoints"
test_endpoint "GET" "/api/lab-notebooks" "Get Personal NoteBook entries"
test_endpoint "GET" "/api/lab-notebooks/entry-types" "Get entry types"

echo ""
echo "📋 Professional Protocols Endpoints"
test_endpoint "GET" "/api/protocols" "Get protocols"
test_endpoint "GET" "/api/protocols/templates" "Get protocol templates"

echo ""
echo "🔬 Experiment Tracker Endpoints"
test_endpoint "GET" "/api/experiments" "Get experiments"
test_endpoint "GET" "/api/experiments/templates" "Get experiment templates"

echo ""
echo "🛠️ Research Tools Endpoints"
test_endpoint "GET" "/api/tools" "Get research tools"
test_endpoint "GET" "/api/tools/calculators" "Get calculators"

echo ""
echo "👤 Scientist Passport Endpoints"
test_endpoint "GET" "/api/scientist-passport/gamification" "Get gamification data"

echo ""
echo "📄 Paper Library Endpoints"
test_endpoint "GET" "/api/papers" "Get papers"
test_endpoint "GET" "/api/papers/library" "Get paper library"

echo ""
echo "⚙️ Settings Endpoints"
test_endpoint "GET" "/api/settings" "Get user settings"

echo ""
echo "💬 Communications Endpoints"
test_endpoint "GET" "/api/communications/conversations" "Get conversations"

echo ""
echo "📊 Summary"
echo "=========="
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "🎉 All API endpoints are working!"
    exit 0
else
    echo "⚠️  Some endpoints failed. Check server logs."
    exit 1
fi

