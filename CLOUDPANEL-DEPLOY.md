# BizMetrics - CloudPanel Deployment Guide (Hostinger VPS)

Deploy BizMetrics to Hostinger VPS using CloudPanel. This guide uses SSH terminal commands, but CloudPanel provides a visual interface for site creation and SSL setup.

## Why CloudPanel?

- **Easy Site Creation**: Visual interface for creating Node.js sites
- **Automatic Nginx**: Reverse proxy configured automatically
- **Free SSL**: One-click Let's Encrypt certificates
- **PM2 Integration**: Professional process management
- **File Manager**: Upload files through browser
- **~15 Minutes Setup**: Get your app running quickly

---

## Prerequisites

### 1. Hostinger VPS
- **Plan**: KVM 2 or higher ($7.99/mo+)
- **OS**: Ubuntu 22.04 64-bit
- **CloudPanel**: Pre-installed (select CloudPanel template when ordering)

### 2. Your Local Setup
- BizMetrics app built (`npm run build`)
- Neon PostgreSQL database URL
- SSH client (Terminal on Mac/Linux, PuTTY on Windows)

---

## Step 1: Access CloudPanel

1. Open browser: `https://your-vps-ip:8443`
2. Login with credentials from Hostinger welcome email
3. You'll see the CloudPanel dashboard

> **Finding VPS IP**: Hostinger panel → VPS section → Your VPS details

---

## Step 2: Create Node.js Site

### In CloudPanel Dashboard:

1. Click **"Sites"** (left sidebar)
2. Click **"+ Add Site"** button
3. Configure your site:
   - **Site Type**: Select **"Node.js"** from dropdown
   - **Domain Name**: `yourdomain.com` (or use VPS IP temporarily)
   - **Node.js Version**: **20** (latest LTS)
   - **App Port**: **3000**
   - **Site User**: Create username (e.g., `bizmetrics`)
   - **Site User Password**: Create secure password

4. Click **"Create"**

CloudPanel automatically:
- Creates `/home/bizmetrics/htdocs/yourdomain.com/` directory
- Installs Node.js 20
- Configures Nginx reverse proxy (forwards port 80/443 → 3000)
- Sets up user permissions

---

## Step 3: Upload Application Files

### Option A: CloudPanel File Manager (Visual)

1. In CloudPanel, click **"Files"** (left sidebar)
2. Navigate to: `/home/bizmetrics/htdocs/yourdomain.com/`
3. Click **"Upload"** and select these files/folders:
   - `dist/` (entire folder)
   - `package.json`
   - `package-lock.json`
   - `drizzle.config.ts`
   - `shared/` (database schema folder)

### Option B: SFTP (FileZilla)

1. **Host**: `sftp://your-vps-ip`
2. **Port**: `22`
3. **Username**: `bizmetrics` (your site user)
4. **Password**: Your site user password
5. Navigate to: `/home/bizmetrics/htdocs/yourdomain.com/`
6. Upload all files from Option A

### Option C: Git Clone (Best for Updates)

SSH into server (see Step 4), then:
```bash
cd ~/htdocs/yourdomain.com/
git clone https://github.com/your-username/bizmetrics.git .
npm run build  # Build on server
```

---

## Step 4: SSH Into Your Server

Open terminal and connect:

```bash
ssh bizmetrics@your-vps-ip
```

Enter your site user password when prompted.

You should see:
```
bizmetrics@vps-hostname:~$
```

Navigate to your app:
```bash
cd ~/htdocs/yourdomain.com/
ls  # Verify files uploaded
```

---

## Step 5: Install Dependencies

```bash
npm ci
```

Wait 1-2 minutes for installation to complete.

> **Why not `--omit=dev`?** We need `drizzle-kit` for database migrations.

---

## Step 6: Configure Environment Variables

Create `.env` file:

```bash
nano .env
```

Add your configuration:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Session Security
SESSION_SECRET=your-super-secret-random-string-change-this

# Production Settings
NODE_ENV=production
PORT=3000
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

> **Security**: Generate SESSION_SECRET with: `openssl rand -base64 32`

---

## Step 7: Initialize Database

Run Drizzle migration:

```bash
npm run db:push
```

If you see warnings, force the migration:

```bash
npm run db:push --force
```

