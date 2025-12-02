# Develop Branch Workflow Added

## Summary

A dedicated CI/CD workflow has been created for the `develop` branch that builds and tags Docker images as `:develop` for testing purposes.

---

## What Changed

### 1. New Workflow Created
**File**: [`.github/workflows/docker-build-develop.yml`](../.github/workflows/docker-build-develop.yml)

**Purpose**: Build and publish development images for testing

**Triggers**:
- Push to `develop` branch
- Changes to `app/**` or `infrastructure/**`
- Manual workflow dispatch

**Result**: Pushes `ryakel/flight-budget:develop` to Docker Hub

---

### 2. Main Workflow Simplified
**File**: [`.github/workflows/docker-build.yml`](../.github/workflows/docker-build.yml)

**Changes**:
- ❌ Removed `development` branch trigger
- ❌ Removed dev tag logic
- ✅ Now only handles `main` branch and manual tags
- ✅ Cleaner separation of concerns

---

## Branch Strategy

### `main` Branch → Production
**Workflow**: `docker-build.yml`

**Builds**:
- `ryakel/flight-budget:latest`
- `ryakel/flight-budget:v1.2.3` (semantic version)

**Features**:
- ✅ Semantic versioning
- ✅ GitHub releases
- ✅ Docker Hub description sync
- ✅ Portainer webhook

---

### `develop` Branch → Testing
**Workflow**: `docker-build-develop.yml`

**Builds**:
- `ryakel/flight-budget:develop` (always overwrites)

**Features**:
- ✅ Multi-platform builds
- ❌ No versioning
- ❌ No releases
- ❌ No webhook

---

## Usage

### Development Workflow

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Make changes
vim app/js/app.js

# 3. Commit and push to feature branch
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature

# 4. Create PR to develop (or push directly)
git checkout develop
git merge feature/my-feature
git push origin develop

# 5. GitHub Actions builds :develop tag
# View: https://github.com/ryakel/flight-budget/actions

# 6. Test the develop image
docker pull ryakel/flight-budget:develop
docker run -d -p 8181:80 ryakel/flight-budget:develop
open http://localhost:8181

# 7. When ready, merge to main
git checkout main
git merge develop
git commit -m "minor: release new features"
git push origin main

# 8. GitHub Actions builds :latest + :v1.2.3
```

---

## Docker Hub Tags

After using both branches:

```
ryakel/flight-budget:latest      ← Latest main build (production)
ryakel/flight-budget:develop     ← Latest develop build (testing)
ryakel/flight-budget:v1.0.0      ← Semantic versions from main
ryakel/flight-budget:v1.1.0
ryakel/flight-budget:v1.2.0
```

---

## Testing with `:develop` Tag

### Local Testing

```bash
# Pull latest develop image
docker pull ryakel/flight-budget:develop

# Run container
docker run -d -p 8181:80 --name test ryakel/flight-budget:develop

# Test application
open http://localhost:8181

# Check logs
docker logs test

# Cleanup
docker stop test && docker rm test
```

### Portainer Testing (Optional)

Create a separate test stack:

```yaml
# docker-compose-test.yml
version: '3.8'

services:
  flight-budget-test:
    image: ryakel/flight-budget:develop
    container_name: flight-budget-test
    ports:
      - "8182:80"  # Different port
    pull_policy: always
    restart: unless-stopped
```

---

## Workflow Comparison

| Feature | Main Workflow | Develop Workflow |
|---------|---------------|------------------|
| **File** | `docker-build.yml` | `docker-build-develop.yml` |
| **Branch** | `main` | `develop` |
| **Tag** | `latest` + `v1.2.3` | `develop` |
| **Versioning** | ✅ Semantic | ❌ None |
| **GitHub Release** | ✅ Yes | ❌ No |
| **Portainer Webhook** | ✅ Yes | ❌ No |
| **Multi-Platform** | ✅ Yes | ✅ Yes |
| **Build Cache** | ✅ Yes | ✅ Yes |
| **Purpose** | Production | Testing |

---

## Benefits

### 1. Separation of Concerns
- `main` = Production only
- `develop` = Testing only
- Clearer workflow logic

### 2. Always-Available Test Image
- `:develop` tag always has latest development build
- Easy to test before merging to main
- No need to manually tag test versions

### 3. No Production Impact
- Development builds don't trigger production workflows
- No accidental releases from development work
- No Portainer deployments until ready

### 4. Faster Iteration
- Push to develop → test immediately
- No need to create tags or releases
- Continuous integration for development

---

## Migration Notes

### Old Workflow (Before)
```yaml
# Single workflow for everything
on:
  push:
    branches:
      - main
      - development  # ← Both branches in one workflow
