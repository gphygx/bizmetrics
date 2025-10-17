# BizMetrics - Docker Deployment Guide

Deploy BizMetrics using Docker in under 5 minutes. Works on any server with Docker installed - no complex configuration needed!

## Why Docker?

✅ **Simple** - Just 3 commands to deploy  
✅ **Portable** - Works on any cloud (AWS, DigitalOcean, Hostinger, etc.)  
✅ **Consistent** - Same environment everywhere  
✅ **Isolated** - No conflicts with other apps  
✅ **Auto-restart** - Automatically restarts on crashes  

---

## Prerequisites

### 1. Server with Docker
- **Any VPS** (Hostinger, DigitalOcean, AWS EC2, etc.)
- **Docker & Docker Compose installed**
- **1GB RAM minimum** (2GB recommended)

### 2. Your Database
- **Neon PostgreSQL** account: https://console.neon.tech
- Connection string ready

---

## Quick Start (3 Steps)

### Step 1: Install Docker (If Not Installed)

**On Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Logout and login again**, then verify:
```bash
docker --version
docker compose version
```

---

### Step 2: Prepare Your Server

**Clone or upload your BizMetrics code:**

```bash
# Option A: Clone from Git
git clone https://github.com/your-username/bizmetrics.git
cd bizmetrics

# Option B: Upload files via SFTP to ~/bizmetrics/
```

**Create `.env` file:**

```bash
nano .env
```

Add your configuration:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@host.neon.tech/database?sslmode=require

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-long-random-secret-here

# These are already set in docker-compose.yml but you can override
NODE_ENV=production
PORT=3000
```

Save: `Ctrl+X`, then `Y`, then `Enter`

**Generate SESSION_SECRET:**
```bash
openssl rand -base64 32
```

---

### Step 3: Deploy with Docker Compose

**Build the Docker image:**

```bash
docker compose build
```

**Run database migration (first time only):**

```bash
# Run migration in a temporary container
docker compose run --rm bizmetrics npm run db:push
```

If you see warnings about data loss:
```bash
docker compose run --rm bizmetrics npm run db:push --force
```

Expected output:
```
✓ Pushing schema changes to database
✓ Tables created successfully
```

**Start the application:**

```bash
docker compose up -d
```

That's it! Your app is now running! 🎉

**Check status:**
```bash
docker compose ps
```

**View logs:**
```bash
docker compose logs -f
```

---

## Access Your Application

### Without Domain (Direct IP):
```
http://your-vps-ip:3000
```

### With Domain + Nginx:

**Install Nginx:**
```bash
sudo apt update
sudo apt install nginx -y
```

**Create Nginx config:**
```bash
sudo nano /etc/nginx/sites-available/bizmetrics
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable and restart:**
```bash
sudo ln -s /etc/nginx/sites-available/bizmetrics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Add SSL (HTTPS):**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Now access: `https://yourdomain.com` 🔒

---

## Docker Commands Reference

### Managing Your App

```bash
# Start app
docker compose up -d

# Stop app
docker compose down

# Restart app
docker compose restart

# View logs
docker compose logs -f

# View logs (last 100 lines)
docker compose logs --tail=100

# Check status
docker compose ps

# View resource usage
docker stats bizmetrics-app
```

### Updating Your App

**When you make changes:**

```bash
# Pull latest code (if using Git)
git pull origin main

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d
```

**If database schema changed:**
```bash
docker compose run --rm bizmetrics npm run db:push
docker compose restart
```

### Troubleshooting

```bash
# View container logs
docker compose logs bizmetrics

# Execute commands inside container
docker compose exec bizmetrics sh

# Check app health
docker compose exec bizmetrics wget -qO- http://localhost:3000/health

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Environment Variables

Your `.env` file supports these variables:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | Neon PostgreSQL URL | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `SESSION_SECRET` | ✅ Yes | Random secret (20+ chars) | Generate with: `openssl rand -base64 32` |
| `NODE_ENV` | No | Environment type | `production` (default) |
| `PORT` | No | Internal port | `3000` (default) |

---

## Production Setup Checklist

✅ **Before going live:**

- [ ] Set strong `SESSION_SECRET` (use `openssl rand -base64 32`)
- [ ] Verify `DATABASE_URL` works (test with `docker compose run --rm bizmetrics npm run db:push`)
- [ ] Configure domain DNS A record to point to VPS IP
- [ ] Set up Nginx reverse proxy
- [ ] Enable SSL certificate with Certbot
- [ ] Test application loads at `https://yourdomain.com`
- [ ] Test health endpoint: `https://yourdomain.com/health`
- [ ] Configure firewall (allow ports 80, 443, 22)
- [ ] Set up monitoring (optional: UptimeRobot, Sentry)

---

## Firewall Configuration

**Allow necessary ports:**

```bash
# Install UFW (if not installed)
sudo apt install ufw -y

# Configure firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Check status
sudo ufw status
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker compose logs bizmetrics
```

