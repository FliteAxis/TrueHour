# Quick Reference Card

## Essential Commands

### Local Development
```bash
# Test application locally
open app/index.html

# Or with local server
python3 -m http.server 8000 --directory app
# Access: http://localhost:8000
```

### Docker Build & Test
```bash
# Build locally
docker build -t ryakel/flight-budget:test -f infrastructure/Dockerfile .

# Run container
docker run -d -p 8181:80 --name flight-budget-test ryakel/flight-budget:test

# View logs
docker logs flight-budget-test

# Stop and cleanup
docker stop flight-budget-test
docker rm flight-budget-test
```

### Docker Compose
```bash
# Start stack
cd infrastructure
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop stack
docker-compose down
```

### Git Workflow
```bash
# Development work
git checkout development
git add .
git commit -m "feat: description of feature"
git push origin development

# Production release (semantic versioning)
git checkout main
git merge development
git commit -m "minor: release new feature"  # or fix:/major:/breaking:
git push origin main
```

---

## GitHub Secrets Required

| Secret | Value | Purpose |
|--------|-------|---------|
| `DOCKER_USERNAME` | `ryakel` | Docker Hub username |
| `DOCKER_TOKEN` | [access token] | Docker Hub authentication |
| `PORTAINER_WEBHOOK_URL` | [webhook URL] | Optional: Auto-deployment |

**Add at**: Repository → Settings → Secrets and variables → Actions

---

## Semantic Versioning

| Commit Prefix | Version Change | Example |
|---------------|----------------|---------|
| `fix:` or `patch:` | Patch (0.0.x) | v1.2.3 → v1.2.4 |
| `minor:` or `feat:` | Minor (0.x.0) | v1.2.3 → v1.3.0 |
| `major:` or `breaking:` | Major (x.0.0) | v1.2.3 → v2.0.0 |

---

## Docker Tags

| Branch | Tags Produced | Use Case |
|--------|---------------|----------|
| `main` | `latest`, `v1.2.3` | Production |
| `development` | `dev` | Testing |
| Manual tags | Specific version | Rollback |

**Docker Hub**: https://hub.docker.com/r/ryakel/flight-budget/tags

---

## GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Docker Builder** | Push to main/dev | Build & publish images |
| **Update Dependencies** | Weekly Sunday 2AM | Download CDN libraries |
| **Stale Issues** | Daily 1:30 AM | Close inactive issues/PRs |

**Monitor at**: Repository → Actions

---

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| Application | `app/index.html` | Main HTML file |
| Styles | `app/css/styles.css` | Application CSS |
| JavaScript | `app/js/app.js` | Application logic |
| Libraries | `app/libs/` | Vendored dependencies |
| Dockerfile | `infrastructure/Dockerfile` | Container build |
| Docker Compose | `infrastructure/docker-compose.yml` | Stack definition |
| Dependencies | `dependencies.json` | Version manifest |
| Workflows | `.github/workflows/` | CI/CD automation |

---

## Useful URLs

| Resource | URL |
|----------|-----|
| **Docker Hub Repo** | https://hub.docker.com/r/ryakel/flight-budget |
| **GitHub Repo** | https://github.com/ryakel/flight-budget |
| **GitHub Actions** | https://github.com/ryakel/flight-budget/actions |
| **GitHub Releases** | https://github.com/ryakel/flight-budget/releases |
| **Docker Hub Token** | https://hub.docker.com/settings/security |
| **Renovate App** | https://github.com/apps/renovate |

---

## Port Configuration

| Service | Port | Access |
|---------|------|--------|
| Application | 8181 | http://localhost:8181 |
| Container internal | 80 | nginx default |

---

## Troubleshooting Quick Fixes

### Workflow Failed: Invalid credentials
```bash
# Check secrets exist
Repository → Settings → Secrets and variables → Actions
# Verify: DOCKER_USERNAME and DOCKER_TOKEN are present
```

### Can't push to Docker Hub
```bash
# Regenerate Docker Hub token
1. Login to Docker Hub
2. Settings → Security → New Access Token
3. Update GitHub secret: DOCKER_TOKEN
```

### Container won't start
```bash
# Check logs
docker logs flight-budget

# Check if port in use
lsof -i :8181

# Kill process using port
kill -9 [PID]
```

