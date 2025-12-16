#!/bin/bash

# Deployment Preparation Script
# Prepares the application for DirectAdmin deployment

set -e

echo "🚀 Preparing application for deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
pnpm install --frozen-lockfile

echo -e "${YELLOW}Step 2: Building frontend...${NC}"
pnpm run build:frontend

echo -e "${YELLOW}Step 3: Building backend...${NC}"
pnpm run build:backend

echo -e "${YELLOW}Step 4: Type checking...${NC}"
pnpm run type-check || echo -e "${YELLOW}Warning: Type check failed, but continuing...${NC}"

echo -e "${YELLOW}Step 5: Linting...${NC}"
pnpm run lint:check || echo -e "${YELLOW}Warning: Lint check failed, but continuing...${NC}"

echo -e "${YELLOW}Step 6: Checking for required files...${NC}"

# Check for required files
REQUIRED_FILES=(
    "dist/index.html"
    "server/index.js"
    ".env.example"
    "database/migrations/20250127_safety_systems.sql"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}Error: Missing required files:${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo -e "${RED}  - $file${NC}"
    done
    exit 1
fi

echo -e "${GREEN}✓ All required files present${NC}"

echo -e "${YELLOW}Step 7: Creating deployment checklist...${NC}"

cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# Deployment Checklist

## Pre-Deployment
- [ ] All migrations run successfully
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Build completed without errors
- [ ] All tests passed (if applicable)

## DirectAdmin Setup
- [ ] Node.js application created
- [ ] Environment variables set in DirectAdmin
- [ ] Database created and configured
- [ ] Migrations run on production database
- [ ] Reverse proxy configured (if needed)
- [ ] SSL certificate installed
- [ ] File permissions set correctly

## Post-Deployment
- [ ] Health check endpoint responds
- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] Database queries work
- [ ] API endpoints respond
- [ ] AI features work (with API keys)
- [ ] Error logging works
- [ ] Audit logging works

## Security
- [ ] HTTPS enabled
- [ ] .env file secured
- [ ] JWT secret is strong
- [ ] CORS configured correctly
- [ ] Database credentials secure
- [ ] API keys stored securely

## Monitoring
- [ ] Application logs accessible
- [ ] Database monitoring enabled
- [ ] Error alerts configured
- [ ] Performance monitoring set up
EOF

echo -e "${GREEN}✓ Deployment checklist created${NC}"

echo -e "${YELLOW}Step 8: Creating .env.example if it doesn't exist...${NC}"
if [ ! -f ".env.example" ]; then
    cat > .env.example << 'ENVEOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digital_research_manager
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Server Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret_change_this_in_production

# Frontend Configuration
VITE_API_URL=https://yourdomain.com/api

# AI Provider API Keys (Optional - users can add their own)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GEMINI_API_KEY=
PERPLEXITY_API_KEY=

# DirectAdmin Node.js App Port (if different)
NODE_APP_PORT=3000
ENVEOF
    echo -e "${GREEN}✓ .env.example created${NC}"
fi

echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review DEPLOYMENT_CHECKLIST.md"
echo "2. Follow DEPLOYMENT_DIRECTADMIN.md guide"
echo "3. Upload files to DirectAdmin"
echo "4. Configure environment variables"
echo "5. Run database migrations"
echo "6. Start the application"

