#!/bin/bash

echo "🔧 Fixing Blank Page Issue..."
echo "=============================="
echo ""

# Stop any running processes
echo "🛑 Stopping any running processes..."
pkill -f "nodemon\|tsx\|node\|vite" 2>/dev/null
sleep 2

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env-template.txt .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: You need to update .env with your Supabase credentials!"
    echo "   Run: node setup-supabase.js"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Check if Supabase credentials are set
if grep -q "YOUR_PROJECT_URL_HERE" .env || grep -q "YOUR_ANON_KEY_HERE" .env; then
    echo ""
    echo "⚠️  Please update your .env file with actual Supabase credentials first!"
    echo "   Run: node setup-supabase.js"
    echo ""
    read -p "Press Enter after updating .env file..."
fi

echo ""
echo "🔧 Setting up database..."
npm run db:setup

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup successful!"
    echo ""
    echo "🚀 Starting the application..."
    echo ""
    echo "📱 Frontend will open at: http://localhost:5173"
    echo "🔧 Backend API at: http://localhost:5001/api"
    echo ""
    echo "Press Ctrl+C to stop the application"
    echo ""
    
    # Start the application
    ./start.sh
else
    echo ""
    echo "❌ Database setup failed. Please check the error messages above."
    echo ""
    echo "🔍 Common solutions:"
    echo "   1. Make sure your .env file has correct Supabase credentials"
    echo "   2. Check if you've set up your Supabase database"
    echo "   3. Run: node setup-database.js for database setup help"
    exit 1
fi
