#!/bin/bash
# BiasharaLedger Desktop Launcher
# Requires: Node.js 18+ and npm dependencies installed
# Usage: ./start-desktop.sh

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Check if production server is already running on port 3000
if ! curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
  echo "Starting production server..."
  npm start > /tmp/biashara-server.log 2>&1 &
  SERVER_PID=$!
  echo "Waiting for server... (this may take 10-15 seconds)"
  for i in $(seq 1 30); do
    if curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
      echo "Server ready!"
      break
    fi
    sleep 1
  done
fi

echo "Launching BiasharaLedger Desktop..."
npx electron electron/desktop.cjs

# Kill server if we started it
if [ -n "$SERVER_PID" ]; then
  kill $SERVER_PID 2>/dev/null
fi
