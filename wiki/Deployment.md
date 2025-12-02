# Deployment Guide - Portainer Setup

This guide walks you through deploying the TrueHour using Portainer with automated updates.

## Prerequisites

✅ Portainer installed and accessible
✅ Docker Hub account (ryakel)
✅ GitHub repository access
✅ Nginx reverse proxy configured (optional for production)

---

## Initial Deployment

### Option 1: Deploy via Portainer Git Repository (Recommended)

1. **Navigate to Stacks**
   - In Portainer, go to **Stacks** → **Add stack**

2. **Configure Stack**
   - **Name**: `flight-budget`
   - **Build method**: Select **Git Repository**
   - **Repository URL**: `https://github.com/ryakel/flight-budget`
   - **Repository reference**: `refs/heads/main`
   - **Compose path**: `docker-compose.yml`

3. **Environment Variables** (optional)
   ```
   APP_PORT=8181
   TIMEZONE=UTC
   ```

4. **Deploy**
   - Click **Deploy the stack**
   - Wait for deployment to complete

5. **Verify**
   - Navigate to `http://your-server:8181`
   - You should see the TrueHour

### Option 2: Deploy via Portainer Web Editor

1. **Navigate to Stacks**
   - In Portainer, go to **Stacks** → **Add stack**

2. **Configure Stack**
   - **Name**: `flight-budget`
   - **Build method**: Select **Web editor**

3. **Paste Docker Compose**
   - Copy contents from `docker-compose.yml`
   - Paste into the web editor

4. **Set Environment Variables** (optional)
   ```
   APP_PORT=8181
   TIMEZONE=UTC
   ```

5. **Deploy**
   - Click **Deploy the stack**

---

## Setting Up Automated Updates

### Step 1: Create Portainer Webhook

1. **Access Your Stack**
   - In Portainer, navigate to **Stacks**
   - Click on your `flight-budget` stack

2. **Create Webhook**
   - Scroll down to the **Webhooks** section
   - Click **Add webhook**

3. **Configure Webhook**
   - **Service**: Select `flight-budget` (or leave empty for entire stack)
   - **Action**: Select `Repull image and redeploy`

4. **Copy Webhook URL**
   - Click the webhook you just created
   - Copy the webhook URL
   - Format: `https://your-portainer.com/api/webhooks/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **Keep this URL secure!** Anyone with this URL can trigger your deployment

### Step 2: Configure GitHub Secrets

1. **Navigate to Repository Settings**
   - Go to `https://github.com/ryakel/flight-budget`
   - Click **Settings** → **Secrets and variables** → **Actions**

2. **Add Docker Hub Credentials**
   - Click **New repository secret**
   - **Name**: `DOCKER_USERNAME`
   - **Value**: `ryakel`
   - Click **Add secret**

