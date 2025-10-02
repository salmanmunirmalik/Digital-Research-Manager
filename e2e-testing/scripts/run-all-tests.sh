#!/bin/bash

# Comprehensive E2E Testing Script for Research Lab Platform
# This script runs all tests across different environments and generates reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-local}
REPORT_DIR="./test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$REPORT_DIR/test-run-$TIMESTAMP.log"

# Create report directory
mkdir -p "$REPORT_DIR"
mkdir -p "$REPORT_DIR/screenshots"
mkdir -p "$REPORT_DIR/coverage"

echo -e "${BLUE}🧪 Starting Comprehensive E2E Testing${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Timestamp: $TIMESTAMP${NC}"
echo -e "${BLUE}Report Directory: $REPORT_DIR${NC}"
echo ""

# Function to run tests with error handling
run_test_suite() {
    local suite_name=$1
    local test_command=$2
    local config_file=$3
    
    echo -e "${YELLOW}🔄 Running $suite_name tests...${NC}"
    
    if [ -n "$config_file" ]; then
        TEST_COMMAND="$test_command --config=$config_file"
    else
        TEST_COMMAND="$test_command"
    fi
    
    if $TEST_COMMAND 2>&1 | tee -a "$LOG_FILE"; then
        echo -e "${GREEN}✅ $suite_name tests completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ $suite_name tests failed${NC}"
        return 1
    fi
}

# Function to check service health
check_service() {
    local service_name=$1
    local service_url=$2
    local max_attempts=30
    
    echo -e "${YELLOW}🔍 Checking $service_name at $service_url...${NC}"
    
    for i in $(seq 1 $max_attempts); do
        if curl -s "$service_url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready${NC}"
            return 0
        fi
        
        if [ $i -eq $max_attempts ]; then
            echo -e "${RED}❌ $service_name is not responding after $max_attempts attempts${NC}"
            return 1
        fi
        
        echo -e "${YELLOW}⏳ Waiting for $service_name... ($i/$max_attempts)${NC}"
        sleep 2
    done
}

# Function to start services if needed
start_services() {
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    
    # Check if services are already running
    if check_service "Frontend" "http://localhost:5173" && \
       check_service "Backend" "http://localhost:5002/health" && \
       check_service "Stats Service" "http://localhost:5003/health"; then
        echo -e "${GREEN}✅ All services are already running${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}🔄 Starting services in background...${NC}"
    
    # Start services in background
    cd ..
    pnpm run dev > "$REPORT_DIR/services.log" 2>&1 &
    SERVICES_PID=$!
    cd e2e-testing
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 10
    
    # Check services again
    if check_service "Frontend" "http://localhost:5173" && \
       check_service "Backend" "http://localhost:5002/health" && \
       check_service "Stats Service" "http://localhost:5003/health"; then
        echo -e "${GREEN}✅ All services started successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to start services${NC}"
        return 1
    fi
}

# Function to cleanup
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    
    if [ -n "$SERVICES_PID" ]; then
        kill $SERVICES_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes
    pkill -f "pnpm run dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "uvicorn" 2>/dev/null || true
}

# Set trap for cleanup
trap cleanup EXIT

# Main execution
main() {
    # Initialize
    echo -e "${BLUE}📋 Test Configuration:${NC}"
    echo "  Environment: $ENVIRONMENT"
    echo "  Report Directory: $REPORT_DIR"
    echo "  Log File: $LOG_FILE"
    echo ""
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        npm install
    fi
    
    # Start services
    if ! start_services; then
        echo -e "${RED}❌ Failed to start services. Exiting.${NC}"
        exit 1
    fi
    
    # Run test suites
    echo -e "${BLUE}🧪 Running Test Suites${NC}"
    echo ""
    
    local failed_suites=()
    
    # API Tests
    if ! run_test_suite "API" "npm run test:api" "jest.config.api.js"; then
        failed_suites+=("API")
    fi
    
    # CRUD Tests
    if ! run_test_suite "CRUD" "npm run test:crud" "jest.config.crud.js"; then
        failed_suites+=("CRUD")
    fi
    
    # UI Tests
    if ! run_test_suite "UI" "npm run test:ui" "jest.config.ui.js"; then
        failed_suites+=("UI")
    fi
    
    # Integration Tests
    if ! run_test_suite "Integration" "npm run test:integration" "jest.config.integration.js"; then
        failed_suites+=("Integration")
    fi
    
    # Generate comprehensive report
    echo -e "${YELLOW}📊 Generating comprehensive test report...${NC}"
    node scripts/generate-test-report.js "$REPORT_DIR" "$TIMESTAMP"
    
    # Summary
    echo ""
    echo -e "${BLUE}📋 Test Summary${NC}"
    echo "  Timestamp: $TIMESTAMP"
    echo "  Environment: $ENVIRONMENT"
    echo "  Report Directory: $REPORT_DIR"
    
    if [ ${#failed_suites[@]} -eq 0 ]; then
        echo -e "  Status: ${GREEN}✅ ALL TESTS PASSED${NC}"
        echo -e "  Failed Suites: ${GREEN}None${NC}"
        exit 0
    else
        echo -e "  Status: ${RED}❌ SOME TESTS FAILED${NC}"
        echo -e "  Failed Suites: ${RED}${failed_suites[*]}${NC}"
        echo ""
        echo -e "${YELLOW}📄 Check the following files for details:${NC}"
        echo "  - Log File: $LOG_FILE"
        echo "  - HTML Reports: $REPORT_DIR/*/test-report.html"
        echo "  - Screenshots: $REPORT_DIR/screenshots/"
        exit 1
    fi
}

# Run main function
main "$@"