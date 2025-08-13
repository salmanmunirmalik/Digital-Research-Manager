#!/bin/bash

echo "🔧 Comprehensive App Fix Script"
echo "==============================="
echo ""

# Stop all processes
echo "🛑 Stopping all running processes..."
pkill -f "nodemon\|tsx\|node\|vite" 2>/dev/null
sleep 3

# Check if .env has Supabase credentials
echo "🔍 Checking .env file..."
if grep -q "YOUR_PROJECT_URL_HERE" .env || grep -q "YOUR_ANON_KEY_HERE" .env; then
    echo "⚠️  Your .env file still has placeholder values!"
    echo "   Please update it with your actual Supabase credentials:"
    echo ""
    echo "   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co"
    echo "   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    echo ""
    read -p "Press Enter after updating .env file..."
fi

# Verify .env is properly set
if grep -q "YOUR_PROJECT_URL_HERE" .env || grep -q "YOUR_ANON_KEY_HERE" .env; then
    echo "❌ .env file still has placeholder values. Please fix this first."
    exit 1
fi

echo "✅ .env file looks good!"

# Clear any cached files
echo "🧹 Clearing cached files..."
rm -rf node_modules/.vite 2>/dev/null
rm -rf dist 2>/dev/null

# Reinstall dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Setup database
echo "🗄️  Setting up database..."
npm run db:setup

if [ $? -eq 0 ]; then
    echo "✅ Database setup successful!"
else
    echo "❌ Database setup failed!"
    exit 1
fi

# Start backend
echo "🔧 Starting backend server..."
npm run dev:backend &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ Backend is running on http://localhost:5001"
else
    echo "❌ Backend failed to start!"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "📱 Starting frontend..."
npm run dev:frontend &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 8

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:5173"
else
    echo "❌ Frontend failed to start!"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 App should now be working!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:5001/api"
echo ""
echo "🔍 If you still see a blank page:"
echo "   1. Open browser developer tools (F12)"
echo "   2. Check the Console tab for errors"
echo "   3. Check the Network tab for failed requests"
echo ""
echo "Press Ctrl+C to stop all services..."

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ All services stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Keep script running
wait
