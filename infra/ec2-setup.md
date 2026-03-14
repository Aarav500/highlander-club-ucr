# EC2 Server Setup Guide

## 1. Launch Instance

- **AMI:** Ubuntu 22.04 LTS (or Amazon Linux 2023)
- **Instance type:** t3.small (minimum for running both frontend + backend)
- **Storage:** 20 GB gp3
- **Security group:**
  - SSH (22) — your IP only
  - HTTP (80) — 0.0.0.0/0
  - HTTPS (443) — 0.0.0.0/0
  - Custom TCP (3000) — for Next.js dev (optional)
  - Custom TCP (4000) — for API dev (optional)

## 2. Initial Server Setup

```bash
# SSH in
ssh -i ~/.ssh/your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x (MUST match CI — see .github/workflows/deploy-ec2.yml)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # v20.x.x
npm -v   # 10.x.x

# Install PM2 globally
sudo npm install -g pm2

# Install git (usually pre-installed)
sudo apt install -y git
```

## 3. Clone Repository

```bash
sudo mkdir -p /var/www
sudo chown ubuntu:ubuntu /var/www
cd /var/www
git clone https://github.com/<your-org>/fullstack-template.git
cd fullstack-template

# Make deploy script executable (one-time)
chmod +x infra/deploy/deploy.sh
```

## 4. Environment Files

```bash
# Backend env
cp apps/api-node/.env.example apps/api-node/.env
nano apps/api-node/.env
# Fill in: DATABASE_URL, AWS creds, etc.

# Frontend env (if needed)
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>:4000
EOF
```

## 5. Install Dependencies & Build

```bash
# Root
npm install

# Frontend
cd apps/web && npm install && npm run build
cd ../..

# Backend
cd apps/api-node && npm install
cd ../..
```

## 6. Start with PM2

```bash
# Start API (port 4000)
cd apps/api-node
pm2 start src/index.js --name api

# Start Next.js in production mode (port 3000)
cd ../web
pm2 start npm --name web -- start

# Save PM2 list for auto-restart on reboot
pm2 save

# Setup PM2 startup script (run once)
pm2 startup
# Follow the printed command (copy/paste it)
```

> **Note:** Both `api` and `web` PM2 processes are restarted by `deploy.sh` on each deploy.

## 7. Reverse Proxy (Nginx)

```bash
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/fullstack << 'EOF'
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://127.0.0.1:4000;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/fullstack /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
```

## 8. Database (Postgres)

**Recommended:** Use AWS RDS for managed Postgres.

- Create an RDS PostgreSQL instance (db.t3.micro for dev)
- Set `DATABASE_URL` in `apps/api-node/.env` to the RDS connection string
- Ensure the EC2 security group can reach the RDS security group on port 5432

**Alternative:** Install locally on EC2:
```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createuser --interactive  # create your app user
sudo -u postgres createdb mydb
```

## 9. S3 for File Storage

- Create an S3 bucket in your AWS region
- Create an IAM user/role with S3 access
- Set `AWS_S3_BUCKET`, `AWS_REGION` in env
- Prefer IAM roles attached to EC2 over access keys

## 10. SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
# Follow prompts — auto-renew is configured by default
```

---

## 11. Docker-Based Deployment (Recommended)

Instead of PM2, you can use Docker Compose + GitHub Actions for a fully automated pipeline.

### One-Time Setup

```bash
# On a fresh EC2 Ubuntu 22.04 instance:
sudo bash infra/ec2-init.sh

# Edit credentials:
nano /var/www/app/.env

# Copy compose files from repo:
cd /var/www/app
curl -O https://raw.githubusercontent.com/Aarav500/Space/main/docker-compose.yml
curl -O https://raw.githubusercontent.com/Aarav500/Space/main/nginx.conf
```

### How Deploys Work

1. Push to `main` → GitHub Actions runs tests → builds Docker images → pushes to Docker Hub
2. Actions sends SSM command to EC2 → pulls images → `docker compose up -d`
3. Post-deploy health check + S3 sync runs automatically

See: `.github/workflows/deploy.yml`, `docker-compose.yml`, `nginx.conf`

