# Quick Start Guide

Get the TrueHour running in 5 minutes!

## First-Time User Experience

When you first open the app, you'll see a friendly **Onboarding Wizard** with three options:

1. **Start Fresh** - Enter your hours and training goals manually
2. **Import Logbook** - Upload ForeFlight CSV to auto-fill your hours
3. **Load Budget** - Continue working on a previously saved budget

The wizard will guide you through setup step-by-step. See [Onboarding Flow](Onboarding-Flow.md) for detailed information.

**Want to skip onboarding?** Add `?flow=classic` to the URL for direct access to the calculator.

---

## For Local Testing

```bash
# 1. Clone repository
git clone https://github.com/ryakel/flight-budget.git
cd flight-budget

# 2. Build image
docker build -t ryakel/flight-budget:latest .

# 3. Run container
docker-compose up -d

# 4. Open browser
open http://localhost:8181
```

## For Production (Portainer)

### Prerequisites Checklist

- [ ] Portainer installed and accessible
- [ ] Docker Hub account credentials ready
- [ ] GitHub repository created: `ryakel/flight-budget`
- [ ] Code pushed to GitHub main branch

### Step 1: Add GitHub Secrets (2 min)

Go to: `https://github.com/ryakel/flight-budget/settings/secrets/actions`

Add these secrets:
1. `DOCKER_USERNAME` = `ryakel`
2. `DOCKER_PASSWORD` = Your Docker Hub access token
3. `PORTAINER_WEBHOOK_URL` = (get from Step 3)

### Step 2: Deploy in Portainer (2 min)

1. **Portainer** → **Stacks** → **Add Stack**
2. **Name**: `flight-budget`
3. **Repository**: `https://github.com/ryakel/flight-budget`
4. **Reference**: `refs/heads/main`
5. **Compose path**: `docker-compose.yml`
6. Click **Deploy**

### Step 3: Create Webhook (1 min)

1. Open your new stack in Portainer
2. Scroll to **Webhooks** → **Add webhook**
3. Copy the webhook URL
4. Go back to GitHub secrets (Step 1)
5. Add as `PORTAINER_WEBHOOK_URL`

### Step 4: Test (30 sec)

```bash
# Make a test change
echo "# Test" >> README.md
git add README.md
git commit -m "test: automated deployment"
git push origin main

# Watch it deploy automatically!
# GitHub Actions → ~2 min → Portainer → Live!
```

## Access Your App

- **Local**: http://localhost:8181
- **Production**: http://your-server:8181
- **With nginx**: https://budget.yourdomain.com

## Quick Commands

```bash
# View logs
docker logs -f flight-budget-app

# Restart container
docker restart flight-budget-app

# Update manually
docker pull ryakel/flight-budget:latest
docker-compose up -d --force-recreate

# Check health
curl http://localhost:8181/health

# Backup data
docker run --rm \
  -v flight-budget_flight-budget-data:/data \
  -v ./backup:/backup \
  alpine tar czf /backup/data-$(date +%Y%m%d).tar.gz -C /data .
```

## Need Help?

- 📖 Full documentation: [README.md](README.md)
- 🚀 Detailed deployment: [DEPLOYMENT.md](DEPLOYMENT.md)
- 📋 Setup overview: [CONTAINER_SETUP.md](CONTAINER_SETUP.md)
- 🐛 Issues: GitHub Issues tracker

## Support

Having issues? Check:
1. Container logs: `docker logs flight-budget-app`
2. Health endpoint: `curl http://localhost:8181/health`
3. Port availability: `netstat -an | grep 8181`
4. GitHub Actions: Check workflow runs
5. Portainer: Stack logs and status

---

**That's it!** Your TrueHour is now running with automated deployments. 🎉
