#!/bin/bash

# Test Completed Tasks
# Tests API Management, Task Assignments, Workflows, and AI Research Agent

echo "🧪 Testing Completed Tasks..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: API Management Endpoints
echo "📋 Test 1: API Management Endpoints"
echo "Testing /api/ai-providers/keys endpoint..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/ai-providers/keys | grep -q "401\|200"; then
    echo -e "${GREEN}✅ API Management endpoint exists${NC}"
else
    echo -e "${RED}❌ API Management endpoint not accessible${NC}"
fi
echo ""

# Test 2: Task Assignment Endpoints
echo "📋 Test 2: Task Assignment Endpoints"
echo "Testing /api/api-task-assignments/tasks endpoint..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/api-task-assignments/tasks | grep -q "401\|200"; then
    echo -e "${GREEN}✅ Task Assignment endpoint exists${NC}"
else
    echo -e "${RED}❌ Task Assignment endpoint not accessible${NC}"
fi
echo ""

# Test 3: Workflow Endpoints
echo "📋 Test 3: Workflow Endpoints"
echo "Testing /api/workflows endpoint..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/workflows | grep -q "401\|200"; then
    echo -e "${GREEN}✅ Workflow endpoint exists${NC}"
else
    echo -e "${RED}❌ Workflow endpoint not accessible${NC}"
fi
echo ""

# Test 4: AI Research Agent Endpoint
echo "📋 Test 4: AI Research Agent Endpoint"
echo "Testing /api/ai-research-agent/chat endpoint..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/ai-research-agent/chat | grep -q "401\|400"; then
    echo -e "${GREEN}✅ AI Research Agent endpoint exists${NC}"
else
    echo -e "${RED}❌ AI Research Agent endpoint not accessible${NC}"
fi
echo ""

# Test 5: Database Tables
echo "📋 Test 5: Database Tables"
echo "Checking if database tables exist..."
# This would require database connection, skipping for now
echo -e "${YELLOW}⚠️  Database table check requires DB connection${NC}"
echo ""

echo "✅ Testing complete!"
echo ""
echo "Next: Starting Week 1-2 Foundation Tasks..."

