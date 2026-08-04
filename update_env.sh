#!/bin/bash
# Update .env file with database credentials

ENV_FILE=".env"
DB_USER="msalman"
DB_PASSWORD="Salman@123pak1"
DB_NAME="researchlab_db"
DB_HOST="localhost"
DB_PORT="3306"

# URL encode the password (replace @ with %40)
ENCODED_PASSWORD=$(echo "$DB_PASSWORD" | sed 's/@/%40/g')

# Create MYSQL_URL
MYSQL_URL="mysql://${DB_USER}:${ENCODED_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "Updating .env file..."
echo "MYSQL_URL will be: mysql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating new .env file..."
    touch "$ENV_FILE"
fi

# Backup .env
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Remove old MYSQL_URL line if exists
sed -i.bak '/^MYSQL_URL=/d' "$ENV_FILE" 2>/dev/null || sed -i '' '/^MYSQL_URL=/d' "$ENV_FILE" 2>/dev/null

# Add new MYSQL_URL at the end
echo "" >> "$ENV_FILE"
echo "# Database Configuration" >> "$ENV_FILE"
echo "MYSQL_URL=$MYSQL_URL" >> "$ENV_FILE"

echo "✅ .env file updated successfully!"
echo ""
echo "You can now test the connection with:"
echo "mysql \"$MYSQL_URL\" -e \"SELECT 1;\""
