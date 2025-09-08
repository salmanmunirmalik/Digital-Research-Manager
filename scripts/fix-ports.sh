#!/bin/bash

# Port conflict resolution script
# This script kills processes using ports 5001 and 5173

echo "🔍 Checking for processes using ports 5001 and 5173..."

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "⚠️  Found processes using port $port: $pids"
        echo "🔄 Killing processes on port $port..."
        echo $pids | xargs kill -9 2>/dev/null
        sleep 2
        
        # Check if processes are still running
        local remaining_pids=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$remaining_pids" ]; then
            echo "⚠️  Some processes still running on port $port, force killing..."
            echo $remaining_pids | xargs kill -9 2>/dev/null
        fi
        
        echo "✅ Port $port is now free"
    else
        echo "✅ Port $port is free"
    fi
}

# Kill processes on both ports
kill_port 5001
kill_port 5173

# Also kill any node processes that might be hanging
echo "🔄 Cleaning up any hanging node processes..."
pkill -f "node.*server" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
pkill -f "vite" 2>/dev/null

echo "✅ Port cleanup complete!"
echo "🚀 You can now start the development server with: npm run dev"
