#!/usr/bin/env bash
# ============================================================
# UniPulse — EC2 Full Setup Script
# Supports: Amazon Linux 2, Amazon Linux 2023, Ubuntu 22.04+
#
# Usage (run once as root after launching EC2):
#   curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/YOUR_REPO/main/infra/ec2-setup.sh | sudo bash
#
# OR copy to EC2 and run:
#   sudo bash infra/ec2-setup.sh
# ============================================================
set -euo pipefail

APP_USER="ec2-user"          # Amazon Linux default; change to "ubuntu" for Ubuntu
APP_DIR="/home/${APP_USER}/unipulse"
NODE_VERSION="20"
REPO_URL="https://github.com/YOUR_ORG/YOUR_REPO.git"   # ← update this

echo "═══════════════════════════════════════════════════"
echo "  UniPulse — EC2 Setup"
echo "═══════════════════════════════════════════════════"

# ── Detect OS ────────────────────────────────────────────────
if [ -f /etc/os-release ]; then
  . /etc/os-release
  OS_ID=$ID
else
  OS_ID="unknown"
fi

IS_AMAZON=$(echo "$OS_ID" | grep -c "amzn" || true)
IS_UBUNTU=$(echo "$OS_ID" | grep -c "ubuntu" || true)

# ── 1. System update ─────────────────────────────────────────
echo "📦 Updating system packages..."
if [ "$IS_UBUNTU" -gt 0 ]; then
  apt-get update -y && apt-get upgrade -y
else
  yum update -y
fi

# ── 2. Install SSM Agent ─────────────────────────────────────
echo "📡 Installing & enabling SSM Agent..."
if [ "$IS_UBUNTU" -gt 0 ]; then
  # Ubuntu: snap is the recommended method
  snap install amazon-ssm-agent --classic 2>/dev/null || \
    apt-get install -y amazon-ssm-agent 2>/dev/null || true
  systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service 2>/dev/null || \
    systemctl enable amazon-ssm-agent 2>/dev/null || true
  systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service 2>/dev/null || \
    systemctl start amazon-ssm-agent 2>/dev/null || true
else
  # Amazon Linux: SSM Agent is pre-installed; ensure it's running
  yum install -y amazon-ssm-agent 2>/dev/null || true
  systemctl enable amazon-ssm-agent
  systemctl start amazon-ssm-agent
fi

SSM_STATUS=$(systemctl is-active amazon-ssm-agent 2>/dev/null \
  || systemctl is-active snap.amazon-ssm-agent.amazon-ssm-agent.service 2>/dev/null \
  || echo "unknown")
echo "✅ SSM Agent: $SSM_STATUS"

# ── 3. Install Git ───────────────────────────────────────────
echo "📂 Installing Git..."
if [ "$IS_UBUNTU" -gt 0 ]; then
  apt-get install -y git
else
  yum install -y git
fi
echo "✅ Git: $(git --version)"

# ── 4. Install Node.js 20 ────────────────────────────────────
echo "🟢 Installing Node.js ${NODE_VERSION}..."
if [ "$IS_UBUNTU" -gt 0 ]; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
else
  curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | bash -
  yum install -y nodejs
fi
echo "✅ Node: $(node --version) | npm: $(npm --version)"

# ── 5. Install PM2 ───────────────────────────────────────────
echo "⚙️  Installing PM2..."
npm install -g pm2
echo "✅ PM2: $(pm2 --version)"

# ── 6. Install AWS CLI v2 (for S3 / SSM interaction) ────────
if ! command -v aws &>/dev/null; then
  echo "☁️  Installing AWS CLI v2..."
  if [ "$IS_UBUNTU" -gt 0 ]; then
    apt-get install -y unzip
  else
    yum install -y unzip
  fi
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
    -o /tmp/awscliv2.zip
  unzip -qo /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install --update
  rm -rf /tmp/aws /tmp/awscliv2.zip
  echo "✅ AWS CLI: $(aws --version)"
else
  echo "✅ AWS CLI already installed"
fi

# ── 7. Create ubuntu user alias if needed ───────────────────
if [ "$IS_UBUNTU" -gt 0 ]; then
  APP_USER="ubuntu"
fi

# ── 8. Clone repository ──────────────────────────────────────
echo "📥 Cloning UniPulse repository..."
if [ -d "$APP_DIR/.git" ]; then
  echo "  Repo already exists — pulling latest..."
  sudo -u "$APP_USER" git -C "$APP_DIR" pull origin main
else
  sudo -u "$APP_USER" git clone "$REPO_URL" "$APP_DIR"
fi
echo "✅ Repo at $APP_DIR"

# ── 9. Create .env file ──────────────────────────────────────
ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "📝 Creating .env template — FILL IN YOUR VALUES..."
  cat > "$ENV_FILE" << 'ENVEOF'
