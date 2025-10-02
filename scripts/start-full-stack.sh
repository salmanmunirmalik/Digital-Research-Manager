#!/bin/bash

# Start Full Stack Application
# This script starts both the Node.js backend and Python statistical service

echo "🚀 Starting Full Stack Research Lab Application..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down services..."
    if [ ! -z "$NODE_PID" ]; then
        kill $NODE_PID 2>/dev/null
    fi
    if [ ! -z "$PYTHON_PID" ]; then
        kill $PYTHON_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root."
    exit 1
fi

# Start Python Statistical Service in background
echo "🐍 Starting Python Statistical Analysis Service..."
if [ -f "scripts/start-stats-service.sh" ]; then
    ./scripts/start-stats-service.sh &
    PYTHON_PID=$!
    echo "Python service PID: $PYTHON_PID"
else
    echo "⚠️  Python stats service script not found. Starting without it."
fi

# Wait a moment for Python service to start
sleep 3

# Start Node.js backend
echo "🟢 Starting Node.js Backend..."
if command -v pnpm &> /dev/null; then
    pnpm run dev:backend &
    NODE_PID=$!
elif command -v npm &> /dev/null; then
    npm run dev:backend &
    NODE_PID=$!
else
    echo "❌ Neither pnpm nor npm found. Please install one of them."
    exit 1
fi

echo "Node.js backend PID: $NODE_PID"

# Wait a moment for backend to start
sleep 3

# Start Frontend
echo "⚛️  Starting React Frontend..."
if command -v pnpm &> /dev/null; then
    pnpm run dev:frontend
elif command -v npm &> /dev/null; then
    npm run dev:frontend
fi

# Wait for user to stop
wait
