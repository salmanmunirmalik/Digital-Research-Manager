#!/bin/bash

# Create Deployment Zip File
# Excludes development files and includes only production-ready files

set -e

PROJECT_NAME="digital-research-manager"
DEPLOYMENT_DIR="deployment"
ZIP_NAME="${PROJECT_NAME}-deployment-$(date +%Y%m%d-%H%M%S).zip"

echo "📦 Creating deployment package..."

# Clean previous deployment directory
rm -rf "$DEPLOYMENT_DIR"
mkdir -p "$DEPLOYMENT_DIR"

# Copy essential files
echo "📋 Copying essential files..."

# Frontend build
if [ -d "dist" ]; then
  echo "  ✓ Copying frontend build (dist/)"
  cp -r dist "$DEPLOYMENT_DIR/"
else
  echo "  ⚠️ Warning: dist/ directory not found. Run 'pnpm run build:frontend' first."
fi

# Backend build
if [ -d "dist/server" ]; then
  echo "  ✓ Copying backend build (dist/server/)"
  mkdir -p "$DEPLOYMENT_DIR/server"
  cp -r dist/server "$DEPLOYMENT_DIR/"
else
  echo "  ⚠️ Warning: dist/server/ directory not found. Run 'pnpm run build:backend' first."
fi

# Database files
echo "  ✓ Copying database files"
mkdir -p "$DEPLOYMENT_DIR/database"
cp -r database/migrations "$DEPLOYMENT_DIR/database/" 2>/dev/null || true
cp database/config.ts "$DEPLOYMENT_DIR/database/" 2>/dev/null || true
cp database/consolidated_schema.sql "$DEPLOYMENT_DIR/database/" 2>/dev/null || true

# Package files
echo "  ✓ Copying package files"
cp package.json "$DEPLOYMENT_DIR/"
cp pnpm-lock.yaml "$DEPLOYMENT_DIR/" 2>/dev/null || cp package-lock.json "$DEPLOYMENT_DIR/" 2>/dev/null || true
cp pnpm-workspace.yaml "$DEPLOYMENT_DIR/" 2>/dev/null || true

# Configuration files
echo "  ✓ Copying configuration files"
cp .env.example "$DEPLOYMENT_DIR/" 2>/dev/null || true
cp tsconfig.json "$DEPLOYMENT_DIR/" 2>/dev/null || true
cp vite.config.ts "$DEPLOYMENT_DIR/" 2>/dev/null || true

# Documentation
echo "  ✓ Copying deployment documentation"
cp DEPLOYMENT_DIRECTADMIN.md "$DEPLOYMENT_DIR/" 2>/dev/null || true
cp DEPLOYMENT_READINESS_REPORT.md "$DEPLOYMENT_DIR/" 2>/dev/null || true
cp FINAL_DEPLOYMENT_SUMMARY.md "$DEPLOYMENT_DIR/" 2>/dev/null || true
cp README.md "$DEPLOYMENT_DIR/" 2>/dev/null || true

# Scripts
echo "  ✓ Copying deployment scripts"
mkdir -p "$DEPLOYMENT_DIR/scripts"
cp scripts/prepare-deployment.sh "$DEPLOYMENT_DIR/scripts/" 2>/dev/null || true
cp scripts/run-migration-with-password.sh "$DEPLOYMENT_DIR/scripts/" 2>/dev/null || true

# Create deployment instructions
cat > "$DEPLOYMENT_DIR/DEPLOYMENT_INSTRUCTIONS.md" << 'EOF'
# Deployment Instructions

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- pnpm installed (`npm install -g pnpm`)

## Steps

1. **Extract the zip file**
   ```bash
   unzip digital-research-manager-deployment-*.zip
   cd deployment
   ```

2. **Install dependencies**
   ```bash
   pnpm install --production
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and other settings
   ```

4. **Run database migrations**
   ```bash
   # Make sure PostgreSQL is running and database exists
   ./scripts/run-migration-with-password.sh
   ```

5. **Start the application**
   ```bash
   # For production
   NODE_ENV=production pnpm start:prod
   
   # Or use PM2
   pm2 start dist/server/server/index.js --name research-manager
   ```

6. **Set up reverse proxy (nginx/apache)**
   - Point to the frontend build in `dist/`
   - Proxy API requests to `http://localhost:5002`

## DirectAdmin Deployment

See `DEPLOYMENT_DIRECTADMIN.md` for detailed DirectAdmin-specific instructions.

## Health Check

After deployment, verify:
- Frontend: `http://your-domain.com`
- Backend API: `http://your-domain.com/api/health`
- Database: Check connection in `.env`

## Troubleshooting

- Check logs: `pm2 logs research-manager`
- Verify database connection
- Check port 5002 is not in use
- Verify all environment variables are set
EOF

# Create zip file
echo ""
echo "📦 Creating zip file..."
cd "$DEPLOYMENT_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store" "*.git*" > /dev/null
cd ..

# Clean up
rm -rf "$DEPLOYMENT_DIR"

echo ""
echo "✅ Deployment package created: $ZIP_NAME"
echo "📊 File size: $(du -h "$ZIP_NAME" | cut -f1)"
echo ""
echo "📋 Contents:"
echo "  - Frontend build (dist/)"
echo "  - Backend build (dist/server/)"
echo "  - Database migrations"
echo "  - Package files"
echo "  - Configuration files"
echo "  - Deployment documentation"
echo ""
echo "🚀 Ready for deployment!"

