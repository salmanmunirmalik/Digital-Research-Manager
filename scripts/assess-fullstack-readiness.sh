#!/bin/bash

# Full-Stack Readiness Assessment Script
# Tests all critical components before deployment

set -e

echo "🚀 Digital Research Manager - Full-Stack Readiness Assessment"
echo "=============================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0
WARNINGS=0

# Report file
REPORT_FILE="fullstack-readiness-report-$(date +%Y%m%d-%H%M%S).md"
echo "# Full-Stack Readiness Assessment Report" > "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Function to log results
log_result() {
    local status=$1
    local message=$2
    local details=$3
    
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $message"
        echo "✅ **PASS**: $message" >> "$REPORT_FILE"
        ((PASSED++))
    elif [ "$status" == "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC}: $message"
        echo "❌ **FAIL**: $message" >> "$REPORT_FILE"
        ((FAILED++))
    elif [ "$status" == "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC}: $message"
        echo "⚠️  **WARN**: $message" >> "$REPORT_FILE"
        ((WARNINGS++))
    fi
    
    if [ -n "$details" ]; then
        echo "   $details" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        log_result "PASS" "$description" "Endpoint responded with $expected_status"
        return 0
    else
        log_result "FAIL" "$description" "Endpoint did not respond correctly"
        return 1
    fi
}

echo "📋 Phase 1: Environment & Dependencies Check"
echo "----------------------------------------------"
echo "## Phase 1: Environment & Dependencies Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    log_result "PASS" "Node.js installed" "Version: $NODE_VERSION"
else
    log_result "FAIL" "Node.js not installed" "Required for backend"
fi

# Check pnpm
if command_exists pnpm; then
    PNPM_VERSION=$(pnpm --version)
    log_result "PASS" "pnpm installed" "Version: $PNPM_VERSION"
else
    log_result "FAIL" "pnpm not installed" "Required package manager"
fi

# Check PostgreSQL client
if command_exists psql; then
    log_result "PASS" "PostgreSQL client installed"
else
    log_result "WARN" "PostgreSQL client not installed" "May need for database operations"
fi

# Check environment variables
if [ -f ".env" ] || [ -f "env.local" ]; then
    log_result "PASS" "Environment file exists"
    
    # Check critical env vars
    if grep -q "DATABASE_URL" .env 2>/dev/null || grep -q "DATABASE_URL" env.local 2>/dev/null; then
        log_result "PASS" "DATABASE_URL configured"
    else
        log_result "WARN" "DATABASE_URL not found" "Required for database connection"
    fi
    
    if grep -q "JWT_SECRET" .env 2>/dev/null || grep -q "JWT_SECRET" env.local 2>/dev/null; then
        log_result "PASS" "JWT_SECRET configured"
    else
        log_result "WARN" "JWT_SECRET not found" "Required for authentication"
    fi
else
    log_result "WARN" "No environment file found" "May need .env or env.local"
fi

echo ""
echo "📦 Phase 2: Build & Compilation Check"
echo "---------------------------------------"
echo "" >> "$REPORT_FILE"
echo "## Phase 2: Build & Compilation Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check if dependencies are installed
if [ -d "node_modules" ]; then
    log_result "PASS" "Dependencies installed"
else
    log_result "FAIL" "Dependencies not installed" "Run: pnpm install"
fi

# Test TypeScript compilation
echo "Testing TypeScript compilation..."
if pnpm run type-check > /tmp/typecheck.log 2>&1; then
    log_result "PASS" "TypeScript compilation successful"
else
    log_result "FAIL" "TypeScript compilation failed" "Check /tmp/typecheck.log for details"
fi

# Test frontend build
echo "Testing frontend build..."
if pnpm run build:frontend > /tmp/frontend-build.log 2>&1; then
    log_result "PASS" "Frontend build successful"
    if [ -d "dist" ]; then
        log_result "PASS" "Frontend dist directory created"
    else
        log_result "FAIL" "Frontend dist directory not found"
    fi
else
    log_result "FAIL" "Frontend build failed" "Check /tmp/frontend-build.log for details"
fi

# Test backend build
echo "Testing backend build..."
if pnpm run build:backend > /tmp/backend-build.log 2>&1; then
    log_result "PASS" "Backend build successful"
    if [ -d "dist/server" ]; then
        log_result "PASS" "Backend dist directory created"
    else
        log_result "WARN" "Backend dist directory not found" "May be normal for TypeScript projects"
    fi
else
    log_result "FAIL" "Backend build failed" "Check /tmp/backend-build.log for details"
fi

echo ""
echo "🧪 Phase 3: Test Suite Execution"
echo "----------------------------------"
echo "" >> "$REPORT_FILE"
echo "## Phase 3: Test Suite Execution" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check if Playwright tests exist
if [ -d "tests/e2e" ] && [ -n "$(ls -A tests/e2e/*.spec.ts 2>/dev/null)" ]; then
    log_result "PASS" "Playwright E2E tests found"
    
    # Count test files
    TEST_COUNT=$(find tests/e2e -name "*.spec.ts" | wc -l | tr -d ' ')
    log_result "PASS" "E2E test files" "Found $TEST_COUNT test files"
    
    # Note: We won't run tests here as server needs to be running
    log_result "WARN" "E2E tests not executed" "Run manually: pnpm run test:playwright"
else
    log_result "WARN" "No Playwright E2E tests found" "Consider adding E2E tests"
fi

# Check if unit tests exist
if [ -d "tests/unit" ] || [ -d "tests" ]; then
    if find tests -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | grep -q .; then
        UNIT_TEST_COUNT=$(find tests -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l | tr -d ' ')
        log_result "PASS" "Unit tests found" "Found $UNIT_TEST_COUNT test files"
    else
        log_result "WARN" "No unit tests found" "Consider adding unit tests"
    fi
else
    log_result "WARN" "No test directory found" "Consider adding tests"
fi

echo ""
echo "🗄️  Phase 4: Database & Backend Check"
echo "--------------------------------------"
echo "" >> "$REPORT_FILE"
echo "## Phase 4: Database & Backend Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check database schema files
if [ -d "database" ]; then
    SCHEMA_FILES=$(find database -name "*.sql" | wc -l | tr -d ' ')
    log_result "PASS" "Database schema files found" "Found $SCHEMA_FILES SQL files"
else
    log_result "WARN" "No database directory found"
fi

# Check migration files
if [ -d "database/migrations" ] || [ -d "migrations" ]; then
    MIGRATION_COUNT=$(find database/migrations migrations -name "*.sql" 2>/dev/null | wc -l | tr -d ' ')
    log_result "PASS" "Migration files found" "Found $MIGRATION_COUNT migration files"
else
    log_result "WARN" "No migration directory found"
fi

# Check backend routes
if [ -d "server/routes" ]; then
    ROUTE_COUNT=$(ls server/routes/*.ts 2>/dev/null | wc -l | tr -d ' ')
    log_result "PASS" "Backend routes found" "Found $ROUTE_COUNT route files"
    
    # List important routes
    echo "   **Route Files:**" >> "$REPORT_FILE"
    ls server/routes/*.ts 2>/dev/null | sed 's/^/   - /' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    log_result "FAIL" "No server/routes directory found"
fi

# Check server entry point
if [ -f "server/index.ts" ]; then
    log_result "PASS" "Server entry point exists"
else
    log_result "FAIL" "Server entry point not found" "server/index.ts required"
fi

echo ""
echo "🎨 Phase 5: Frontend Check"
echo "--------------------------"
echo "" >> "$REPORT_FILE"
echo "## Phase 5: Frontend Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check React app entry
if [ -f "index.tsx" ] || [ -f "src/index.tsx" ]; then
    log_result "PASS" "Frontend entry point exists"
else
    log_result "WARN" "Frontend entry point not found"
fi

# Check App component
if [ -f "App.tsx" ] || [ -f "src/App.tsx" ]; then
    log_result "PASS" "App component exists"
else
    log_result "FAIL" "App component not found"
fi

# Check pages directory
if [ -d "pages" ]; then
    PAGE_COUNT=$(ls pages/*.tsx 2>/dev/null | wc -l | tr -d ' ')
    log_result "PASS" "Page components found" "Found $PAGE_COUNT page files"
else
    log_result "WARN" "No pages directory found"
fi

# Check components directory
if [ -d "components" ]; then
    COMPONENT_COUNT=$(ls components/*.tsx 2>/dev/null | wc -l | tr -d ' ')
    log_result "PASS" "React components found" "Found $COMPONENT_COUNT component files"
else
    log_result "WARN" "No components directory found"
fi

echo ""
echo "📚 Phase 6: Documentation & Configuration"
echo "-----------------------------------------"
echo "" >> "$REPORT_FILE"
echo "## Phase 6: Documentation & Configuration" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check README
if [ -f "README.md" ]; then
    log_result "PASS" "README.md exists"
else
    log_result "WARN" "README.md not found"
fi

# Check deployment config
if [ -f "render.yaml" ]; then
    log_result "PASS" "Render deployment config exists"
else
    log_result "WARN" "render.yaml not found" "May not be deploying to Render"
fi

if [ -f "Dockerfile" ]; then
    log_result "PASS" "Dockerfile exists"
else
    log_result "WARN" "Dockerfile not found" "May not be using Docker"
fi

# Check package.json scripts
if [ -f "package.json" ]; then
    if grep -q "\"build\"" package.json; then
        log_result "PASS" "Build script configured"
    fi
    if grep -q "\"start\"" package.json; then
        log_result "PASS" "Start script configured"
    fi
fi

echo ""
echo "🔒 Phase 7: Security Check"
echo "---------------------------"
echo "" >> "$REPORT_FILE"
echo "## Phase 7: Security Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check for hardcoded secrets
if grep -r "password.*=.*['\"].*['\"]" server/ --include="*.ts" --include="*.js" 2>/dev/null | grep -v "password_hash" | grep -v "//" | grep -q .; then
    log_result "WARN" "Potential hardcoded passwords found" "Review server code"
else
    log_result "PASS" "No obvious hardcoded passwords"
fi

# Check for JWT secret default
if grep -r "your-super-secret-jwt-key" server/ --include="*.ts" --include="*.js" 2>/dev/null | grep -q .; then
    log_result "WARN" "Default JWT secret found" "Should be changed in production"
else
    log_result "PASS" "No default JWT secret found"
fi

# Check CORS configuration
if grep -r "cors" server/index.ts 2>/dev/null | grep -q .; then
    log_result "PASS" "CORS configured"
else
    log_result "WARN" "CORS not configured" "May cause issues in production"
fi

echo ""
echo "📊 Summary"
echo "=========="
echo "" >> "$REPORT_FILE"
echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Category | Status |" >> "$REPORT_FILE"
echo "|----------|--------|" >> "$REPORT_FILE"
echo "| ✅ Passed | $PASSED |" >> "$REPORT_FILE"
echo "| ❌ Failed | $FAILED |" >> "$REPORT_FILE"
echo "| ⚠️  Warnings | $WARNINGS |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

TOTAL=$((PASSED + FAILED + WARNINGS))
if [ $TOTAL -gt 0 ]; then
    PASS_PERCENT=$((PASSED * 100 / TOTAL))
    echo "**Pass Rate: $PASS_PERCENT%**" >> "$REPORT_FILE"
fi

echo ""
echo -e "${BLUE}=============================================================="
echo -e "Assessment Complete!"
echo -e "==============================================================${NC}"
echo ""
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""
echo "📄 Full report saved to: $REPORT_FILE"
echo ""

# Recommendations
echo "" >> "$REPORT_FILE"
echo "## Recommendations" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ $FAILED -gt 0 ]; then
    echo "### Critical Issues (Must Fix Before Deployment)" >> "$REPORT_FILE"
    echo "- Fix all failed checks above" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

if [ $WARNINGS -gt 5 ]; then
    echo "### Important Warnings" >> "$REPORT_FILE"
    echo "- Review and address warnings for better production readiness" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

echo "### Next Steps" >> "$REPORT_FILE"
echo "1. Review the full report: \`cat $REPORT_FILE\`" >> "$REPORT_FILE"
echo "2. Fix all critical failures" >> "$REPORT_FILE"
echo "3. Start backend server: \`pnpm run dev:backend\`" >> "$REPORT_FILE"
echo "4. Run E2E tests: \`pnpm run test:playwright\`" >> "$REPORT_FILE"
echo "5. Test API endpoints manually" >> "$REPORT_FILE"
echo "6. Review deployment checklist: \`DEPLOYMENT_CHECKLIST.md\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Exit with error if critical failures
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}❌ Critical failures detected. Please fix before deployment.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ No critical failures. Review warnings before deployment.${NC}"
    exit 0
fi

