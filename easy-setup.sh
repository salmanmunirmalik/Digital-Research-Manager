#!/bin/bash

echo "🚀 ResearchLabSync Easy Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env-template.txt .env
    echo "✅ .env file created!"
    echo ""
    echo "🔑 Now you need to edit .env with your Supabase credentials:"
    echo "   1. Open .env in any text editor"
    echo "   2. Replace YOUR_PROJECT_URL_HERE with your Supabase Project URL"
    echo "   3. Replace YOUR_ANON_KEY_HERE with your Supabase anon key"
    echo ""
    echo "📋 To get these credentials:"
    echo "   1. Go to https://supabase.com"
    echo "   2. Create a new project called 'researchlab'"
    echo "   3. Go to Settings → API"
    echo "   4. Copy Project URL and anon public key"
    echo ""
    read -p "Press Enter when you've updated .env file..."
else
    echo "✅ .env file already exists!"
fi

# Check if Supabase credentials are set
if grep -q "YOUR_PROJECT_URL_HERE" .env || grep -q "YOUR_ANON_KEY_HERE" .env; then
    echo ""
    echo "⚠️  Please update your .env file with actual Supabase credentials first!"
    echo "   Run this script again after updating .env"
    exit 1
fi

echo ""
echo "🔧 Setting up database..."
npm run db:setup

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete! Starting the application..."
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
    exit 1
fi
