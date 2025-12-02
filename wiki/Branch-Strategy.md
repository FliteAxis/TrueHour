# Branch and Workflow Strategy

## Overview

The TrueHour uses a structured branching strategy with dedicated CI/CD workflows for each branch type.

---

## Branch Structure

### 1. `main` Branch (Production)
**Purpose**: Production-ready code

**Triggers Workflow**: [`.github/workflows/docker-build.yml`](../.github/workflows/docker-build.yml)

**On Push to `main`:**
1. ✅ Bumps semantic version based on commit message
2. ✅ Creates Git tag (e.g., `v1.2.3`)
3. ✅ Builds multi-platform Docker image
4. ✅ Pushes **2 tags** to Docker Hub:
   - `ryakel/flight-budget:latest`
   - `ryakel/flight-budget:v1.2.3`
5. ✅ Creates GitHub Release with changelog
6. ✅ Updates Docker Hub description
7. ✅ Triggers Portainer webhook (if configured)

**Commit Message Format**:
```bash
# Patch (0.0.x)
git commit -m "fix: resolve bug"
git commit -m "patch: update dependencies"

# Minor (0.x.0)
git commit -m "minor: add new feature"
git commit -m "feat: implement dark mode"

# Major (x.0.0)
git commit -m "major: breaking change"
git commit -m "breaking: redesign API"
```

---

### 2. `develop` Branch (Development/Testing)
**Purpose**: Active development and testing

**Triggers Workflow**: [`.github/workflows/docker-build-develop.yml`](../.github/workflows/docker-build-develop.yml)

**On Push to `develop`:**
1. ✅ Builds multi-platform Docker image
2. ✅ Pushes **1 tag** to Docker Hub:
   - `ryakel/flight-budget:develop`
3. ✅ No versioning (always overwrites `:develop` tag)
4. ✅ No GitHub releases
5. ✅ No Portainer webhook

**Use Cases**:
- Testing new features
- Integration testing
- Pre-production validation
- Continuous development work

---

### 3. Feature Branches (Development)
**Purpose**: Individual feature development

**Naming Convention**:
- `feature/feature-name`
- `bugfix/bug-description`
- `hotfix/urgent-fix`

**Workflow**: No automatic builds

**Process**:
1. Create branch from `develop`
2. Work on feature locally
3. Test locally
4. Create PR to `develop`
5. Merge to `develop` (triggers develop build)
6. Eventually merge `develop` → `main`

---

### 4. Manual Tags
**Purpose**: Specific version builds

**Triggers Workflow**: [`.github/workflows/docker-build.yml`](../.github/workflows/docker-build.yml)

**On Tag Push:**
```bash
git tag v1.5.0
git push origin v1.5.0
```

**Result**:
1. ✅ Builds multi-platform Docker image
2. ✅ Pushes **1 tag** to Docker Hub:
   - `ryakel/flight-budget:v1.5.0`
3. ✅ No automatic GitHub release (manual tags only)

---

## Workflow Comparison

| Feature | `main` Branch | `develop` Branch | Manual Tags |
|---------|--------------|------------------|-------------|
| **Workflow File** | `docker-build.yml` | `docker-build-develop.yml` | `docker-build.yml` |
| **Semantic Versioning** | ✅ Yes | ❌ No | ❌ No |
| **Docker Tags** | `latest` + `v1.2.3` | `develop` | `v1.5.0` |
| **GitHub Release** | ✅ Yes | ❌ No | ❌ No |
| **Docker Hub Sync** | ✅ Yes | ❌ No | ❌ No |
| **Portainer Webhook** | ✅ Yes (optional) | ❌ No | ❌ No |
| **Multi-Platform** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Build Cache** | ✅ Yes | ✅ Yes | ✅ Yes |
| **SBOM/Provenance** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Development Workflow

### Standard Development Flow

