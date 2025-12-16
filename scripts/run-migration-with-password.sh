#!/bin/bash

# Migration Runner Script
# Prompts for database password and runs the migration

echo "🔄 Running User AI Content Migration..."
echo ""

# Read password securely
read -sp "Enter PostgreSQL password for user 'postgres': " DB_PASSWORD
echo ""

# Try to run migration
PGPASSWORD="$DB_PASSWORD" psql -h localhost -p 5432 -U postgres -d digital_research_manager \
  -f database/migrations/20250125_user_ai_content_fallback.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "Verifying tables were created..."
    PGPASSWORD="$DB_PASSWORD" psql -h localhost -p 5432 -U postgres -d digital_research_manager -c "
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('user_ai_content', 'user_content_relationships', 'provider_capabilities')
        ORDER BY table_name;
    "
    echo ""
    echo "Checking provider capabilities..."
    PGPASSWORD="$DB_PASSWORD" psql -h localhost -p 5432 -U postgres -d digital_research_manager -c "
        SELECT provider, provider_name FROM provider_capabilities ORDER BY provider;
    "
else
    echo ""
    echo "❌ Migration failed. Please check your password and database connection."
    exit 1
fi

