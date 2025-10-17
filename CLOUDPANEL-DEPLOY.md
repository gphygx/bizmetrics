# BizMetrics - CloudPanel Deployment Guide

Deploy BizMetrics to Hostinger VPS using CloudPanel's user-friendly GUI interface. No command-line experience required!

## Why CloudPanel?

- **Visual Interface**: Click buttons instead of typing commands
- **Automatic SSL**: Free HTTPS certificates with one click
- **Easy Updates**: Upload new versions through file manager
- **Built-in Monitoring**: See your app's performance at a glance
- **5-Minute Setup**: Get your app running fast

---

## Prerequisites

### 1. Hostinger VPS Setup
- **VPS Plan**: KVM 2 or higher recommended ($7.99/mo+)
- **Operating System**: Ubuntu 22.04 64-bit
- **CloudPanel**: Must be installed (comes with most Hostinger VPS plans)

### 2. Your BizMetrics App
- Built production files (run `npm run build` on your computer)
- Neon PostgreSQL database URL
- Session secret key

---

## Step 1: Access CloudPanel

1. Open your browser and go to: `https://your-vps-ip:8443`
2. Log in with credentials from Hostinger welcome email
3. You'll see the CloudPanel dashboard

> **Finding your VPS IP**: Check your Hostinger control panel under "VPS" section

---

## Step 2: Create a Node.js Site

### In CloudPanel Dashboard:

1. Click **"Sites"** in left sidebar
2. Click **"Add Site"** button (top right)
3. Fill in the form:
   - **Site Type**: Select **"Node.js"**
   - **Domain Name**: Your domain (e.g., `bizmetrics.yourdomain.com`) or VPS IP
   - **Node.js Version**: Select **20.x** (latest LTS)
   - **App Port**: Enter **3000**
   - **Site User**: Leave default or create new user
   - **Vhost Template**: Select **"Node.js"**

4. Click **"Create"** button

CloudPanel will:
- Create directory structure
- Install Node.js 20
- Configure Nginx automatically
- Set up process manager

---

## Step 3: Upload Your Application Files

### Option A: File Manager (Easiest)

1. In CloudPanel, click **"Files"** in left sidebar
2. Navigate to your site directory: `/home/[site-user]/htdocs/[domain]/`
3. Click **"Upload"** button
4. Upload these files and folders:
   - `dist/` folder (entire folder with index.js and public/)
   - `package.json`
   - `package-lock.json`
   - `drizzle.config.ts` (required for database migrations)
   - `shared/` folder (contains database schema)

### Option B: Git (Recommended for Updates)

1. In CloudPanel, go to **"Sites"** → Your site → **"Git"**
2. Click **"Enable Git"**
3. Enter your repository URL
4. Click **"Clone Repository"**
5. CloudPanel pulls your code automatically
6. Run `npm run build` in CloudPanel terminal to build the app

> **Tip**: For Git method, you can either commit your built `dist/` folder OR build on the server after cloning

### Option C: FTP/SFTP

1. Use FileZilla or any SFTP client
2. Connect to: `your-vps-ip` (Port 22)
3. Username: Your site user
4. Password: Set in CloudPanel → Users
5. Upload to: `/home/[site-user]/htdocs/[domain]/`
6. Upload same files as Option A: `dist/`, `package.json`, `package-lock.json`, `drizzle.config.ts`, `shared/`

---

## Step 4: Install Node.js Dependencies

1. In CloudPanel, go to **"Sites"** → Your site
2. Click **"Node.js"** tab
3. In the **"Terminal"** section, run:
   ```bash
   npm ci
   ```
4. Wait for installation to complete (1-2 minutes)

> **Note**: We install all dependencies (including dev) because drizzle-kit is needed for database migrations

---

## Step 5: Configure Environment Variables

1. In CloudPanel, go to **"Sites"** → Your site
2. Click **"Node.js"** tab
3. Scroll to **"Environment Variables"**
4. Click **"Add Variable"** for each:

| Variable Name | Value | Example |
|---------------|-------|---------|
| `DATABASE_URL` | Your Neon PostgreSQL URL | `postgresql://user:pass@host/db?sslmode=require` |
| `SESSION_SECRET` | Random secure string | `generate-with-random-password-tool` |
| `NODE_ENV` | `production` | `production` |
| `PORT` | `3000` | `3000` |

5. Click **"Save"** after adding all variables

> **Security**: Never share your DATABASE_URL or SESSION_SECRET publicly!

---

## Step 6: Initialize Database

**Critical Step**: Set up your database tables before starting the app.

1. In CloudPanel, go to **"Sites"** → Your site → **"Node.js"** tab
2. In the **"Terminal"** section, run:
   ```bash
   npm run db:push
   ```
3. If prompted with warnings, run:
   ```bash
   npm run db:push --force
   ```
4. Wait for completion. You should see:
   ```
   ✓ Pushing schema changes to database
   ✓ Tables created successfully
   ```

This creates the required database tables (users, companies, financial_data, metric_alerts).

> **Important**: Without this step, your app will crash when trying to read/write data!

---

## Step 7: Start Your Application

1. In CloudPanel, go to **"Sites"** → Your site → **"Node.js"** tab
2. In **"App Settings"**:
   - **App Start Command**: Enter `node dist/index.js`
   - **App Restart**: Click **"Restart App"** button

3. Check status indicator:
   - 🟢 **Green** = Running successfully
   - 🔴 **Red** = Error (check logs below)