```
1. Create feature branch from develop
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature

2. Make changes and commit
   git add .
   git commit -m "feat: add my feature"

3. Push feature branch
   git push origin feature/my-feature

4. Create PR: feature/my-feature → develop
   Review and merge on GitHub

5. develop branch builds automatically
   Docker Hub: ryakel/flight-budget:develop

6. Test the :develop image
   docker pull ryakel/flight-budget:develop
   docker run -d -p 8181:80 ryakel/flight-budget:develop

7. When ready, merge develop → main
   Create PR: develop → main
   Review and merge

8. main branch builds with versioning
   Docker Hub: ryakel/flight-budget:latest
   Docker Hub: ryakel/flight-budget:v1.2.3
   GitHub Release: v1.2.3
```

---

## Production Deployment Flow

### Option 1: Direct to Main (Hotfix)

```bash
# For urgent fixes only
git checkout main
git pull origin main

# Make fix
vim app/js/app.js

# Commit with patch/fix prefix
git add .
git commit -m "fix: resolve critical bug"
git push origin main

# Triggers: build, version bump, release, deploy
```

### Option 2: Through Develop (Normal)

```bash
# Normal workflow
git checkout develop
git pull origin develop

# Make changes
vim app/js/app.js

# Test locally first
docker build -t test -f infrastructure/Dockerfile .
docker run -d -p 8181:80 test

# Commit to develop
git add .
git commit -m "feat: add new feature"
git push origin develop

# Test :develop image
docker pull ryakel/flight-budget:develop
# Test thoroughly

# When ready, merge to main
git checkout main
git pull origin main
git merge develop
git push origin main

# Or create PR on GitHub: develop → main
```

---

## Docker Hub Tag Strategy

### Tags Available

After several deployments, Docker Hub will have:

```
ryakel/flight-budget:latest      ← Latest main build
ryakel/flight-budget:develop     ← Latest develop build (always overwrites)
ryakel/flight-budget:v1.0.0      ← Semantic version from main
ryakel/flight-budget:v1.1.0      ← Semantic version from main
ryakel/flight-budget:v1.2.0      ← Semantic version from main
ryakel/flight-budget:v2.0.0      ← Semantic version from main
```

### When to Use Each Tag

**`:latest`** (Production)
```yaml
# docker-compose.yml
image: ryakel/flight-budget:latest
```
- Always points to latest main build
- Auto-updates when you pull
- Use in production with Portainer webhooks

**`:develop`** (Testing)
```yaml
# docker-compose.yml
image: ryakel/flight-budget:develop
```
- Latest development build
- Always overwrites (not versioned)
- Use for testing new features
- Do NOT use in production

**`:v1.2.3`** (Specific Version)
```yaml
# docker-compose.yml
image: ryakel/flight-budget:v1.2.3
```
- Pinned version (never changes)
- Use for rollback
- Use when you need stability
- Use for debugging version-specific issues

---

## Portainer Integration

### Using `:latest` Tag (Recommended)

**Portainer Stack Configuration**:
```yaml
services:
  flight-budget:
    image: ryakel/flight-budget:latest
    pull_policy: always  # Important!
```

**Webhook Behavior**:
1. Push to `main` branch
2. GitHub Actions builds new image
3. Tags as `:latest`
4. Triggers Portainer webhook
5. Portainer pulls `:latest` (new version)
6. Restarts container
7. ✅ Deployed!

### Using `:develop` Tag (Testing)

**Portainer Stack Configuration**:
```yaml
services:
  flight-budget:
    image: ryakel/flight-budget:develop
    pull_policy: always
```

**Manual Update** (no webhook):
1. Push to `develop` branch
2. GitHub Actions builds new image
3. Tags as `:develop`
4. Manually update Portainer stack
5. ✅ Deployed!

---

## Branch Protection Rules (Recommended)

### For `main` Branch

1. **Go to**: Repository → Settings → Branches → Add rule
2. **Branch name pattern**: `main`
3. **Enable**:
   - ✅ Require pull request reviews (1 approval)
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Require conversation resolution
   - ✅ Include administrators (optional)

### For `develop` Branch

1. **Branch name pattern**: `develop`
2. **Enable**:
   - ✅ Require branches to be up to date
   - ⚠️ No PR required (allows direct push for development)

---

## Rollback Strategy

### Quick Rollback to Previous Version

```bash
# Check available versions
docker pull ryakel/flight-budget --all-tags

# Update Portainer stack to specific version
# Edit docker-compose.yml:
image: ryakel/flight-budget:v1.1.0  # Previous working version

# Update stack in Portainer
# Container will restart with old version
```

