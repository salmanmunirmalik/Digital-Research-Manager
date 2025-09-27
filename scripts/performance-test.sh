#!/bin/bash

# Performance Testing Script for Digital Research Manager
# This script runs various performance tests using Artillery

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
  echo "Usage: $0 [load|stress|endurance|all] [options]"
  echo "  load: Run load test (normal traffic)"
  echo "  stress: Run stress test (high load)"
  echo "  endurance: Run endurance test (long running)"
  echo "  all: Run all performance tests"
  echo ""
  echo "Options:"
  echo "  --report: Generate HTML report"
  echo "  --output <file>: Save results to specific file"
  echo "  --duration <seconds>: Override test duration"
  echo "  --rate <rate>: Override arrival rate"
  exit 1
}

# Check if Artillery is installed
if ! command -v artillery &> /dev/null
then
    echo -e "${RED}Artillery is not installed. Please run 'pnpm add -D artillery' or 'npm install -g artillery'.${NC}"
    exit 1
fi

# Check if servers are running
check_servers() {
    echo -e "${BLUE}Checking if servers are running...${NC}"
    
    # Check frontend server
    if ! curl -s http://localhost:5173 > /dev/null; then
        echo -e "${RED}Frontend server (port 5173) is not running. Please start it first.${NC}"
        exit 1
    fi
    
    # Check backend server
    if ! curl -s http://localhost:5001 > /dev/null; then
        echo -e "${RED}Backend server (port 5001) is not running. Please start it first.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Both servers are running${NC}"
}

# Run load test
run_load_test() {
    echo -e "${YELLOW}🚀 Running Load Test...${NC}"
    artillery run tests/performance/load-test.yml
}

# Run stress test
run_stress_test() {
    echo -e "${YELLOW}🔥 Running Stress Test...${NC}"
    artillery run tests/performance/stress-test.yml
}

# Run endurance test
run_endurance_test() {
    echo -e "${YELLOW}⏱️ Running Endurance Test...${NC}"
    artillery run tests/performance/endurance-test.yml
}

# Run all tests
run_all_tests() {
    echo -e "${BLUE}🎯 Running All Performance Tests...${NC}"
    
    echo -e "${YELLOW}1. Load Test${NC}"
    run_load_test
    
    echo -e "${YELLOW}2. Stress Test${NC}"
    run_stress_test
    
    echo -e "${YELLOW}3. Endurance Test${NC}"
    run_endurance_test
    
    echo -e "${GREEN}✅ All performance tests completed${NC}"
}

# Main execution
main() {
    # Check servers first
    check_servers
    
    # Parse arguments
    case "$1" in
        load)
            run_load_test
            ;;
        stress)
            run_stress_test
            ;;
        endurance)
            run_endurance_test
            ;;
        all)
            run_all_tests
            ;;
        *)
            usage
            ;;
    esac
}

# Run main function
main "$@"