Expected output:
```
✓ Pushing schema changes to database
✓ Tables created successfully
```

This creates: `users`, `companies`, `financial_data`, `metric_alerts` tables.

---

## Step 8: Install PM2 (Process Manager)

PM2 keeps your app running 24/7 and auto-restarts on crashes.

Install globally:

```bash
npm install -g pm2
```

Start your app:

```bash
pm2 start dist/index.js --name bizmetrics
```

Configure auto-restart on server reboot:

```bash
pm2 startup
# Copy and run the command it outputs
pm2 save
```

Check app status:

```bash
pm2 status
```

Should show:
```
┌─────┬─────────────┬─────┬───────┬────────┐
│ id  │ name        │mode │status │cpu     │
├─────┼─────────────┼─────┼───────┼────────┤
│ 0   │ bizmetrics  │fork │online │ 0%     │
└─────┴─────────────┴─────┴───────┴────────┘
```

View logs:

```bash
pm2 logs bizmetrics
```

You should see:
```
🚀 BizMetrics Server running on port 3000
📊 Environment: production
```

---

## Step 9: Setup SSL Certificate (HTTPS)

Back in **CloudPanel Dashboard**:

1. Go to **"Sites"** → Your site
2. Click **"SSL/TLS"** tab
3. Click **"Actions"** → **"New Let's Encrypt Certificate"**
4. Select **"Let's Encrypt"**
5. Enter your email address
6. Click **"Create and Install"**

SSL auto-renews every 90 days.

Your site is now live at: `https://yourdomain.com` 🎉

---

## Step 10: Verify Deployment

### Test in Browser:

1. Visit: `https://yourdomain.com`
   - Should load Financial Metrics page
   - Lock icon in address bar (HTTPS working)

2. Test health check: `https://yourdomain.com/health`
   - Should return: `{"status":"healthy","timestamp":"..."}`

3. Try adding financial data via the form
4. Verify charts and metrics display

### Test via Terminal:

```bash
# Check app is running
pm2 status

# View real-time logs
pm2 logs bizmetrics

# Monitor CPU/memory
pm2 monit
```

---

## Updating Your Application

### When you make changes:

**If using Git:**

```bash
ssh bizmetrics@your-vps-ip
cd ~/htdocs/yourdomain.com/
git pull origin main
npm ci  # Update dependencies if needed
npm run build  # Rebuild app
pm2 restart bizmetrics
```

**If uploading manually:**

1. Run `npm run build` on your computer
2. Upload new `dist/` files via CloudPanel File Manager or SFTP
3. SSH in and restart:
   ```bash
   pm2 restart bizmetrics
   ```

---

## Useful PM2 Commands

```bash
# View all apps
pm2 list

# View logs
pm2 logs
pm2 logs bizmetrics
pm2 logs --lines 100

# Restart app
pm2 restart bizmetrics

# Stop app
pm2 stop bizmetrics

# Monitor resources (real-time)
pm2 monit

# Delete app from PM2
pm2 delete bizmetrics

# Save current PM2 config
pm2 save
```

---

## Monitoring & Maintenance

### Check App Status

**Via PM2:**
```bash
pm2 status
pm2 logs bizmetrics --lines 50
```

**Via CloudPanel:**
- Dashboard shows disk usage, CPU, memory
- Logs available under Sites → Your site → Vhost

### Database Backups

Your Neon database has automatic backups. Configure in Neon dashboard:
- Daily backups (free tier)
- Point-in-time recovery (paid tiers)

### Update Node.js Version

If you need to upgrade Node.js:

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install new version
nvm install 22
nvm use 22

# Restart app
pm2 restart bizmetrics
```

---

## Troubleshooting

### App Won't Start

**Check PM2 logs:**
```bash
pm2 logs bizmetrics --err
```

**Common Issues:**
- Missing `.env` file → Create with database credentials
- Wrong `DATABASE_URL` → Check Neon dashboard
- Port 3000 already in use → Check with `netstat -tulpn | grep 3000`
- Missing dependencies → Run `npm ci` again

**Restart app:**
```bash
pm2 restart bizmetrics
```

### 502 Bad Gateway

**Causes:**
- App not running (PM2 shows "stopped" or "errored")
- App listening on wrong port (should be 3000)
- Nginx misconfiguration

**Fix:**
```bash
# Check app status
pm2 status

