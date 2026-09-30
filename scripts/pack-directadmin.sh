#!/usr/bin/env bash
# Build + package Digital Research Manager for DirectAdmin upload.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DOMAIN_API_URL="${VITE_API_URL:-/api}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="directadmin-package"
ZIP_NAME="digital-research-manager-directadmin-${STAMP}.zip"

echo "▶ DirectAdmin package"
echo "  VITE_API_URL=${DOMAIN_API_URL}"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "▶ Installing dependencies (if needed)…"
if [ ! -d node_modules ]; then
  pnpm install --frozen-lockfile || pnpm install
fi

echo "▶ Building frontend + backend…"
export NODE_ENV=production
export VITE_API_URL="$DOMAIN_API_URL"
# Backend first, then SPA into dist/client (avoids Vite scanning dist/server)
pnpm run build:backend
pnpm run build:frontend

if [ ! -f dist/client/index.html ]; then
  echo "✗ dist/client/index.html missing after frontend build" >&2
  exit 1
fi
if [ ! -f dist/server/server/index.js ]; then
  echo "✗ dist/server/server/index.js missing after backend build" >&2
  exit 1
fi

echo "▶ Assembling package…"
cp deploy/directadmin/app.js "$OUT_DIR/app.js"
cp package.json "$OUT_DIR/"
cp pnpm-lock.yaml "$OUT_DIR/" 2>/dev/null || true
cp ecosystem.config.cjs "$OUT_DIR/"
cp env.directadmin.example "$OUT_DIR/"
cp DEPLOYMENT_DIRECTADMIN.md "$OUT_DIR/"
cp -R dist "$OUT_DIR/"
mkdir -p "$OUT_DIR/database"
cp -R database/migrations "$OUT_DIR/database/" 2>/dev/null || true
cp database/config.ts "$OUT_DIR/database/" 2>/dev/null || true
mkdir -p "$OUT_DIR/deploy/directadmin"
cp deploy/directadmin/htaccess.apache-static-spa "$OUT_DIR/deploy/directadmin/" 2>/dev/null || true
cp deploy/directadmin/app.js "$OUT_DIR/deploy/directadmin/" 2>/dev/null || true

# Production install hint
cat > "$OUT_DIR/INSTALL.txt" << EOF
DirectAdmin quick install
========================
1. Extract this zip into your Node.js Application root.
2. Copy env.directadmin.example → .env and edit secrets + MySQL.
3. pnpm install --prod   (or: npm install --omit=dev)
4. In DirectAdmin Node.js App: startup file = app.js, mode = Production.
5. Restart the app. Open https://YOUR-DOMAIN/api/health

Built with VITE_API_URL=${DOMAIN_API_URL}
EOF

echo "▶ Creating ${ZIP_NAME}…"
(
  cd "$OUT_DIR"
  zip -r "../${ZIP_NAME}" . -x "*.DS_Store" >/dev/null
)

SIZE="$(du -h "$ZIP_NAME" | awk '{print $1}')"
echo "✅ Ready: ${ZIP_NAME} (${SIZE})"
echo "   Folder kept at: ${OUT_DIR}/ (optional; zip is enough to upload)"
echo ""
echo "Upload tip: set VITE_API_URL=https://your-domain.com/api before packing:"
echo "  VITE_API_URL=https://your-domain.com/api pnpm run pack:directadmin"
