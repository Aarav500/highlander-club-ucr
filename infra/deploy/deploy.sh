#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────────────────────────
# deploy.sh — Pull latest code, build, and restart services via PM2
# Called by GitHub Actions (or manually via SSH)
#
# Process management pattern: SERVER-RENDERED
#   - API:  PM2 runs `node src/index.js`       (port 4000)
#   - Web:  PM2 runs `npm start` (next start)  (port 3000)
#   - Nginx reverse-proxies both (see ec2-setup.md)
#
# Prerequisites on EC2:
#   - Node 20 installed (must match CI)
#   - PM2 installed globally
#   - chmod +x on this file (run once: chmod +x infra/deploy/deploy.sh)
# ─────────────────────────────────────────────────────────────────────

APP_DIR="${APP_DIR:-/var/www/fullstack-template}"

echo "──────────────────────────────────────"
echo "  Deploying fullstack-template"
echo "  Directory: $APP_DIR"
echo "──────────────────────────────────────"

# 1. Pull latest code
echo "→ Fetching latest code..."
cd "$APP_DIR"
git fetch origin main
git reset --hard origin/main

# 2. Install root dependencies
echo "→ Installing root dependencies..."
npm install --production

# 3. Build frontend
echo "→ Building frontend..."
cd "$APP_DIR/apps/web"
npm install
npm run build

# 4. Install backend dependencies
echo "→ Installing backend dependencies..."
cd "$APP_DIR/apps/api-node"
npm install --production

# 5. Restart API with PM2
echo "→ Restarting API via PM2..."
pm2 restart api 2>/dev/null || pm2 start src/index.js --name api

# 6. Restart Next.js with PM2 (server-rendered via `next start`)
echo "→ Restarting Next.js via PM2..."
cd "$APP_DIR/apps/web"
pm2 restart web 2>/dev/null || pm2 start npm --name web -- start

# 7. Save PM2 process list for auto-restart on reboot
pm2 save

echo ""
echo "✅ Deployment complete!"
echo "   API:  http://localhost:4000 (PM2: api)"
echo "   Web:  http://localhost:3000 (PM2: web)"
echo "──────────────────────────────────────"