# ── Core ─────────────────────────────────────────────────────
NODE_ENV=production
PORT=3001

# ── Database ─────────────────────────────────────────────────
DATABASE_URL=CHANGE_ME

# ── Auth ─────────────────────────────────────────────────────
JWT_SECRET=CHANGE_ME

# ── URLs (set to your EC2 public IP or domain) ───────────────
API_BASE_URL=http://CHANGE_ME:3001
APP_URL=http://CHANGE_ME:3001
ALLOWED_ORIGINS=*

# ── AWS S3 (for image uploads) ───────────────────────────────
AWS_ACCESS_KEY_ID=CHANGE_ME
AWS_SECRET_ACCESS_KEY=CHANGE_ME
AWS_REGION=us-east-1
AWS_S3_BUCKET=unipulse-media

# ── Email (for verification code login) ──────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=CHANGE_ME
SMTP_PASS=CHANGE_ME
SMTP_FROM="UniPulse" <noreply@unipulse.app>

# ── UCR CAS SSO ──────────────────────────────────────────────
CAS_BASE_URL=https://cas.ucr.edu/cas
ENVEOF
  chown "$APP_USER:$APP_USER" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "⚠️  IMPORTANT: Edit $ENV_FILE with your real credentials before continuing!"
else
  echo "✅ .env already exists — skipping"
fi

# ── 10. Install API dependencies ─────────────────────────────
echo "📦 Installing API dependencies..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR/apps/api-node && npm ci --omit=dev"
echo "✅ Dependencies installed"

# ── 11. Run database migrations ──────────────────────────────
echo "🗄️  Running database migrations..."
sudo -u "$APP_USER" bash -c "cd $APP_DIR/apps/api-node && node src/db/migrate.js" || \
  echo "⚠️  Migration failed — check DATABASE_URL in .env"

# ── 12. Start API with PM2 ───────────────────────────────────
echo "🚀 Starting UniPulse API with PM2..."
sudo -u "$APP_USER" bash -c "
  cd $APP_DIR
  pm2 delete unipulse-api 2>/dev/null || true
  pm2 start apps/api-node/src/index.js \
    --name unipulse-api \
    --env production \
    --max-memory-restart 512M \
    --log /home/${APP_USER}/.pm2/logs/unipulse-api.log \
    --time
  pm2 save
"

# ── 13. Configure PM2 to start on system boot ────────────────
echo "⚙️  Configuring PM2 startup..."
PM2_STARTUP=$(sudo -u "$APP_USER" pm2 startup systemd -u "$APP_USER" \
  --hp "/home/$APP_USER" 2>&1 | grep "sudo env" || true)

if [ -n "$PM2_STARTUP" ]; then
  eval "$PM2_STARTUP"
  echo "✅ PM2 startup configured"
else
  # Fallback: create a systemd service manually
  cat > /etc/systemd/system/unipulse-api.service << SVCEOF
[Unit]
Description=UniPulse API
After=network.target

[Service]
Type=forking
User=$APP_USER
WorkingDirectory=$APP_DIR/apps/api-node
ExecStart=/usr/bin/pm2 start src/index.js --name unipulse-api --env production
ExecReload=/usr/bin/pm2 reload unipulse-api
ExecStop=/usr/bin/pm2 stop unipulse-api
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
SVCEOF
  systemctl daemon-reload
  systemctl enable unipulse-api
  echo "✅ Systemd service created"
fi

# ── 14. Configure log rotation ───────────────────────────────
echo "📊 Setting up log rotation..."
cat > /etc/logrotate.d/unipulse << 'LOGEOF'
/home/ec2-user/.pm2/logs/*.log {
  daily
  rotate 7
  compress
  missingok
  notifempty
  copytruncate
}
LOGEOF
echo "✅ Log rotation configured"

# ── 15. Open port 3001 (if firewalld is active) ──────────────
if command -v firewall-cmd &>/dev/null && systemctl is-active --quiet firewalld; then
  echo "🔓 Opening port 3001 in firewalld..."
  firewall-cmd --permanent --add-port=3001/tcp
  firewall-cmd --reload
  echo "✅ Port 3001 open"
fi

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "  ✅ UniPulse EC2 Setup Complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  📋 Checklist:"
echo "  1. Edit .env:        nano $ENV_FILE"
echo "  2. Restart API:      pm2 restart unipulse-api"
echo "  3. Check logs:       pm2 logs unipulse-api"
echo "  4. Health check:     curl http://localhost:3001/health"
echo ""
echo "  ☁️  AWS console checklist:"
echo "  - Attach IAM role with AmazonSSMManagedInstanceCore policy"
echo "  - Security group: inbound port 3001 open (or 80/443 behind ALB)"
echo "  - SSM Agent status: $(systemctl is-active amazon-ssm-agent 2>/dev/null || echo 'check manually')"
echo ""
