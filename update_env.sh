#!/bin/bash
# Update .env file with database credentials

ENV_FILE=".env"
DB_USER="msalman"
DB_PASSWORD="Salman@123pak1"
DB_NAME="researchlab_db"
DB_HOST="localhost"
DB_PORT="5432"

# URL encode the password (replace @ with %40)
ENCODED_PASSWORD=$(echo "$DB_PASSWORD" | sed 's/@/%40/g')

# Create DATABASE_URL
DATABASE_URL="postgres://${DB_USER}:${ENCODED_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "Updating .env file..."
echo "DATABASE_URL will be: postgres://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating new .env file..."
    touch "$ENV_FILE"
fi

# Backup .env
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

# Remove old DATABASE_URL line if exists
sed -i.bak '/^DATABASE_URL=/d' "$ENV_FILE" 2>/dev/null || sed -i '' '/^DATABASE_URL=/d' "$ENV_FILE" 2>/dev/null

# Add new DATABASE_URL at the end
echo "" >> "$ENV_FILE"
echo "# Database Configuration" >> "$ENV_FILE"
echo "DATABASE_URL=$DATABASE_URL" >> "$ENV_FILE"

echo "✅ .env file updated successfully!"
echo ""
echo "You can now test the connection with:"
echo "psql \"$DATABASE_URL\" -c \"SELECT 1;\""
