#!/bin/bash

# Migration Runner Script
# Prompts for database password and runs the migration

echo "🔄 Running MySQL Migration..."
echo ""

# Read password securely
read -sp "Enter MySQL password for user 'root': " DB_PASSWORD
echo ""

# Try to run migration
mysql -h localhost -P 3306 -u root -p"$DB_PASSWORD" digital_research_manager \
  < database/migrations/mysql_migration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Verifying tables were created..."
    mysql -h localhost -P 3306 -u root -p"$DB_PASSWORD" digital_research_manager -e "
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'digital_research_manager';
    "
else
    echo ""
    echo "❌ Migration failed. Please check your password and database connection."
    exit 1
fi