```

**Issues**:
- Complex conditional logic
- `dev` vs `latest` tag confusion
- Mixed production and development concerns

### New Workflow (After)
```yaml
# Main workflow (production)
on:
  push:
    branches:
      - main  # ← Only production

# Separate develop workflow
on:
  push:
    branches:
      - develop  # ← Only testing
```

**Benefits**:
- Simpler logic
- Clear separation
- Easier to maintain

---

## Troubleshooting

### Develop Build Not Triggering

**Check**:
1. Are you pushing to `develop` branch (not `development`)?
2. Did you modify files in `app/` or `infrastructure/`?
3. Is the workflow enabled?

**Verify**:
```bash
# Check current branch
git branch --show-current

# Check remote branches
git branch -r | grep develop

# Manually trigger
# GitHub → Actions → Docker Builder - Develop → Run workflow
```

### Wrong Docker Tag

**Issue**: Image tagged as `:dev` instead of `:develop`

**Solution**: Check workflow file ensures tag is `develop`:
```yaml
tags: ryakel/flight-budget:develop
```

### Old `development` Branch

If you have an old `development` branch:

```bash
# Rename development → develop locally
git branch -m development develop

# Delete old remote branch
git push origin --delete development

# Push new develop branch
git push -u origin develop
```

---

## Documentation Updates

Updated files:
1. ✅ [BRANCH_STRATEGY.md](BRANCH_STRATEGY.md) - Complete branch workflow guide
2. ✅ [GITHUB_ACTIONS.md](GITHUB_ACTIONS.md) - Updated workflow list
3. ✅ [PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md) - Updated branch names
4. ✅ [README.md](../README.md) - Added branch strategy link

---

## Next Steps

### 1. Create `develop` Branch

```bash
cd /Users/rkelch/code/flight_budget
git checkout -b develop
git push -u origin develop
```

### 2. Test Develop Workflow

```bash
# Make a test change
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify develop workflow"
git push origin develop

# Watch GitHub Actions
# Should build: ryakel/flight-budget:develop
```

### 3. Verify Docker Hub

```bash
# Check if :develop tag appears
docker pull ryakel/flight-budget:develop

# Should show 3 platforms:
# - linux/amd64
# - linux/arm64
```

### 4. Update Local Workflow

Going forward:
1. Work on `develop` branch for new features
2. Test using `:develop` image
3. When ready, merge to `main` for production release

---

## Example: Complete Development Cycle

```bash
# Day 1: Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/export-pdf
# ... work on feature ...
git commit -m "feat: add PDF export"
git push origin feature/export-pdf

# Day 2: Merge to develop
git checkout develop
git merge feature/export-pdf
git push origin develop
# → Builds :develop image automatically

# Day 3: Test
docker pull ryakel/flight-budget:develop
docker run -d -p 8181:80 ryakel/flight-budget:develop
# ... test thoroughly ...

# Day 4: Ship to production
git checkout main
git pull origin main
git merge develop
git commit -m "minor: add PDF export feature"
git push origin main
# → Builds :latest + :v1.2.0
# → Creates GitHub Release
# → Triggers Portainer webhook
# → Production deployed! 🎉
```

---

## Summary

### What Was Added
- ✅ Dedicated `develop` branch workflow
- ✅ Builds `ryakel/flight-budget:develop` tag
- ✅ Multi-platform support (amd64, arm64)
- ✅ No versioning (always overwrites)
- ✅ Separate from production workflow

### What Changed
- ✅ Main workflow simplified (no more development branch)
- ✅ Cleaner separation between testing and production
- ✅ Documentation updated

### Status
- ✅ Ready to use
- ✅ No secrets needed (uses same DOCKER_USERNAME/TOKEN)
- ✅ Works immediately after creating `develop` branch

---

**Created**: 2025-11-27
**Status**: Active
**Branch**: `develop`
**Docker Tag**: `ryakel/flight-budget:develop`
**Workflow**: [`.github/workflows/docker-build-develop.yml`](../.github/workflows/docker-build-develop.yml)
