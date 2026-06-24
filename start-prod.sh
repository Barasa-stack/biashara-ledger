#!/bin/bash
cd "$(dirname "$0")"
lsof -ti :3000 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1
npx next start -p 3000 &
PID=$!
echo $PID > /tmp/biashara-prod.pid
echo "Production server started (PID: $PID) at http://localhost:3000"
wait $PID
