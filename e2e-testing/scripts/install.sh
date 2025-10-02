#!/bin/bash

# E2E Testing Framework Installation Script
# This script sets up the complete E2E testing environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Installing Research Lab E2E Testing Framework${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node --version)${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js $(node --version) is installed${NC}"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ npm $(npm --version) is installed${NC}"
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        echo -e "${YELLOW}⚠️  PostgreSQL is not installed. Some tests may fail.${NC}"
    else
        echo -e "${GREEN}✅ PostgreSQL is available${NC}"
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ curl is available${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    
    # Install npm packages
    npm install
    
    # Install Puppeteer browser
    echo -e "${YELLOW}🌐 Installing Puppeteer browser...${NC}"
    npx puppeteer browsers install chrome
    
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
}

# Setup environment
setup_environment() {
    echo -e "${YELLOW}⚙️  Setting up environment...${NC}"
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}📝 Creating .env file...${NC}"
        cat > .env << EOF
# Environment
ENVIRONMENT=local

# Service URLs
BASE_URL=http://localhost:5173
BACKEND_URL=http://localhost:5002
STATS_SERVICE_URL=http://localhost:5003

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=researchlab
DB_USER=postgres
DB_PASSWORD=password

# Test User
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# Test Settings
HEADLESS=true
SLOW_MO=0
EOF
        echo -e "${GREEN}✅ .env file created${NC}"
    else
        echo -e "${BLUE}ℹ️  .env file already exists${NC}"
    fi
    
    # Create test-results directory
    mkdir -p test-results/screenshots
    mkdir -p test-results/coverage
    
    echo -e "${GREEN}✅ Environment setup completed${NC}"
}

# Verify installation
verify_installation() {
    echo -e "${YELLOW}🔍 Verifying installation...${NC}"
    
    # Check if all required files exist
    required_files=(
        "package.json"
        "jest.config.js"
        "tests/setup/test-config.ts"
        "scripts/run-all-tests.sh"
        "README.md"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ Required file missing: $file${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ All required files present${NC}"
    
    # Test Jest configuration
    if npx jest --version &> /dev/null; then
        echo -e "${GREEN}✅ Jest is working correctly${NC}"
    else
        echo -e "${RED}❌ Jest configuration issue${NC}"
        exit 1
    fi
    
    # Test Puppeteer
    if npx puppeteer --version &> /dev/null; then
        echo -e "${GREEN}✅ Puppeteer is working correctly${NC}"
    else
        echo -e "${RED}❌ Puppeteer configuration issue${NC}"
        exit 1
    fi
}

# Display usage information
show_usage() {
    echo ""
    echo -e "${BLUE}🎉 Installation completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "  1. Start your services: cd .. && pnpm run dev"
    echo "  2. Run tests: npm run test:all"
    echo "  3. View reports: open test-results/comprehensive-test-report.html"
    echo ""
    echo -e "${YELLOW}🚀 Quick Commands:${NC}"
    echo "  npm run test:api          # Run API tests"
    echo "  npm run test:crud         # Run CRUD tests"
    echo "  npm run test:ui           # Run UI tests"
    echo "  npm run test:integration  # Run integration tests"
    echo "  npm run test:all          # Run all tests"
    echo "  npm run test:report       # Run tests with reporting"
    echo ""
    echo -e "${YELLOW}📚 Documentation:${NC}"
    echo "  README.md                 # Complete documentation"
    echo "  scripts/                  # Test scripts and utilities"
    echo ""
    echo -e "${GREEN}✅ Ready to test!${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}🧪 Research Lab E2E Testing Framework${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
    
    check_prerequisites
    install_dependencies
    setup_environment
    verify_installation
    show_usage
}

# Run main function
main "$@"
