#!/bin/bash

# Check if backend is already running on port 5001
if lsof -iTCP:5001 -sTCP:LISTEN > /dev/null 2>&1; then
    echo "Backend already running on port 5001"
else
    echo "Starting backend on port 5001..."
    cd backend
    npm run dev &
    echo "Backend started in background"
    
    # Wait a moment and verify it's running
    sleep 2
    if lsof -iTCP:5001 -sTCP:LISTEN > /dev/null 2>&1; then
        echo "✓ Backend is now running on http://localhost:5001"
    else
        echo "✗ Failed to start backend"
    fi
fi