### Emergency Rollback

```bash
# If latest is broken, immediately revert
git revert HEAD
git push origin main

# Or manually tag and push old commit
git tag v1.2.4 <old-commit-sha>
git push origin v1.2.4

# Update Portainer to use v1.2.4
```

---

## Monitoring Builds

### GitHub Actions

**View all workflows**:
```
Repository → Actions
```

**Filter by workflow**:
- Docker Builder (main/tags)
- Docker Builder - Develop

**Check build status**:
- ✅ Green checkmark = Success
- ❌ Red X = Failed
- 🟡 Yellow circle = In progress

### Docker Hub

**View all tags**:
```
https://hub.docker.com/r/ryakel/flight-budget/tags
```

**Check platforms**:
Each tag should show:
- `linux/amd64`
- `linux/arm64`

### GitHub Releases

**View releases**:
```
Repository → Releases
```

Only `main` branch pushes create releases.

---

## Troubleshooting

### Build Failed on `main`

**Check**:
1. View workflow logs: Actions → Failed run
2. Common issues:
   - Syntax error in code
   - Docker build error
   - Missing secrets
   - Network timeout

**Fix**:
1. Fix the issue locally
2. Test build: `docker build -f infrastructure/Dockerfile .`
3. Commit fix: `git commit -m "fix: resolve build error"`
4. Push: `git push origin main`

### `develop` Build Not Triggering

**Check**:
1. Are you pushing to `develop` branch?
2. Did you modify files in `app/` or `infrastructure/`?
3. Check Actions tab for workflow runs

**Manual trigger**:
```
Actions → Docker Builder - Develop → Run workflow
```

### Wrong Version Number

**Cause**: Incorrect commit message prefix

**Examples**:
```bash
# ❌ Wrong (will default to patch)
git commit -m "add new feature"

# ✅ Correct (will bump minor version)
git commit -m "minor: add new feature"
```

**Fix**: Can't change after push, but next commit will correct

---

## Best Practices

### Commit Messages

✅ **Good**:
```bash
git commit -m "fix: resolve CSV upload bug"
git commit -m "minor: add aircraft comparison"
git commit -m "major: redesign UI completely"
git commit -m "patch: update dependencies"
```

❌ **Bad**:
```bash
git commit -m "updates"
git commit -m "WIP"
git commit -m "changes"
```

### Testing Before `main`

Always test on `develop` first:
```bash
# 1. Push to develop
git push origin develop

# 2. Pull and test :develop image
docker pull ryakel/flight-budget:develop
docker run -d -p 8181:80 ryakel/flight-budget:develop
# Test thoroughly!

# 3. If good, merge to main
git checkout main
git merge develop
git push origin main
```

### Version Strategy

- **Patch (0.0.x)**: Bug fixes, minor updates, dependency updates
- **Minor (0.x.0)**: New features, non-breaking changes
- **Major (x.0.0)**: Breaking changes, major rewrites, API changes

---

## Summary

### Quick Reference

| Action | Branch | Docker Tag | Versioned | Released |
|--------|--------|------------|-----------|----------|
| Development work | `develop` | `:develop` | ❌ | ❌ |
| Production deploy | `main` | `:latest` + `:v1.2.3` | ✅ | ✅ |
| Manual version | Tag `v1.5.0` | `:v1.5.0` | ❌ | ❌ |
| Feature branch | `feature/*` | None | ❌ | ❌ |

### Workflow Files

1. **Main/Tags**: [`.github/workflows/docker-build.yml`](../.github/workflows/docker-build.yml)
2. **Develop**: [`.github/workflows/docker-build-develop.yml`](../.github/workflows/docker-build-develop.yml)
3. **Dependencies**: [`.github/workflows/update-dependencies.yml`](../.github/workflows/update-dependencies.yml)
4. **Stale Issues**: [`.github/workflows/stale.yml`](../.github/workflows/stale.yml)

---

**Last Updated**: 2025-11-27
**Status**: Active
**Workflows**: 4 total (2 Docker build, 1 dependencies, 1 stale)
