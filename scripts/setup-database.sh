#!/bin/bash

# Database setup and health check script
# This script sets up the PostgreSQL database and checks its health

echo "🗄️  Setting up PostgreSQL database..."

# Database configuration
DB_NAME="digital_research_manager"
DB_USER="m.salmanmalik"
DB_HOST="localhost"
DB_PORT="5432"

# Function to check if PostgreSQL is running
check_postgres() {
    echo "🔍 Checking if PostgreSQL is running..."
    if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER >/dev/null 2>&1; then
        echo "✅ PostgreSQL is running"
        return 0
    else
        echo "❌ PostgreSQL is not running"
        echo "💡 Please start PostgreSQL with: brew services start postgresql"
        return 1
    fi
}

# Function to create database if it doesn't exist
create_database() {
    echo "🔍 Checking if database '$DB_NAME' exists..."
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
        echo "✅ Database '$DB_NAME' already exists"
    else
        echo "🔄 Creating database '$DB_NAME'..."
        createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        if [ $? -eq 0 ]; then
            echo "✅ Database '$DB_NAME' created successfully"
        else
            echo "❌ Failed to create database '$DB_NAME'"
            return 1
        fi
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."
    
    # Check if schema.sql exists
    if [ -f "database/schema.sql" ]; then
        echo "📄 Applying schema.sql..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/schema.sql
        if [ $? -eq 0 ]; then
            echo "✅ Schema applied successfully"
        else
            echo "❌ Failed to apply schema"
            return 1
        fi
    else
        echo "⚠️  schema.sql not found, skipping schema application"
    fi
    
    # Check if seed data exists
    if [ -f "database/seed-users.sql" ]; then
        echo "🌱 Seeding database with initial data..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/seed-users.sql
        if [ $? -eq 0 ]; then
            echo "✅ Database seeded successfully"
        else
            echo "❌ Failed to seed database"
            return 1
        fi
    else
        echo "⚠️  seed-users.sql not found, skipping seeding"
    fi
}

# Function to test database connection
test_connection() {
    echo "🧪 Testing database connection..."
    
    # Test basic connection
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Database connection successful"
        
        # Test if tables exist
        local table_count=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
        
        if [ "$table_count" -gt 0 ]; then
            echo "✅ Database has $table_count tables"
        else
            echo "⚠️  Database has no tables"
        fi
        
        return 0
    else
        echo "❌ Database connection failed"
        return 1
    fi
}

# Main execution
main() {
    echo "🚀 Starting database setup..."
    
    # Check if PostgreSQL is running
    if ! check_postgres; then
        exit 1
    fi
    
    # Create database if needed
    if ! create_database; then
        exit 1
    fi
    
    # Run migrations
    if ! run_migrations; then
        exit 1
    fi
    
    # Test connection
    if ! test_connection; then
        exit 1
    fi
    
    echo "🎉 Database setup complete!"
    echo "💡 You can now start the application with: npm run dev"
}

# Run main function
main