### Application not loading
```bash
# Verify container running
docker ps | grep flight-budget

# Check nginx logs
docker logs flight-budget

# Test from inside container
docker exec -it flight-budget curl localhost
```

---

## Health Check Commands

```bash
# Check container health
docker ps --filter "name=flight-budget"

# Check image exists locally
docker images | grep flight-budget

# Test Docker Hub pull
docker pull ryakel/flight-budget:latest

# Verify app accessible
curl -I http://localhost:8181
```

---

## Update Dependencies

### Manual Update
```bash
# Edit versions
vim dependencies.json

# Trigger workflow
Repository → Actions → Update CDN Dependencies → Run workflow

# Or update locally
curl -L -o app/libs/papaparse.min.js \
  "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"
```

---

## Rollback to Previous Version

```bash
# List available tags
docker pull ryakel/flight-budget --all-tags

# Run specific version
docker run -d -p 8181:80 ryakel/flight-budget:v1.2.3

# Update Portainer stack
# Edit docker-compose.yml: image: ryakel/flight-budget:v1.2.3
```

---

## Portainer Integration

```bash
# Get webhook URL
Portainer → Stacks → flight-budget → Webhook

# Test webhook
curl -X POST "YOUR_WEBHOOK_URL"

# Add to GitHub
Repository → Settings → Secrets → PORTAINER_WEBHOOK_URL
```

---

## Monitoring & Logs

```bash
# GitHub Actions logs
Repository → Actions → Select run → Select job

# Container logs
docker logs -f flight-budget

# Nginx access logs
docker exec flight-budget tail -f /var/log/nginx/access.log

# Nginx error logs
docker exec flight-budget tail -f /var/log/nginx/error.log
```

---

## Quick Tests

### Test 1: Local Docker Build
```bash
cd /Users/rkelch/code/flight_budget
docker build -t test -f infrastructure/Dockerfile . && \
docker run -d -p 8181:80 --name test test && \
sleep 2 && \
curl -I http://localhost:8181 && \
docker stop test && docker rm test
```

### Test 2: Development Push
```bash
git checkout development
echo "test" >> README.md
git add README.md
git commit -m "test: dev build"
git push origin development
# Check: Actions → Docker Builder (should build 'dev' tag)
```

### Test 3: Semantic Version
```bash
git checkout main
echo "test" >> README.md
git add README.md
git commit -m "minor: test versioning"
git push origin main
# Check: Actions → Should create v0.1.0 tag + GitHub release
```

---

## Emergency Commands

### Stop Everything
```bash
# Stop all flight-budget containers
docker stop $(docker ps -q --filter ancestor=ryakel/flight-budget)

# Remove all flight-budget containers
docker rm $(docker ps -a -q --filter ancestor=ryakel/flight-budget)

# Remove images
docker rmi ryakel/flight-budget:latest
docker rmi ryakel/flight-budget:dev
```

### Clean Docker
```bash
# Remove unused images
docker image prune -a

# Remove all stopped containers
docker container prune

# Full cleanup
docker system prune -a --volumes
```

### Reset Git
```bash
# Discard local changes
git reset --hard HEAD

# Pull latest
git pull origin main

# Delete local branches
git branch -D development
git checkout -b development origin/development
```

---

## Resource Limits

| Resource | Limit | Configured In |
|----------|-------|---------------|
| Container CPU | 1.0 | docker-compose.yml |
| Container Memory | 512MB | docker-compose.yml |
| GitHub Actions | 2000 min/month | Free tier |
| Current usage | ~80 min/month | Well under limit |

---

## Support Resources

| Issue | Documentation |
|-------|---------------|
| First setup | [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) |
| Docker builds | [DOCKER_BUILD_SETUP.md](DOCKER_BUILD_SETUP.md) |
| Workflows | [GITHUB_ACTIONS.md](GITHUB_ACTIONS.md) |
| Dependencies | [DEPENDENCY_MANAGEMENT.md](DEPENDENCY_MANAGEMENT.md) |
| Deployment | [DEPLOYMENT.md](DEPLOYMENT.md) |

---

**Last Updated**: 2025-11-27
**Print this page**: Keep handy for quick reference!
