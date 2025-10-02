#!/bin/bash

# Advanced Statistical Analysis Service Startup Script
# This script starts the advanced Python statistical analysis service

echo "🚀 Starting Advanced Statistical Analysis Service..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ to continue."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "stats_service/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd stats_service
    python3 -m venv venv
    cd ..
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source stats_service/venv/bin/activate

# Install/upgrade dependencies
echo "📥 Installing dependencies..."
cd stats_service
pip install --upgrade pip
pip install -r requirements.txt
cd ..

# Start the advanced statistical analysis service
echo "🎯 Starting Advanced Statistical Analysis Service on port 5003..."
cd stats_service
python advanced_main.py
cd ..

echo "✅ Advanced Statistical Analysis Service started successfully!"
echo "🌐 Service available at: http://localhost:5003"
echo "📚 API Documentation: http://localhost:5003/docs"
echo "🔍 Health Check: http://localhost:5003/health"
