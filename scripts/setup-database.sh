#!/bin/bash

# Database setup and health check script
# This script sets up the MySQL database and checks its health

echo "🗄️  Setting up MySQL database..."

# Database configuration
DB_NAME="digital_research_manager"
DB_USER="${MYSQL_USER:-root}"
DB_HOST="${MYSQL_HOST:-localhost}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_PASSWORD="${MYSQL_PASSWORD:-}"

MYSQL_BASE_CMD=(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER")
if [ -n "$DB_PASSWORD" ]; then
  MYSQL_BASE_CMD+=(-p"$DB_PASSWORD")
fi

# Function to check if MySQL is running
check_mysql() {
    echo "🔍 Checking if MySQL is running..."
    if mysqladmin ping -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} >/dev/null 2>&1; then
        echo "✅ MySQL is running"
        return 0
    else
        echo "❌ MySQL is not running"
        echo "💡 Please start MySQL with: brew services start mysql"
        return 1
    fi
}

# Function to create database if it doesn't exist
create_database() {
    echo "🔍 Checking if database '$DB_NAME' exists..."
    "${MYSQL_BASE_CMD[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;"
    if [ $? -eq 0 ]; then
        echo "✅ Database '$DB_NAME' is ready"
    else
        echo "❌ Failed to create database '$DB_NAME'"
        return 1
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🔄 Running database migrations..."

    if [ -f "database/schema.sql" ]; then
        echo "📄 Applying schema.sql..."
        "${MYSQL_BASE_CMD[@]}" "$DB_NAME" < database/schema.sql
    else
        echo "⚠️  schema.sql not found, skipping schema application"
    fi

    if [ -f "database/seed-users.sql" ]; then
        echo "🌱 Seeding database with initial data..."
        "${MYSQL_BASE_CMD[@]}" "$DB_NAME" < database/seed-users.sql
    else
        echo "⚠️  seed-users.sql not found, skipping seeding"
    fi
}

# Function to test database connection
test_connection() {
    echo "🧪 Testing database connection..."

    if "${MYSQL_BASE_CMD[@]}" "$DB_NAME" -e "SELECT 1;" >/dev/null 2>&1; then
        echo "✅ Database connection successful"

        local table_count=$("${MYSQL_BASE_CMD[@]}" "$DB_NAME" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME';" 2>/dev/null | tr -d ' ')

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

    if ! check_mysql; then
        exit 1
    fi

    if ! create_database; then
        exit 1
    fi

    if ! run_migrations; then
        exit 1
    fi

    if ! test_connection; then
        exit 1
    fi

    echo "🎉 Database setup complete!"
    echo "💡 You can now start the application with: npm run dev"
}

# Run main function
main
