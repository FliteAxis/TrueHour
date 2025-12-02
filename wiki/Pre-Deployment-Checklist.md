# Pre-Deployment Checklist

## Overview

Complete this checklist before testing the TrueHour deployment for the first time. This ensures all configurations, secrets, and integrations are properly set up.

---

## 🔧 Local Repository Setup

### ✅ Git Configuration

- [ ] **Initialize Git repository** (if not already done)
  ```bash
  cd /Users/rkelch/code/flight_budget
  git init
  ```

- [ ] **Configure Git user** (if not already set)
  ```bash
  git config user.name "Your Name"
  git config user.email "your.email@example.com"
  ```

- [ ] **Review .gitignore**
  ```bash
  cat .gitignore
  # Verify it excludes: .env, .DS_Store, etc.
  ```

- [ ] **Create develop branch**
  ```bash
  git checkout -b develop
  ```

---

## 📦 GitHub Repository Setup

### ✅ Repository Creation

- [ ] **Create GitHub repository**
  - Go to: https://github.com/new
  - Repository name: `flight-budget`
  - Visibility: Public or Private (your choice)
  - **Do NOT initialize** with README, .gitignore, or license
  - Click "Create repository"

- [ ] **Add remote origin**
  ```bash
  git remote add origin https://github.com/ryakel/flight-budget.git
  ```

- [ ] **Verify remote**
  ```bash
  git remote -v
  ```

### ✅ Initial Commit and Push

- [ ] **Stage all files**
  ```bash
  git add .
  ```

- [ ] **Create initial commit**
  ```bash
  git commit -m "feat: initial commit with containerized app and CI/CD workflows"
  ```

- [ ] **Push main branch**
  ```bash
  git push -u origin main
  ```

- [ ] **Push develop branch**
  ```bash
  git checkout -b develop
  git push -u origin develop
  ```

---

## 🔐 GitHub Secrets Configuration

### ✅ Docker Hub Secrets

#### Step 1: Create Docker Hub Access Token

- [ ] **Login to Docker Hub**
  - Go to: https://hub.docker.com/
  - Sign in with username: `ryakel`

- [ ] **Navigate to Security Settings**
  - Click profile icon (top right)
  - Select "Account Settings"
  - Click "Security" in left sidebar

