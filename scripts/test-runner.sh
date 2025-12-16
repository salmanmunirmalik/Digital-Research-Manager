#!/bin/bash

# Digital Research Manager - Comprehensive Test Runner
# This script runs all types of tests and generates reports

set -e

echo "🧪 Digital Research Manager - Test Suite Runner"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if servers are running
check_servers() {
    print_status "Checking if servers are running..."
    
    # Check frontend server
    if curl -s http://localhost:5173 > /dev/null; then
        print_success "Frontend server is running on port 5173"
    else
        print_warning "Frontend server not running on port 5173"
        print_status "Starting frontend server..."
        npm run dev:frontend &
        FRONTEND_PID=$!
        sleep 5
    fi
    
    # Check backend server
    if curl -s http://localhost:5001/api/health > /dev/null; then
        print_success "Backend server is running on port 5001"
    else
        print_warning "Backend server not running on port 5001"
        print_status "Starting backend server..."
        npm run dev:backend &
        BACKEND_PID=$!
        sleep 5
    fi
}

# Run Playwright tests
run_playwright_tests() {
    print_status "Running Playwright E2E tests..."
    
    if npx playwright test; then
        print_success "Playwright tests passed!"
    else
        print_error "Playwright tests failed!"
        return 1
    fi
}

# Run Playwright tests with UI
run_playwright_ui() {
    print_status "Running Playwright tests with UI..."
    npx playwright test --ui
}

# Run Playwright tests in headed mode
run_playwright_headed() {
    print_status "Running Playwright tests in headed mode..."
    npx playwright test --headed
}

# Run Playwright tests in debug mode
run_playwright_debug() {
    print_status "Running Playwright tests in debug mode..."
    npx playwright test --debug
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    # Create reports directory
    mkdir -p test-reports
    
    # Generate HTML report
    npx playwright show-report --host 0.0.0.0 --port 9323 &
    REPORT_PID=$!
    
    print_success "Test report available at: http://localhost:9323"
    print_status "Press Ctrl+C to stop the report server"
    
    # Wait for user to stop
    wait $REPORT_PID
}

# Run specific test suite
run_specific_tests() {
    local test_type=$1
    
    case $test_type in
        "auth")
            print_status "Running authentication tests..."
            npx playwright test --grep "Authentication"
            ;;
        "lab-notebook")
            print_status "Running Personal NoteBook tests..."
            npx playwright test --grep "Personal NoteBook"
            ;;
        "protocols")
            print_status "Running professional protocols tests..."
            npx playwright test --grep "Professional Protocols"
            ;;
        "api")
            print_status "Running API tests..."
            npx playwright test --grep "API Endpoints"
            ;;
        "responsive")
            print_status "Running responsive design tests..."
            npx playwright test --grep "Responsive Design"
            ;;
        *)
            print_error "Unknown test type: $test_type"
            print_status "Available test types: auth, lab-notebook, protocols, api, responsive"
            ;;
    esac
}

# Run tests on specific browsers
run_browser_tests() {
    local browser=$1
    
    case $browser in
        "chrome")
            print_status "Running tests on Chrome..."
            npx playwright test --project=chromium
            ;;
        "firefox")
            print_status "Running tests on Firefox..."
            npx playwright test --project=firefox
            ;;
        "safari")
            print_status "Running tests on Safari..."
            npx playwright test --project=webkit
            ;;
        "mobile")
            print_status "Running tests on mobile browsers..."
            npx playwright test --project="Mobile Chrome" --project="Mobile Safari"
            ;;
        *)
            print_error "Unknown browser: $browser"
            print_status "Available browsers: chrome, firefox, safari, mobile"
            ;;
    esac
}

# Performance testing
run_performance_tests() {
    print_status "Running performance tests..."
    
    # Check if Artillery is installed
    if ! command -v artillery &> /dev/null; then
        print_warning "Artillery not installed. Installing..."
        npm install -g artillery
    fi
    
    # Run load tests
    if [ -f "tests/performance/load-test.yml" ]; then
        artillery run tests/performance/load-test.yml
    else
        print_warning "Performance test file not found. Creating basic load test..."
        mkdir -p tests/performance
        
        cat > tests/performance/load-test.yml << EOF
config:
  target: 'http://localhost:5173'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "Load Test"
    weight: 100
    flow:
      - get:
          url: "/"
      - post:
          url: "/api/auth/login"
          json:
            email: "researcher@researchlab.com"
            password: "researcher123"
EOF
        
        artillery run tests/performance/load-test.yml
    fi
}

# Security testing
run_security_tests() {
    print_status "Running security tests..."
    
    # Check if OWASP ZAP is available
    if command -v zap-cli &> /dev/null; then
        print_status "Running OWASP ZAP security scan..."
        zap-cli quick-scan http://localhost:5173
    else
        print_warning "OWASP ZAP not installed. Running basic security checks..."
        
        # Basic security checks
        print_status "Checking for common security issues..."
        
        # Check for HTTPS redirect
        curl -I http://localhost:5173 | grep -i "strict-transport-security" || print_warning "HSTS header not found"
        
        # Check for CORS headers
        curl -I http://localhost:5001/api/health | grep -i "access-control-allow-origin" || print_warning "CORS headers not configured"
        
        # Check for security headers
        curl -I http://localhost:5173 | grep -i "x-frame-options" || print_warning "X-Frame-Options header not found"
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Kill background processes
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$REPORT_PID" ]; then
        kill $REPORT_PID 2>/dev/null || true
    fi
    
    print_success "Cleanup completed!"
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Main execution
main() {
    case $1 in
        "playwright")
            check_servers
            run_playwright_tests
            ;;
        "ui")
            check_servers
            run_playwright_ui
            ;;
        "headed")
            check_servers
            run_playwright_headed
            ;;
        "debug")
            check_servers
            run_playwright_debug
            ;;
        "report")
            generate_report
            ;;
        "specific")
            check_servers
            run_specific_tests $2
            ;;
        "browser")
            check_servers
            run_browser_tests $2
            ;;
        "performance")
            check_servers
            run_performance_tests
            ;;
        "security")
            check_servers
            run_security_tests
            ;;
        "all")
            print_status "Running comprehensive test suite..."
            check_servers
            run_playwright_tests
            run_performance_tests
            run_security_tests
            generate_report
            ;;
        *)
            echo "Usage: $0 [command] [options]"
            echo ""
            echo "Commands:"
            echo "  playwright     Run Playwright E2E tests"
            echo "  ui             Run Playwright tests with UI"
            echo "  headed         Run Playwright tests in headed mode"
            echo "  debug          Run Playwright tests in debug mode"
            echo "  report         Generate and show test report"
            echo "  specific [type] Run specific test suite (auth, lab-notebook, protocols, api, responsive)"
            echo "  browser [name] Run tests on specific browser (chrome, firefox, safari, mobile)"
            echo "  performance    Run performance tests"
            echo "  security       Run security tests"
            echo "  all            Run comprehensive test suite"
            echo ""
            echo "Examples:"
            echo "  $0 playwright"
            echo "  $0 specific auth"
            echo "  $0 browser chrome"
            echo "  $0 all"
            ;;
    esac
}

# Run main function with all arguments
main "$@"
