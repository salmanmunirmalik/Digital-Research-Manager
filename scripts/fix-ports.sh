#!/bin/bash
# Free ports used by local Digital Research Manager (API, Vite, optional stats).

set -euo pipefail

echo "Checking ports 5002 (API), 5173 (Vite), 5003 (stats)..."

kill_port() {
  local port=$1
  local pids
  pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)

  if [[ -n "${pids}" ]]; then
    echo "Found listeners on port ${port}: ${pids}"
    # shellcheck disable=SC2086
    kill ${pids} 2>/dev/null || true
    sleep 1
    pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
    if [[ -n "${pids}" ]]; then
      # shellcheck disable=SC2086
      kill -9 ${pids} 2>/dev/null || true
    fi
    echo "Port ${port} is free"
  else
    echo "Port ${port} is free"
  fi
}

kill_port 5002
kill_port 5173
kill_port 5003
# Legacy mistaken port from older scripts
kill_port 5001

echo "Port cleanup complete."
echo "Start the app with: pnpm run dev:app"
echo "Ensure XAMPP MySQL is running (and Homebrew mysql is stopped) on 3306."