**Common issues:**
- Missing `.env` file → Create it with DATABASE_URL and SESSION_SECRET
- Invalid DATABASE_URL → Verify Neon connection string
- Port 3000 in use → Stop other apps: `sudo lsof -i :3000`

**Rebuild:**
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database Connection Failed

**Test connection:**
```bash
docker compose run --rm bizmetrics npm run db:push
```

**Fix:**
- Ensure DATABASE_URL ends with `?sslmode=require`
- Check Neon database is active (not paused)
- Whitelist your VPS IP in Neon (or allow all: `0.0.0.0/0`)

### 502 Bad Gateway (Nginx)

**Check Docker app:**
```bash
docker compose ps  # Should show "Up" status
docker compose logs bizmetrics
```

**Restart:**
```bash
docker compose restart
sudo systemctl reload nginx
```

### App Crashes on Startup

**View error logs:**
```bash
docker compose logs --tail=100 bizmetrics
```

**Common fixes:**
- Missing environment variables
- Database migration not run (run `npm run db:push`)
- Invalid code changes (revert with `git reset --hard`)

---

## Advanced: Docker with Local PostgreSQL

If you want to run PostgreSQL in Docker instead of Neon:

**Update `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: bizmetrics-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: bizmetrics
      POSTGRES_USER: bizmetrics
      POSTGRES_PASSWORD: change-this-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # BizMetrics App
  bizmetrics:
    build: .
    container_name: bizmetrics-app
    restart: unless-stopped
    depends_on:
      - postgres
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://bizmetrics:change-this-password@postgres:5432/bizmetrics
      SESSION_SECRET: ${SESSION_SECRET}
      NODE_ENV: production
      PORT: 3000

volumes:
  postgres_data:
```

**Then deploy:**
```bash
docker compose up -d
docker compose exec bizmetrics npm run db:push
```

---

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail=100

# Logs from last hour
docker compose logs --since 1h
```

### Resource Monitoring

```bash
# Container stats
docker stats bizmetrics-app

# Disk usage
docker system df

# Clean up unused images
docker system prune -a
```

### Application Health

```bash
# Health check
curl http://localhost:3000/health

# Or from inside container
docker compose exec bizmetrics wget -qO- http://localhost:3000/health
```

---

## Backup & Restore

### Backup PostgreSQL (Neon)

Neon provides automatic backups. Configure in Neon dashboard.

### Export Container Data

```bash
# Backup logs
docker compose logs > bizmetrics-logs-$(date +%Y%m%d).txt

# Export environment
docker compose config > docker-compose-backup.yml
```

---

## Cost Estimate

| Item | Cost | Notes |
|------|------|-------|
| VPS (1GB RAM) | $4-6/mo | DigitalOcean, Hostinger, Linode |
| VPS (2GB RAM) | $7-12/mo | Recommended for production |
| Neon PostgreSQL | Free | 3GB storage, 512MB RAM |
| Domain | ~$10/yr | Optional |
| SSL Certificate | Free | Let's Encrypt |
| **Total** | **$5-12/mo** | Fully production-ready |

---

## Deployment Platforms

Docker works on all major platforms:

- **DigitalOcean Droplets** - $6/mo for 1GB
- **Hostinger VPS** - $4.99/mo for KVM 1
- **AWS EC2** - t2.micro (free tier eligible)
- **Google Cloud Run** - Serverless, pay per use
- **Railway** - Easy deployment, generous free tier
- **Render** - Free tier available
- **Fly.io** - Global edge deployment

---

## Quick Comparison: Docker vs Traditional

| Feature | Docker | Traditional (CloudPanel/PM2) |
|---------|--------|------------------------------|
| **Setup Time** | 5 minutes | 15-30 minutes |
| **Commands** | 3 commands | 10+ commands |
| **Portability** | Works anywhere | Platform-specific |
| **Isolation** | Full isolation | Shared environment |
| **Updates** | `docker compose up -d` | Multiple manual steps |
| **Rollback** | Easy (image tags) | Manual restore |
| **Resource Usage** | Slightly higher | Lower |
| **Learning Curve** | Minimal | Moderate |

---

## Summary

You've successfully deployed BizMetrics with Docker! 🐳🎉

**What you accomplished:**
- ✅ Containerized application
- ✅ Automatic restarts
- ✅ Easy updates and rollbacks
- ✅ Portable across any cloud
- ✅ Production-ready setup

**Your app is running at:**
- HTTP: `http://your-vps-ip:3000`
- HTTPS (with Nginx): `https://yourdomain.com`

**Next steps:**
1. Test all features
2. Set up monitoring
3. Configure backups
4. Share with users!

---

## Getting Help

**Docker Issues:**
- Logs: `docker compose logs -f`
- Official docs: https://docs.docker.com

**App Issues:**
- Health check: `curl http://localhost:3000/health`
- Database test: `docker compose run --rm bizmetrics npm run db:push`

**Quick Debug:**
```bash
docker compose exec bizmetrics sh  # Get shell inside container
ps aux  # View processes
ls -la  # List files
cat .env  # View environment (if needed)
```
