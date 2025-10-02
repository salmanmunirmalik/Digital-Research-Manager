#!/bin/bash

# Start Statistical Analysis Service
# This script starts the Python FastAPI service for statistical analysis

echo "🚀 Starting Statistical Analysis Service..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ to continue."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "stats_service/main.py" ]; then
    echo "❌ stats_service/main.py not found. Please run this script from the project root."
    exit 1
fi

# Navigate to stats_service directory
cd stats_service

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Start the service
echo "🎯 Starting FastAPI service on port 8001..."
python run_stats_service.py

# If the script exits, deactivate the virtual environment
deactivate