- [ ] **Generate New Access Token**
  - Click "New Access Token"
  - Description: `GitHub Actions - flight-budget`
  - Access permissions: **Read, Write, Delete**
  - Click "Generate"
  - **COPY THE TOKEN** (you'll only see it once!)

#### Step 2: Add Secrets to GitHub

- [ ] **Navigate to GitHub repository settings**
  - Go to: https://github.com/ryakel/flight-budget
  - Click "Settings" tab
  - Click "Secrets and variables" → "Actions" (left sidebar)

- [ ] **Add DOCKER_USERNAME secret**
  - Click "New repository secret"
  - Name: `DOCKER_USERNAME`
  - Value: `ryakel`
  - Click "Add secret"

- [ ] **Add DOCKER_TOKEN secret**
  - Click "New repository secret"
  - Name: `DOCKER_TOKEN`
  - Value: [paste the token you copied]
  - Click "Add secret"

- [ ] **Verify secrets added**
  - You should see both secrets listed
  - Values will be hidden (shows as `***`)

### ✅ Portainer Webhook Secret (Optional)

**Note**: Only complete if you're using Portainer automated deployments

- [ ] **Get Portainer webhook URL**
  - Login to your Portainer instance
  - Go to "Stacks" or "Containers"
  - Find or create webhook for flight-budget
  - Copy the webhook URL

- [ ] **Add PORTAINER_WEBHOOK_URL secret**
  - In GitHub: Settings → Secrets and variables → Actions
  - Click "New repository secret"
  - Name: `PORTAINER_WEBHOOK_URL`
  - Value: [paste webhook URL]
  - Click "Add secret"

---

## 🐳 Docker Hub Setup

### ✅ Repository Creation

- [ ] **Login to Docker Hub**
  - Go to: https://hub.docker.com/
  - Sign in with username: `ryakel`

- [ ] **Create repository** (if it doesn't exist)
  - Click "Repositories" → "Create Repository"
  - Name: `flight-budget`
  - Visibility: Public or Private
  - Description: "TrueHour by FliteAxis - Web app for estimating flight training costs"
  - Click "Create"

- [ ] **Verify repository exists**
  - Should be accessible at: https://hub.docker.com/r/ryakel/flight-budget

### ✅ Repository Settings

- [ ] **Configure description** (optional - will be auto-synced)
  - Description will be automatically updated from README.md by GitHub Actions
  - No manual action needed

---

## 🔄 GitHub Actions Configuration

### ✅ Enable GitHub Actions

- [ ] **Enable Actions for repository**
  - Go to: https://github.com/ryakel/flight-budget
  - Click "Actions" tab
  - If prompted, click "I understand my workflows, go ahead and enable them"

- [ ] **Verify workflows are detected**
  - Should see 3 workflows:
    - Docker Builder
    - Update CDN Dependencies
    - Close inactive issues

### ✅ Workflow Permissions

- [ ] **Configure workflow permissions**
  - Go to: Repository Settings → Actions → General
  - Scroll to "Workflow permissions"
  - Select: **Read and write permissions**
  - Check: **Allow GitHub Actions to create and approve pull requests**
  - Click "Save"

---

## 📋 Renovate Bot Setup (Optional but Recommended)

### ✅ Install Renovate App

- [ ] **Install Renovate GitHub App**
  - Go to: https://github.com/apps/renovate
  - Click "Install" or "Configure"
  - Select: **Only select repositories**
  - Choose: `ryakel/flight-budget`
  - Grant permissions (read/write access)
  - Click "Install"

- [ ] **Merge onboarding PR**
  - Renovate will create an initial "Configure Renovate" PR
  - Review the PR
  - Merge it to activate Renovate

- [ ] **Verify Renovate is active**
  - Go to: https://app.renovatebot.com/
  - Check dashboard for your repository

---

## 🔍 Dependabot Configuration

### ✅ Enable Dependabot

- [ ] **Verify Dependabot is enabled**
  - Go to: Repository Settings → Code security and analysis
  - Enable: **Dependabot alerts**
  - Enable: **Dependabot security updates**

- [ ] **Check Dependabot status**
  - Dependabot should automatically detect `.github/dependabot.yml`
  - No additional action needed

---

## 📝 Pre-Flight Verification

### ✅ File Structure Check

- [ ] **Verify app/ folder structure**
  ```bash
  ls -la app/
  # Should contain: index.html, css/, js/, libs/, data/
  ```

- [ ] **Verify infrastructure/ folder**
  ```bash
  ls -la infrastructure/
  # Should contain: Dockerfile, docker-compose.yml, nginx/
  ```

- [ ] **Verify GitHub workflows**
  ```bash
  ls -la .github/workflows/
  # Should contain: docker-build.yml, update-dependencies.yml, stale.yml
  ```

- [ ] **Verify dependencies.json**
  ```bash
  cat dependencies.json
  # Should contain versions for papaparse, chartjs, html2pdf
  ```

### ✅ Configuration Files Check

- [ ] **Verify .dockerignore**
  ```bash
  cat .dockerignore
  # Should exclude: docs/, infrastructure/, .github/
  ```

- [ ] **Verify Dockerfile paths**
  ```bash
  cat infrastructure/Dockerfile
  # Verify COPY commands reference correct paths
  ```

- [ ] **Verify docker-compose.yml**
  ```bash
  cat infrastructure/docker-compose.yml
  # Verify image name: ryakel/flight-budget:latest
  ```

---

## 🧪 Local Testing (Before Push)

### ✅ Test Docker Build Locally

**Note**: You're building on Mac ARM. For multi-platform support, see [LOCAL_MULTI_ARCH_BUILD.md](LOCAL_MULTI_ARCH_BUILD.md)

- [ ] **Setup buildx (one-time, if not done)**
  ```bash
  docker buildx create --name multiarch --driver docker-container --use
  docker buildx inspect multiarch --bootstrap
  ```

- [ ] **Build Docker image (native ARM64 for local testing)**
  ```bash
  cd /Users/rkelch/code/flight_budget
  docker buildx build \
    --platform linux/arm64 \
    -t ryakel/flight-budget:test \
    -f infrastructure/Dockerfile \
    --load \
    .
  ```

- [ ] **Verify build succeeded**
  - Check for "Successfully built" message
  - No errors in build output

- [ ] **Check image size**
  ```bash
  docker images | grep flight-budget
  # Should be ~30-40MB for nginx:alpine base
  ```

- [ ] **Test run container**
  ```bash
  docker run -d -p 8181:80 --name flight-budget-test ryakel/flight-budget:test
  ```

- [ ] **Test application access**
  - Open browser: http://localhost:8181
  - Verify page loads
  - Test core functionality:
    - [ ] CSV upload works
    - [ ] Aircraft budget calculations work
    - [ ] Charts render
    - [ ] PDF export works
    - [ ] Save/load configurations work

- [ ] **Check container logs**
  ```bash
  docker logs flight-budget-test
  # Should show nginx access logs, no errors
  ```

- [ ] **Stop and remove test container**
  ```bash
  docker stop flight-budget-test
  docker rm flight-budget-test
  docker rmi ryakel/flight-budget:test
  ```

### ✅ Test Docker Compose

- [ ] **Test docker-compose locally**
  ```bash
  cd infrastructure
  docker-compose up -d
  ```

- [ ] **Verify container running**
  ```bash
  docker-compose ps
  # Should show flight-budget container as "Up"
  ```

- [ ] **Test access**
  - Open: http://localhost:8181
  - Verify functionality

- [ ] **Check health check**
  ```bash
  docker-compose ps
  # Status should show "(healthy)"
  ```

- [ ] **Stop compose stack**
  ```bash
  docker-compose down
  ```

---

## 🚀 First Deployment Test

### ✅ Test GitHub Actions Workflows

#### Step 1: Test Development Build

- [ ] **Push to develop branch**
  ```bash
  git checkout develop
  git push origin develop
  ```

- [ ] **Monitor GitHub Actions**
  - Go to: Repository → Actions
  - Watch "Docker Builder" workflow run
  - Verify it completes successfully

- [ ] **Check Docker Hub**
  - Go to: https://hub.docker.com/r/ryakel/flight-budget/tags
  - Verify `dev` tag appears
  - Check platforms: amd64, arm64

- [ ] **Pull and test dev image**
  ```bash
  docker pull ryakel/flight-budget:dev
  docker run -d -p 8181:80 ryakel/flight-budget:dev
  # Test in browser, then cleanup
  docker stop $(docker ps -q --filter ancestor=ryakel/flight-budget:dev)
  ```

#### Step 2: Test Main Build with Versioning

- [ ] **Create test commit on main**
  ```bash
  git checkout main
  echo "# Test" >> README.md
  git add README.md
  git commit -m "feat: test semantic versioning workflow"
  git push origin main
  ```

- [ ] **Monitor GitHub Actions**
  - Watch workflow run
  - Verify all steps complete:
    - [ ] Version bumped
    - [ ] Tag created (e.g., v0.0.1)
    - [ ] Multi-platform build succeeds
    - [ ] Images pushed to Docker Hub
    - [ ] GitHub release created
    - [ ] Docker Hub description synced
    - [ ] Portainer webhook triggered (if configured)

- [ ] **Check GitHub Releases**
  - Go to: Repository → Releases
  - Verify new release exists with:
    - Semantic version tag (e.g., v0.0.1)
    - Changelog from commit
    - No errors

- [ ] **Check Docker Hub tags**
  - Verify TWO tags created:
    - `latest`
    - Version tag (e.g., `v0.0.1`)
  - Both should show 3 platforms

- [ ] **Check Docker Hub description**
  - Verify description matches README.md
  - Should be auto-synced

- [ ] **Pull and test latest image**
  ```bash
  docker pull ryakel/flight-budget:latest
  docker run -d -p 8181:80 ryakel/flight-budget:latest
  # Test in browser
  ```

#### Step 3: Test Dependency Update Workflow

- [ ] **Manually trigger workflow**
  - Go to: Actions → Update CDN Dependencies
  - Click "Run workflow"
  - Select branch: main
  - Click "Run workflow"

- [ ] **Monitor execution**
  - Watch workflow run
  - Should download libraries
  - Check if PR created (only if versions changed)

- [ ] **Verify library files**
  ```bash
  ls -lh app/libs/
  # Verify files exist and have reasonable sizes
  ```

- [ ] **Check VERSIONS.txt**
  ```bash
  cat app/libs/VERSIONS.txt
  # Should list all library versions
  ```

---

## 🏥 Health Checks

### ✅ Post-Deployment Verification

- [ ] **Verify all workflows ran successfully**
  - Go to: Repository → Actions
  - All recent runs should show green checkmarks

- [ ] **Check GitHub repository**
  - [ ] All files present
  - [ ] Branches exist (main, develop)
  - [ ] Tags created
  - [ ] Releases published

- [ ] **Check Docker Hub**
  - [ ] Repository exists
  - [ ] Tags present (latest, dev, version)
  - [ ] Multi-platform builds show all 3 architectures
  - [ ] Description synced

- [ ] **Check secrets are working**
  - If workflows succeeded, secrets are configured correctly
  - No "invalid credentials" errors in logs

---

## 📊 Monitoring Setup

### ✅ Configure Notifications

- [ ] **GitHub email notifications**
  - Go to: https://github.com/settings/notifications
  - Ensure "Actions" notifications enabled
  - You'll receive emails on workflow failures

- [ ] **Watch repository**
  - Go to: Repository → Watch (top right)
  - Select notification preferences

- [ ] **Enable security alerts**
  - Go to: Repository Settings → Code security and analysis
  - Enable all security features:
    - [ ] Dependency graph
    - [ ] Dependabot alerts
    - [ ] Dependabot security updates

---

## 🐛 Troubleshooting Resources

### ✅ Documentation Review

- [ ] **Read Docker Build Setup guide**
  - File: [docs/DOCKER_BUILD_SETUP.md](DOCKER_BUILD_SETUP.md)
  - Contains secrets setup, troubleshooting

- [ ] **Read GitHub Actions guide**
  - File: [docs/GITHUB_ACTIONS.md](GITHUB_ACTIONS.md)
  - Contains workflow details, monitoring

- [ ] **Read Deployment guide**
  - File: [docs/DEPLOYMENT.md](DEPLOYMENT.md)
  - Contains Portainer setup

### ✅ Common Issues

- [ ] **Know how to check workflow logs**
  ```
  Repository → Actions → Select workflow run → Click job → View step logs
  ```

- [ ] **Know how to re-run failed workflows**
  ```
  Actions → Select failed run → "Re-run all jobs"
  ```

- [ ] **Know how to check Docker Hub push issues**
  ```
  Check: Actions logs for "Login to Docker Hub" step
  Verify: DOCKER_USERNAME and DOCKER_TOKEN secrets exist
  ```

---

## ✅ Final Checklist Summary

### Must Complete Before First Test

**Local:**
- [ ] Git repository initialized
- [ ] All files committed
- [ ] Local Docker build test passed
- [ ] Application works in browser

**GitHub:**
- [ ] Repository created
- [ ] Code pushed (main + develop branches)
- [ ] Secrets added (DOCKER_USERNAME, DOCKER_TOKEN)
- [ ] Workflow permissions configured
- [ ] GitHub Actions enabled

**Docker Hub:**
- [ ] Repository created (ryakel/flight-budget)
- [ ] Access token generated
- [ ] Token added to GitHub secrets

**Optional but Recommended:**
- [ ] Renovate Bot installed
- [ ] Portainer webhook configured
- [ ] Email notifications enabled

---

## 🎉 Ready to Deploy!

Once all checkboxes are marked, you're ready for first deployment:

1. **Push to develop** → Test dev build
2. **Push to main** → Test production build with versioning
3. **Monitor workflows** → Verify all steps complete
4. **Pull and test images** → Confirm functionality
5. **Deploy to Portainer** → Production deployment

---

## 📞 Need Help?

If you encounter issues:

1. **Check workflow logs**: Actions tab → Failed run → View logs
2. **Review documentation**: [docs/GITHUB_ACTIONS.md](GITHUB_ACTIONS.md)
3. **Common fixes**: [docs/DOCKER_BUILD_SETUP.md](DOCKER_BUILD_SETUP.md#troubleshooting)
4. **Create issue**: If problem persists

---

**Created**: 2025-11-27
**Status**: Pre-deployment checklist
**Estimated time**: 30-45 minutes to complete
**Next step**: Start with "Local Repository Setup"