4. View logs in **"Logs"** section to confirm:
   ```
   🚀 BizMetrics Server running on port 3000
   📊 Environment: production
   ```

---

## Step 8: Setup SSL Certificate (HTTPS)

1. In CloudPanel, go to **"Sites"** → Your site
2. Click **"SSL/TLS"** tab
3. Select **"Let's Encrypt"**
4. Click **"Actions"** → **"New Certificate"**
5. Enter your email address
6. Click **"Create Certificate"**

CloudPanel automatically:
- Generates free SSL certificate
- Configures HTTPS redirects
- Sets up auto-renewal (90 days)

Your site is now accessible at: `https://yourdomain.com` 🎉

---

## Step 9: Verify Deployment

Visit your domain and check:
- ✅ Site loads over HTTPS (lock icon in browser)
- ✅ Financial Metrics page displays
- ✅ Can add financial data via form
- ✅ Charts and metrics calculate correctly

**Test API Health**:
- Go to: `https://yourdomain.com/health`
- Should return: `{"status":"healthy","timestamp":"..."}` with 200 OK status

---

## Updating Your Application

### When you make changes:

1. Run `npm run build` locally
2. Upload new `dist/` files via CloudPanel File Manager
3. In CloudPanel → **"Node.js"** → Click **"Restart App"**

**Using Git**:
1. Commit changes to your repository
2. In CloudPanel → **"Git"** → Click **"Pull Changes"**
3. Restart app

---

## Monitoring & Maintenance

### Check App Status
- CloudPanel dashboard shows: Uptime, Memory usage, CPU usage
- **Logs**: Sites → Your site → Node.js → Logs section

### Automatic Restarts
CloudPanel's process manager automatically restarts your app if it crashes.

### Database Backups
Your Neon database has automatic backups. Configure in Neon dashboard.

### Update Node.js Version
1. CloudPanel → Sites → Your site → Node.js
2. Select new version (e.g., 22.x)
3. Click "Change Version"
4. Restart app

---

## Troubleshooting

### App Won't Start (Red Status)

**Check Logs**:
1. CloudPanel → Sites → Your site → Node.js → Logs
2. Look for error messages

**Common Issues**:
- Missing environment variables (check DATABASE_URL, SESSION_SECRET)
- Wrong start command (should be `node dist/index.js`)
- Port conflict (ensure PORT=3000)
- Database connection failed (verify DATABASE_URL)

### 502 Bad Gateway Error

**Causes**:
- App not running (check status in CloudPanel)
- Wrong app port (must be 3000)
- App crashed (check logs)

**Fix**:
1. Restart app in CloudPanel
2. Check logs for errors
3. Verify environment variables

### Can't Access Site

**DNS Not Configured**:
1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add A record: `@` → `your-vps-ip`
3. Add A record: `www` → `your-vps-ip`
4. Wait 5-60 minutes for DNS propagation

**Firewall Blocking**:
CloudPanel automatically configures firewall. If issues persist:
1. CloudPanel → Security → Firewall
2. Ensure ports 80 and 443 are allowed

### Database Connection Errors

**Verify DATABASE_URL**:
1. Test connection string in your local app
2. Ensure it includes `?sslmode=require` for Neon
3. Check Neon dashboard for database status

**Whitelist VPS IP**:
- Some databases require IP whitelisting
- Add your VPS IP in Neon/database settings

---

## Performance Tips

### Enable Caching
CloudPanel → Sites → Your site → Vhost:
- Static files (CSS, JS, images) cached automatically
- Add cache headers if needed

### Monitor Resources
- Check CloudPanel dashboard for memory/CPU usage
- Upgrade VPS plan if consistently >80% usage

### Database Optimization
- Use connection pooling (already configured in BizMetrics)
- Monitor slow queries in Neon dashboard
- Index frequently queried columns

---

## Security Best Practices

✅ **Implemented Automatically**:
- HTTPS/SSL encryption
- Automatic security updates (Ubuntu)
- Firewall configuration
- Process isolation

✅ **Your Responsibilities**:
- Use strong SESSION_SECRET (20+ random characters)
- Keep DATABASE_URL private
- Update Node.js version regularly
- Monitor CloudPanel security alerts

---

## Getting Help

### CloudPanel Documentation
- Official docs: https://www.cloudpanel.io/docs/

### Hostinger Support
- 24/7 live chat in Hostinger control panel
- Email: support@hostinger.com

### BizMetrics Specific Issues
- Check application logs in CloudPanel
- Verify all environment variables are set
- Test database connection separately

---

## Cost Estimate

| Item | Cost | Notes |
|------|------|-------|
| Hostinger VPS KVM 2 | $7.99/mo | Recommended plan |
| Neon PostgreSQL | Free tier | Up to 3GB storage |
| Domain Name | ~$10/yr | Optional (can use IP) |
| SSL Certificate | Free | Let's Encrypt via CloudPanel |
| **Total** | **~$8-9/mo** | Production-ready setup |

---

## Summary

You've successfully deployed BizMetrics using CloudPanel! 🚀

**What you accomplished**:
- ✅ Created Node.js site with visual GUI
- ✅ Uploaded and configured your app
- ✅ Set up HTTPS with free SSL
- ✅ Automated process management
- ✅ Monitoring and logging enabled

**Next steps**:
1. Test all features thoroughly
2. Set up regular database backups
3. Configure domain name (if not done)
4. Share with users!

Your financial metrics tracking platform is now live and accessible to the world! 📊💼
