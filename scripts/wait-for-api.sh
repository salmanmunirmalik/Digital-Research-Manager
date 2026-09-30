#!/bin/bash
# Wait until Express API health responds (default http://127.0.0.1:5002/api/health).

set -euo pipefail

URL="${1:-http://127.0.0.1:5002/api/health}"
TRIES="${2:-60}"

echo "Waiting for API: ${URL}"

for i in $(seq 1 "${TRIES}"); do
  if curl -sf "$URL" >/dev/null 2>&1; then
    echo "API is up."
    exit 0
  fi
  sleep 0.5
done

echo "API did not become ready at ${URL}"
echo "Check: XAMPP MySQL on 3306, then pnpm run dev:backend"
exit 1