3. **Add Docker Hub Token**
   - Click **New repository secret**
   - **Name**: `DOCKER_PASSWORD`
   - **Value**: Your Docker Hub access token (create at https://hub.docker.com/settings/security)
   - Click **Add secret**

4. **Add Portainer Webhook**
   - Click **New repository secret**
   - **Name**: `PORTAINER_WEBHOOK_URL`
   - **Value**: The webhook URL you copied from Portainer
   - Click **Add secret**

### Step 3: Verify Automated Workflow

Your repository now has two automated workflows:

#### 1. Docker Build & Deploy (`.github/workflows/docker-build.yml`)

**Triggers:**
- Push to `main` branch
- Manual trigger via GitHub Actions UI

**Steps:**
1. Builds multi-architecture Docker image (amd64, arm64)
2. Pushes to Docker Hub (`ryakel/flight-budget:latest`)
3. Triggers Portainer webhook
4. Portainer automatically redeploys with new image

**Test It:**
```bash
# Make a small change and push
git add .
git commit -m "test: trigger automated deployment"
git push origin main
```

**Monitor Progress:**
1. GitHub: **Actions** tab → Watch the workflow run
2. Docker Hub: Check for new image push
3. Portainer: Watch stack redeploy automatically

#### 2. Update CDN Dependencies (`.github/workflows/update-dependencies.yml`)

**Triggers:**
- Weekly schedule: Sundays at 2 AM UTC
- Manual trigger via GitHub Actions UI

**Steps:**
1. Downloads latest versions of JavaScript libraries
2. Creates a Pull Request if updates are found
3. Review and merge the PR to deploy updates

---

## Deployment Flow Diagram

```
Developer pushes to main
         ↓
GitHub Actions triggered
         ↓
    Build Docker image
    (multi-arch: amd64, arm64)
         ↓
  Push to Docker Hub
  (ryakel/flight-budget:latest)
         ↓
  Trigger Portainer webhook
         ↓
Portainer pulls new image
         ↓
  Stack redeployed automatically
         ↓
      Live! 🎉
```

**Total time: ~2-5 minutes** from push to live deployment

---

## Nginx Reverse Proxy Configuration

For production deployment with SSL:

### Nginx Configuration

Create `/etc/nginx/sites-available/flight-budget`:

```nginx
server {
    listen 80;
    server_name budget.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name budget.yourdomain.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/budget.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/budget.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy to Docker container
    location / {
        proxy_pass http://localhost:8181;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Optional: Increase timeouts for large CSV uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8181/health;
        access_log off;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/flight-budget /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Generate certificate
certbot --nginx -d budget.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal:
certbot renew --dry-run
```

---

## Maintenance

### Manual Update

If you need to manually update the stack:

```bash
# Pull latest image
docker pull ryakel/flight-budget:latest

# Redeploy via Portainer UI or CLI
docker-compose up -d --force-recreate
```

### View Logs

In Portainer:
1. Navigate to **Containers**
2. Click on `flight-budget-app`
3. Click **Logs**

Or via CLI:
```bash
docker logs -f flight-budget-app
```

### Backup Persistent Data

Aircraft configurations are stored in a volume. To backup:

```bash
# Create backup directory
mkdir -p ~/backups

# Backup volume
docker run --rm \
  -v flight-budget_flight-budget-data:/data \
  -v ~/backups:/backup \
  alpine tar czf /backup/flight-budget-data-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore from Backup

```bash
# Restore volume
docker run --rm \
  -v flight-budget_flight-budget-data:/data \
  -v ~/backups:/backup \
  alpine tar xzf /backup/flight-budget-data-YYYYMMDD.tar.gz -C /data
```

---

## Troubleshooting

### Webhook Not Triggering

**Check GitHub Actions logs:**
1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. Check the "Trigger Portainer webhook" step

**Common issues:**
- `PORTAINER_WEBHOOK_URL` secret not set or incorrect
- Portainer webhook deleted or expired
- Network connectivity issues

### Stack Not Updating

1. **Verify webhook URL is correct** in GitHub secrets
2. **Check Portainer webhook exists** in stack settings
3. **Manually trigger update** in Portainer:
   - Go to **Stacks** → `flight-budget`
   - Click **Update the stack**
   - Enable **Re-pull image**
   - Click **Update**

### Port Already in Use

If port 8181 is already in use:

1. Edit `.env` file or Portainer environment variables
2. Change `APP_PORT` to another port (e.g., 8282)
3. Update your nginx proxy configuration
4. Redeploy the stack

---

## Security Best Practices

✅ Keep webhook URL secret (it's in GitHub secrets, don't share it)
✅ Use SSL/TLS in production (Let's Encrypt)
✅ Restrict Portainer access with strong passwords
✅ Enable two-factor authentication on Docker Hub
✅ Regularly update the base image (automated via GitHub Actions)
✅ Monitor container logs for suspicious activity

---

## Next Steps

1. ✅ Deploy stack in Portainer
2. ✅ Create and configure webhook
3. ✅ Add GitHub secrets
4. ✅ Test automated deployment
5. ✅ Configure nginx reverse proxy (production)
6. ✅ Set up SSL certificate
7. ⏭️ Fix aircraft persistence logic (see TODO)

---

## Support

For issues:
- Check container logs: `docker logs flight-budget-app`
- Review GitHub Actions runs: Repository → Actions tab
- Verify webhook status in Portainer
- Check nginx logs: `tail -f /var/log/nginx/error.log`

Need help? Create an issue in the GitHub repository.
