#!/bin/bash

echo "🚀 Starting ResearchLabSync Fullstack Application..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please review and edit if needed."
fi

# Check if database exists, if not run setup
if [ ! -f "./data/researchlab.db" ]; then
    echo "🗄️ Setting up database..."
    npm run db:setup
    if [ $? -eq 0 ]; then
        echo "✅ Database setup completed successfully!"
    else
        echo "❌ Database setup failed. Please check the logs."
        exit 1
    fi
else
    echo "✅ Database already exists."
fi

# Start the backend server
echo "🔧 Starting backend server on port 5001..."
npm run dev:backend &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ Backend server is running on http://localhost:5001"
else
    echo "❌ Backend server failed to start. Please check the logs."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start the frontend
echo "📱 Starting frontend on port 5173..."
npm run dev:frontend &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

# Check if frontend is running
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running on http://localhost:5173"
else
    echo "❌ Frontend failed to start. Please check the logs."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 ResearchLabSync is now running!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:5001/api"
echo "📚 Health Check: http://localhost:5001/api/health"
echo ""
echo "🔐 Default Login:"
echo "   Username: admin"
echo "   Password: admin123"
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
