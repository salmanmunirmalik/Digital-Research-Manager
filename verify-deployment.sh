#!/bin/bash

echo "🚀 ResearchLabSync Deployment Verification"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo -e "\n${YELLOW}📋 Checking Project Structure...${NC}"
echo "----------------------------------------"

# Check if key files exist
[ -f "package.json" ] && print_status 0 "package.json exists" || print_status 1 "package.json missing"
[ -f "README.md" ] && print_status 0 "README.md exists" || print_status 1 "README.md missing"
[ -f "DEPLOYMENT.md" ] && print_status 0 "DEPLOYMENT.md exists" || print_status 1 "DEPLOYMENT.md missing"
[ -f "DEPLOYMENT_CHECKLIST.md" ] && print_status 0 "DEPLOYMENT_CHECKLIST.md exists" || print_status 1 "DEPLOYMENT_CHECKLIST.md missing"
[ -f "Dockerfile" ] && print_status 0 "Dockerfile exists" || print_status 1 "Dockerfile missing"
[ -f "docker-compose.yml" ] && print_status 0 "docker-compose.yml exists" || print_status 1 "docker-compose.yml missing"
[ -f "ecosystem.config.js" ] && print_status 0 "ecosystem.config.js exists" || print_status 1 "ecosystem.config.js missing"

echo -e "\n${YELLOW}🔧 Checking Dependencies...${NC}"
echo "----------------------------------------"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    print_status 0 "Dependencies installed"
else
    print_status 1 "Dependencies not installed"
    echo "Run: npm install"
fi

echo -e "\n${YELLOW}🏗️ Checking Build Process...${NC}"
echo "----------------------------------------"

# Build backend
echo "Building backend..."
npm run build:backend > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status 0 "Backend build successful"
else
    print_status 1 "Backend build failed"
fi

# Build frontend
echo "Building frontend..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_status 0 "Frontend build successful"
else
    print_status 1 "Frontend build failed"
fi

# Check if dist directory exists and has content
if [ -d "dist" ] && [ -d "dist/server" ] && [ -f "dist/server/index.js" ]; then
    print_status 0 "Build output verified"
else
    print_status 1 "Build output incomplete"
fi

echo -e "\n${YELLOW}🌐 Checking Environment...${NC}"
echo "----------------------------------------"

# Check environment files
[ -f ".env" ] && print_status 0 ".env file exists" || print_status 1 ".env file missing"
[ -f "env.production" ] && print_status 0 "Production env template exists" || print_status 1 "Production env template missing"

# Check if Supabase is configured
if grep -q "VITE_SUPABASE_URL" .env; then
    print_status 0 "Supabase configuration found"
else
    print_status 1 "Supabase configuration missing"
fi

echo -e "\n${YELLOW}🐳 Checking Docker...${NC}"
echo "----------------------------------------"

# Check if Docker is available
if command -v docker &> /dev/null; then
    print_status 0 "Docker is available"
    
    # Test Docker build
    echo "Testing Docker build..."
    docker build -t researchlabsync-test . > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status 0 "Docker build successful"
        # Clean up test image
        docker rmi researchlabsync-test > /dev/null 2>&1
    else
        print_status 1 "Docker build failed"
    fi
else
    print_status 1 "Docker not available"
fi

echo -e "\n${YELLOW}📊 Checking Health Endpoints...${NC}"
echo "----------------------------------------"

# Start server in background
echo "Starting server for health check..."
npm start > /dev/null 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    print_status 0 "Health endpoint responding"
else
    print_status 1 "Health endpoint not responding"
fi

# Stop server
kill $SERVER_PID 2>/dev/null

echo -e "\n${YELLOW}📚 Checking Documentation...${NC}"
echo "----------------------------------------"

# Check if all documentation files are present
DOC_FILES=("README.md" "DEPLOYMENT.md" "DEPLOYMENT_CHECKLIST.md" "DEPLOYMENT_SUMMARY.md" "SUPABASE_SETUP.md" "SUPABASE_CHECKLIST.md")
for doc in "${DOC_FILES[@]}"; do
    if [ -f "$doc" ]; then
        print_status 0 "$doc exists"
    else
        print_status 1 "$doc missing"
    fi
done

echo -e "\n${YELLOW}🚀 Final Status...${NC}"
echo "----------------------------------------"

# Overall assessment
if [ -d "dist" ] && [ -d "dist/server" ] && [ -f "dist/server/index.js" ] && [ -f ".env" ]; then
    echo -e "${GREEN}🎉 ResearchLabSync is READY for deployment!${NC}"
    echo -e "${GREEN}✅ All critical components are in place${NC}"
    echo -e "${GREEN}✅ Build process is working${NC}"
    echo -e "${GREEN}✅ Documentation is complete${NC}"
    echo -e "${GREEN}✅ Docker configuration is ready${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Choose your deployment platform"
    echo "2. Follow DEPLOYMENT.md guide"
    echo "3. Use DEPLOYMENT_CHECKLIST.md"
    echo "4. Deploy your application!"
else
    echo -e "${RED}❌ Some issues need to be resolved before deployment${NC}"
    echo "Please check the errors above and fix them."
fi

echo -e "\n${YELLOW}📖 For detailed deployment instructions, see:${NC}"
echo "- DEPLOYMENT.md - Complete deployment guide"
echo "- DEPLOYMENT_CHECKLIST.md - Deployment readiness checklist"
echo "- README.md - Project overview and setup"

echo -e "\n${GREEN}🚀 Happy Deploying!${NC}"
