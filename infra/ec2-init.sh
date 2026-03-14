#!/usr/bin/env bash
# ============================================================
# EC2 Instance Init Script — One-Time Setup
# Run: sudo bash infra/ec2-init.sh
#
# Tested on: Ubuntu 22.04 LTS (t3.small, us-east-1)
# ============================================================
set -euo pipefail

echo "═══════════════════════════════════════════════════════"
echo "  OrbitShield — EC2 Init Script"
echo "═══════════════════════════════════════════════════════"

# ── 1. System updates ────────────────────────────────────────
echo "📦 Updating system packages..."
apt-get update -y
apt-get upgrade -y

# ── 2. Install Docker ────────────────────────────────────────
echo "🐳 Installing Docker..."
apt-get install -y ca-certificates curl gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group (no sudo needed for docker)
usermod -aG docker ubuntu

echo "✅ Docker $(docker --version | awk '{print $3}') installed"

# ── 3. Install AWS CLI v2 ────────────────────────────────────
if ! command -v aws &> /dev/null; then
  echo "☁️ Installing AWS CLI v2..."
  apt-get install -y unzip
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \
    -o /tmp/awscliv2.zip
  unzip -qo /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install --update
  rm -rf /tmp/aws /tmp/awscliv2.zip
  echo "✅ AWS CLI $(aws --version | awk '{print $1}') installed"
else
  echo "✅ AWS CLI already installed: $(aws --version | awk '{print $1}')"
fi

# ── 4. Install / Verify SSM Agent ────────────────────────────
echo "📡 Ensuring SSM Agent is running..."
if ! systemctl is-active --quiet amazon-ssm-agent 2>/dev/null; then
  snap install amazon-ssm-agent --classic 2>/dev/null || \
    apt-get install -y amazon-ssm-agent 2>/dev/null || true
fi
systemctl enable amazon-ssm-agent 2>/dev/null || true
systemctl start amazon-ssm-agent 2>/dev/null || true
echo "✅ SSM Agent status: $(systemctl is-active amazon-ssm-agent 2>/dev/null || echo 'check manually')"

# ── 5. Create app directory ──────────────────────────────────
echo "📁 Setting up /var/www/app..."
mkdir -p /var/www/app/data
chown -R ubuntu:ubuntu /var/www/app

# ── 6. Create .env template ─────────────────────────────────
ENV_FILE="/var/www/app/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "📝 Creating .env template..."
  cat > "$ENV_FILE" << 'ENVEOF'
# ── Docker / Deployment ──────────────────────────────────────
GHCR_OWNER=aarav500
TAG=latest

# ── Database (Railway Postgres) ──────────────────────────────
DATABASE_URL=CHANGE_ME

# ── API Secrets ──────────────────────────────────────────────
JWT_SECRET=CHANGE_ME
JWT_EXPIRES_IN=1h
CORS_ORIGIN=*

# ── Space-Track Credentials ─────────────────────────────────
SPACE_TRACK_USERNAME=CHANGE_ME
SPACE_TRACK_PASSWORD=CHANGE_ME

# ── NOAA Space Weather ───────────────────────────────────────
NOAA_SWPC_BASE_URL=https://services.swpc.noaa.gov

# ── CelesTrak ────────────────────────────────────────────────
CELESTRAK_BASE_URL=https://celestrak.org

# ── AWS ──────────────────────────────────────────────────────
AWS_REGION=us-east-1
AWS_S3_BUCKET=spaceinsurance

# ── Stripe (optional) ───────────────────────────────────────
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_COVERAGE_PRICE_ID=
ENVEOF
  chown ubuntu:ubuntu "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "⚠️  IMPORTANT: Edit $ENV_FILE with your real values!"
else
  echo "✅ .env already exists, skipping"
fi

# ── 7. Copy docker-compose + nginx config ────────────────────
echo "📋 Deploying compose files..."
cat > /var/www/app/docker-compose.yml << 'COMPOSEEOF'
# This file is deployed by ec2-init.sh and updated by CI/CD.
# The canonical version lives in the repo at docker-compose.yml.
# On first deploy, GitHub Actions SSM will pull images and start services.
COMPOSEEOF
chown ubuntu:ubuntu /var/www/app/docker-compose.yml

# ── 8. Configure Docker log rotation ────────────────────────
echo "📊 Configuring Docker log rotation..."
cat > /etc/docker/daemon.json << 'DOCKEREOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
DOCKEREOF
systemctl restart docker

# ── 9. Setup auto-cleanup cron ───────────────────────────────
echo "🗑️ Adding weekly Docker cleanup cron..."
cat > /etc/cron.weekly/docker-cleanup << 'CRONEOF'
#!/bin/bash
docker system prune -af --volumes --filter "until=168h" 2>/dev/null
CRONEOF
chmod +x /etc/cron.weekly/docker-cleanup

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✅ EC2 Init Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo "  1. Edit /var/www/app/.env with your real credentials"
echo "  2. Clone your repo's docker-compose.yml + nginx.conf:"
echo "     cd /var/www/app"
echo "     curl -O https://raw.githubusercontent.com/Aarav500/Space/main/docker-compose.yml"
echo "     curl -O https://raw.githubusercontent.com/Aarav500/Space/main/nginx.conf"
echo "  3. Push to main branch — GitHub Actions will deploy!"
echo ""
