# BizMetrics Production Deployment Guide

This guide explains how to deploy BizMetrics to a production server using Nginx and Node.js.

## Prerequisites

- A Linux server (Ubuntu 20.04+ recommended)
- Node.js 20.x or higher
- Nginx web server
- PostgreSQL database (or Neon serverless PostgreSQL)
- Domain name (optional, but recommended)

## Step 1: Install Required Software

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL (if not using Neon)
sudo apt install -y postgresql postgresql-contrib

# Install PM2 for process management (optional but recommended)
sudo npm install -g pm2
```

## Step 2: Clone and Build the Application

```bash
# Clone your repository
git clone <your-repository-url>
cd bizmetrics

# Install dependencies
npm install

# Build the application
npm run build
```

This creates:
- `dist/public/` - Frontend static files (HTML, CSS, JS)
- `dist/index.js` - Backend server

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/bizmetrics

# Session Secret (generate a secure random string)
SESSION_SECRET=your-super-secret-session-key-change-this

# Application Port (default: 5000)
PORT=5000

# Node Environment
NODE_ENV=production
```

**Generate a secure session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Set Up Nginx

### Copy the Nginx Configuration

```bash
# Copy the nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/bizmetrics

# Update the configuration with your domain
sudo nano /etc/nginx/sites-available/bizmetrics
# Change 'server_name localhost;' to 'server_name yourdomain.com;'

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/bizmetrics /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Copy Built Files to Nginx Root

```bash
# Create directory for the application
sudo mkdir -p /var/www/bizmetrics

# Copy built files
sudo cp -r dist /var/www/bizmetrics/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/bizmetrics
```

## Step 5: Start the Application

### Option A: Using the Startup Script

```bash
# Make the script executable
chmod +x start-production.sh

# Run the application
./start-production.sh
```

### Option B: Using PM2 (Recommended for Production)

PM2 keeps your app running and restarts it if it crashes.

```bash
# Start the application with PM2
pm2 start dist/index.js --name bizmetrics

# Save PM2 process list
pm2 save

# Set PM2 to start on system boot
pm2 startup

# Monitor the application
pm2 monit

# View logs
pm2 logs bizmetrics
```

### Option C: Using systemd Service

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/bizmetrics.service
```

Add this content:

```ini
[Unit]
Description=BizMetrics Financial Analytics Platform
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bizmetrics
Environment=NODE_ENV=production
EnvironmentFile=/var/www/bizmetrics/.env
ExecStart=/usr/bin/node /var/www/bizmetrics/dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bizmetrics
sudo systemctl start bizmetrics
sudo systemctl status bizmetrics
```

## Step 6: Database Setup

Run database migrations:

```bash
# Push schema to database
npm run db:push
```

## Step 7: SSL/HTTPS Setup (Recommended)

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

## Deployment Checklist

- [ ] Server has Node.js 20+ installed
- [ ] PostgreSQL database is set up and accessible
- [ ] `.env` file created with all required variables
- [ ] Application built successfully (`npm run build`)
- [ ] Nginx installed and configured
- [ ] Static files copied to `/var/www/bizmetrics/dist/public`
- [ ] Backend server running on port 5000
- [ ] Nginx proxying requests correctly
- [ ] SSL certificate installed (for HTTPS)
- [ ] Process manager (PM2 or systemd) configured
- [ ] Firewall configured (allow ports 80, 443)

## Common Commands

```bash
# Check application status (PM2)
pm2 status

# Restart application (PM2)
pm2 restart bizmetrics

# View logs (PM2)
pm2 logs bizmetrics --lines 100

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx configuration
sudo nginx -t && sudo systemctl reload nginx

# Check application logs (systemd)
sudo journalctl -u bizmetrics -f
```

## Troubleshooting

### Application won't start
- Check environment variables in `.env`
- Verify database connection: `psql $DATABASE_URL`
- Check Node.js version: `node --version` (should be 20+)
- View error logs: `pm2 logs bizmetrics` or `sudo journalctl -u bizmetrics`

### Nginx 502 Bad Gateway
- Ensure Node.js backend is running on port 5000
- Check backend logs for errors
- Verify Nginx can connect to localhost:5000

### Database connection errors
- Check DATABASE_URL is correct
- Verify database is running: `sudo systemctl status postgresql`
- Test connection: `psql $DATABASE_URL`
- Check firewall isn't blocking database port

### Static files not loading
- Verify files exist in `/var/www/bizmetrics/dist/public`
- Check Nginx configuration path matches
- Verify file permissions: `ls -la /var/www/bizmetrics/dist/public`

## Updating the Application

```bash
# Pull latest changes
git pull

# Install dependencies (if package.json changed)
npm install

# Rebuild application
npm run build

# Copy new files to Nginx root
sudo cp -r dist/public/* /var/www/bizmetrics/dist/public/

# Restart backend
pm2 restart bizmetrics
# OR
sudo systemctl restart bizmetrics
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to git
2. **Session Secret**: Use a strong, random session secret
3. **Database**: Use strong passwords and restrict access
4. **HTTPS**: Always use SSL in production
5. **Firewall**: Configure UFW to allow only necessary ports
6. **Updates**: Keep system and Node.js packages updated
7. **Backups**: Regularly backup your database

```bash
# Configure firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## Monitoring

### Set up basic monitoring with PM2

```bash
# Install PM2 Plus for advanced monitoring (optional)
pm2 plus

# Monitor CPU and memory
pm2 monit
```

### Database Backups

```bash
# Backup PostgreSQL database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup-20250316.sql
```

## Support

For issues or questions:
- Check application logs
- Review Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Check system logs: `sudo journalctl -xe`