# Restart app
pm2 restart bizmetrics

# Check app is listening
netstat -tulpn | grep 3000

# Check Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Database Connection Errors

**Verify DATABASE_URL:**
```bash
# View environment variables
cat .env

# Test database connection
npm run db:push
```

**Common fixes:**
- Add `?sslmode=require` to Neon connection string
- Check Neon database is active (not paused)
- Verify IP whitelist in Neon (allow all IPs: `0.0.0.0/0`)

### Can't Access Site

**DNS Issues:**

Check your domain DNS settings:
```
Type: A
Name: @
Value: your-vps-ip
TTL: 3600
```

Wait 5-60 minutes for DNS propagation.

**Firewall:**

CloudPanel automatically configures firewall. If issues persist:
```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### PM2 Not Found After Server Reboot

**Re-run startup command:**
```bash
pm2 startup
pm2 save
```

Copy and run the command it outputs.

---

## Security Best Practices

✅ **Implemented:**
- HTTPS/SSL encryption (Let's Encrypt)
- Firewall configured (UFW)
- User isolation (site-specific users)
- Process management (PM2)

✅ **Your Responsibilities:**
- **Strong SESSION_SECRET**: 20+ random characters
- **Secure DATABASE_URL**: Never commit to Git
- **Regular updates**: `npm update` monthly
- **Monitor logs**: Check PM2 logs weekly

**Update Ubuntu packages:**
```bash
sudo apt update && sudo apt upgrade -y
```

---

## Performance Tips

### Enable Compression

Already enabled in Nginx by CloudPanel. Verify:
```bash
curl -I -H "Accept-Encoding: gzip" https://yourdomain.com
# Should show: Content-Encoding: gzip
```

### Monitor Resources

```bash
# Real-time monitoring
pm2 monit

# System resources
htop
```

**Upgrade VPS if:**
- CPU consistently >80%
- Memory consistently >90%
- Response times slow

### Database Optimization

- Use indexes on frequently queried columns (already configured)
- Monitor slow queries in Neon dashboard
- Consider upgrading Neon plan for more storage/performance

---

## Cost Summary

| Item | Cost | Notes |
|------|------|-------|
| Hostinger VPS KVM 2 | $7.99/mo | Recommended plan |
| Neon PostgreSQL | Free | Up to 3GB storage |
| Domain Name | ~$10/yr | Optional (can use IP) |
| SSL Certificate | Free | Let's Encrypt |
| **Total** | **~$8/mo** | Production-ready |

---

## Quick Command Reference

```bash
# SSH into server
ssh bizmetrics@your-vps-ip

# Navigate to app
cd ~/htdocs/yourdomain.com/

# View app status
pm2 status

# View logs
pm2 logs bizmetrics

# Restart app
pm2 restart bizmetrics

# Pull latest code (if using Git)
git pull origin main
npm ci
npm run build
pm2 restart bizmetrics

# Database migration
npm run db:push

# Monitor app
pm2 monit
```

---

## Getting Help

### CloudPanel Issues
- Official docs: https://www.cloudpanel.io/docs/
- Hostinger support: Live chat in Hostinger panel

### BizMetrics App Issues
- Check PM2 logs: `pm2 logs bizmetrics`
- Test database: `npm run db:push`
- Health check: `curl https://yourdomain.com/health`

### Common Questions

**Q: Can I use my VPS IP instead of a domain?**  
A: Yes! Use `http://your-vps-ip` but you won't get SSL.

**Q: How do I change the app port?**  
A: Edit CloudPanel site settings → Vhost → change `proxy_pass` port, then restart nginx.

**Q: Can I run multiple Node.js apps?**  
A: Yes! Create separate sites in CloudPanel with different ports (3000, 3001, etc).

---

## Success! 🎉

Your BizMetrics financial analytics platform is now live and accessible worldwide!

**What you've accomplished:**
- ✅ Deployed to production VPS
- ✅ Configured professional process management
- ✅ Enabled HTTPS encryption
- ✅ Set up automatic restarts
- ✅ Database initialized and connected

**Next steps:**
1. Test all features thoroughly
2. Configure regular database backups
3. Set up monitoring alerts
4. Share with users!

Your app is running at: `https://yourdomain.com` 🚀📊
