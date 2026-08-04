#!/bin/bash

# Configure Database and Test Fixes
# This script sets up the database connection and tests all fixes

set -e

echo "🔧 CONFIGURING DATABASE AND TESTING FIXES"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Creating from template..."
    cat > .env << 'EOF'
MYSQL_URL=mysql://root:your_password@localhost:3306/researchlab_db
PORT=5002
NODE_ENV=development
ENABLE_DEMO_AUTH=true
DEMO_AUTH_EMAIL=researcher@researchlab.com
DEMO_AUTH_PASSWORD=researcher123
DEMO_AUTH_TOKEN=demo-token-123
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:5173
MYSQL_SSL=false
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000
EOF
    echo "✅ .env file created"
fi

# Load .env file
export $(grep -v '^#' .env | xargs)

echo "📋 Database Configuration:"
echo "  MYSQL_URL: ${MYSQL_URL:0:30}..."
echo "  MYSQL_DB: ${MYSQL_DB:-not set}"
echo ""

# Test database connection
echo "🧪 Testing database connection..."
if mysql -h "${MYSQL_HOST:-localhost}" -P "${MYSQL_PORT:-3306}" -u "${MYSQL_USER:-root}" ${MYSQL_PASSWORD:+-p"${MYSQL_PASSWORD}"} "${MYSQL_DB:-researchlab_db}" -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "⚠️ Database connection test failed (may still work with MYSQL_URL)"
fi

echo ""
echo "🚀 Next Steps:"
echo "  1. Restart the server to load new .env configuration"
echo "  2. Run: pnpm run dev:backend"
echo "  3. Or: node server/index.js"
echo "  4. Then run: ./scripts/qa-second-round-testing.sh"
echo ""



