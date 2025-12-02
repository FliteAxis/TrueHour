# Docker Build & Versioning Setup

## Overview

The updated Docker build workflow implements semantic versioning, multi-platform builds, and automated releases - matching your stream-harvestarr repository strategy.

---

## Key Features

### ✅ Semantic Versioning
- Automatic version bumping based on commit messages
- GitHub releases with changelogs
- Tags: `latest`, `dev`, and semantic versions (e.g., `v1.2.3`)

### ✅ Multi-Platform Support
- `linux/amd64` (x86_64 - most servers)
- `linux/arm64` (ARM 64-bit - Apple Silicon, Raspberry Pi 4)

### ✅ Branch Strategy
- **main**: Builds `latest` + semantic version tags
- **development**: Builds `dev` tag
- **tags**: Builds specific version tags

### ✅ Automated Features
- Build cache management (purges old caches)
- SBOM (Software Bill of Materials) generation
- Provenance attestation for security
- Docker Hub description sync
- GitHub release creation
- Portainer webhook trigger

---

## Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### 1. DOCKER_USERNAME
**Value**: `ryakel`
**Purpose**: Your Docker Hub username

### 2. DOCKER_TOKEN
**Value**: Your Docker Hub access token (NOT password!)
**Purpose**: Authentication to push images

### 3. PORTAINER_WEBHOOK_URL (Optional)
**Value**: Your Portainer webhook URL
**Purpose**: Trigger auto-deployment after build

---

## How to Set Up Secrets

### Step 1: Create Docker Hub Access Token

1. **Login to Docker Hub**: https://hub.docker.com/
2. **Go to Account Settings** → **Security**
3. **Click "New Access Token"**
   - Description: `GitHub Actions - flight-budget`
   - Access permissions: `Read, Write, Delete`
4. **Copy the token** (you'll only see it once!)

### Step 2: Add Secrets to GitHub

1. **Go to your repository**: https://github.com/ryakel/flight-budget
2. **Click Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**

Add these three secrets:

```
Name: DOCKER_USERNAME
Value: ryakel
```

```
Name: DOCKER_TOKEN
Value: [paste your Docker Hub token]
```

```
Name: PORTAINER_WEBHOOK_URL
Value: [your Portainer webhook URL - optional]
```

---

## Semantic Versioning with Commit Messages

The workflow automatically bumps versions based on commit message prefixes:

### Version Bump Rules

| Commit Message | Version Change | Example |
|----------------|----------------|---------|
| `fix: ...` or `patch: ...` | Patch (0.0.x) | v1.2.3 → v1.2.4 |
| `minor: ...` | Minor (0.x.0) | v1.2.3 → v1.3.0 |
| `major: ...` or `breaking: ...` | Major (x.0.0) | v1.2.3 → v2.0.0 |
| Any other message | Patch (0.0.x) | v1.2.3 → v1.2.4 |

### Examples

```bash
# Patch release (v1.2.3 → v1.2.4)
git commit -m "fix: resolve CSV upload bug"
git commit -m "patch: update dependencies"
git commit -m "chore: improve logging"

# Minor release (v1.2.3 → v1.3.0)
git commit -m "minor: add aircraft comparison feature"
git commit -m "feat: implement dark mode"

# Major release (v1.2.3 → v2.0.0)
git commit -m "major: redesign UI with new framework"
git commit -m "breaking: remove legacy API endpoints"
```

---

## Workflow Behavior

### Push to `main` Branch

```
1. Code pushed to main
   ↓
2. Determine version bump from commit message
   ↓
3. Create new Git tag (e.g., v1.2.4)
   ↓
4. Build Docker image for multiple platforms
   ↓
5. Push to Docker Hub with TWO tags:
   - ryakel/flight-budget:latest
   - ryakel/flight-budget:v1.2.4
   ↓
6. Create GitHub Release with changelog
   ↓
7. Update Docker Hub description
   ↓
8. Trigger Portainer webhook (if configured)
   ↓
9. Done! ✅
```

### Push to `development` Branch

```
1. Code pushed to development
   ↓
2. Build Docker image for multiple platforms
   ↓
3. Push to Docker Hub with tag:
   - ryakel/flight-budget:dev
   ↓
4. Done! ✅
```

### Push a Git Tag

```
1. Tag pushed (e.g., git tag v1.5.0 && git push --tags)
   ↓
2. Build Docker image for multiple platforms
   ↓
3. Push to Docker Hub with tag:
   - ryakel/flight-budget:v1.5.0
   ↓
4. Done! ✅
```

---

## Docker Hub Tags Structure

After several commits, your Docker Hub will have:

```
ryakel/flight-budget:latest      ← Always points to latest main build
ryakel/flight-budget:dev         ← Latest development build
ryakel/flight-budget:v1.0.0      ← Semantic version tags
ryakel/flight-budget:v1.1.0
ryakel/flight-budget:v1.1.1
ryakel/flight-budget:v1.2.0
ryakel/flight-budget:v2.0.0
```

---

## Using Specific Versions

### In docker-compose.yml

```yaml
services:
  flight-budget:
    # Use latest (auto-updates)
    image: ryakel/flight-budget:latest

    # OR use specific version (pinned)
    image: ryakel/flight-budget:v1.2.4

    # OR use dev (testing)
    image: ryakel/flight-budget:dev
```

### In Portainer

1. Go to **Stacks** → **flight-budget**
2. **Edit stack**
3. Change image tag in `docker-compose.yml`
4. **Update the stack**

---

## Build Cache Management

The workflow includes automatic cache purging:

```yaml
- name: Purge Build Cache
  uses: MyAlbum/purge-cache@v2
  with:
    max-age: 5400  # Keep caches from last 90 minutes
```

**Benefits:**
- Prevents cache bloat
- Saves GitHub Actions storage
- Keeps builds fast

---

## Multi-Platform Builds

The workflow builds for multiple architectures:

```yaml
platforms: linux/arm64,linux/amd64
```

**What this means:**
- ✅ Works on Intel/AMD servers (amd64)
- ✅ Works on ARM servers (arm64)
- ✅ Works on Raspberry Pi 3/4 (arm64)
- ✅ Works on Apple Silicon servers (arm64)

**Build time:** ~5-10 minutes (GitHub Actions builds all platforms in parallel)

---

## SBOM & Provenance

The workflow generates security metadata:

```yaml
sbom: true               # Software Bill of Materials
provenance: mode=max     # Build provenance attestation
```

**Benefits:**
- Track all dependencies in your image
- Verify image authenticity
- Meet security compliance requirements
- View with `docker buildx imagetools inspect`

---

## GitHub Releases

Every push to `main` creates a GitHub Release:

**Release includes:**
- Semantic version tag (e.g., v1.2.4)
- Automated changelog from commits
- Link to Docker Hub image
- Build artifacts

**View releases**: https://github.com/ryakel/flight-budget/releases

---

## Docker Hub Description Sync

The workflow automatically updates your Docker Hub README:

```yaml
- name: Update Docker Hub Description
  uses: peter-evans/dockerhub-description@v4
```

**What syncs:**
- Repository description
- Full README content
- Links and documentation

Your Docker Hub page will always match your GitHub README!

---

## Troubleshooting

### Workflow Fails: "Invalid credentials"

**Problem**: Docker Hub authentication failed
**Solution**:
1. Verify `DOCKER_USERNAME` and `DOCKER_TOKEN` secrets exist
2. Regenerate Docker Hub token if needed
3. Ensure token has `Read, Write, Delete` permissions

### Workflow Fails: "Context access might be invalid"

**Problem**: Secret doesn't exist in GitHub
**Solution**: Add the secret following [Step 2](#step-2-add-secrets-to-github)

### Version Not Bumping

**Problem**: Tag not created on main push
**Solution**:
- Ensure you're pushing to `main` branch
- Check commit message includes version keyword
- Verify `GITHUB_TOKEN` has permissions

### Multi-Platform Build Timeout

**Problem**: Build takes too long and times out
**Solution**:
- This is rare but can happen
- Retry the workflow (often works second time)
- Consider reducing platforms if needed

### Portainer Not Updating

**Problem**: Container not redeploying
**Solution**:
1. Check `PORTAINER_WEBHOOK_URL` is correct
2. Verify webhook exists in Portainer
3. Check Portainer logs for errors

---

## Testing the Workflow

### Test 1: Development Build

```bash
# Create development branch
git checkout -b development

# Make a change
echo "# Test" >> README.md
git add README.md
git commit -m "test: development build"
git push origin development

# Check GitHub Actions
# Should build: ryakel/flight-budget:dev
```

### Test 2: Main Build with Version

```bash
# Switch to main
git checkout main

# Make a change
echo "# New feature" >> README.md
git add README.md
git commit -m "feat: add new feature"
git push origin main

# Check:
# 1. GitHub Actions runs
# 2. Creates tag (e.g., v0.0.1)
# 3. Builds two tags: latest + v0.0.1
# 4. Creates GitHub Release
# 5. Triggers Portainer webhook
```

### Test 3: Manual Tag

```bash
# Create and push tag
git tag v1.0.0
git push origin v1.0.0

# Check GitHub Actions
# Should build: ryakel/flight-budget:v1.0.0
```

---

## Monitoring Builds

### GitHub Actions

```
Repository → Actions → Docker Builder
```

View:
- Build logs
- Platform-specific build times
- Cache usage
- Errors and warnings

### Docker Hub

```
https://hub.docker.com/r/ryakel/flight-budget/tags
```

View:
- All tags
- Image sizes
- Architecture support
- Pull statistics

### GitHub Releases

```
Repository → Releases
```

View:
- Version history
- Changelogs
- Download statistics

---

## Best Practices

### Commit Messages

✅ **Good:**
```bash
git commit -m "fix: resolve aircraft persistence bug"
git commit -m "minor: add PDF export feature"
git commit -m "major: redesign UI"
```

❌ **Bad:**
```bash
git commit -m "updates"
git commit -m "WIP"
git commit -m "asdfasdf"
```

### Version Strategy

- **Patch (0.0.x)**: Bug fixes, minor updates
- **Minor (0.x.0)**: New features, non-breaking changes
- **Major (x.0.0)**: Breaking changes, major rewrites

### Branch Strategy

- **main**: Production-ready code
- **development**: Active development, testing
- **feature/***: Individual features (merge to development)

---

## Comparison: Old vs New Workflow

| Feature | Old Workflow | New Workflow |
|---------|--------------|--------------|
| **Versioning** | SHA-based | Semantic (v1.2.3) |
| **Platforms** | 2 (amd64, arm64) | 2 (amd64, arm64) |
| **Tags** | latest only | latest + versions |
| **Releases** | Manual | Automated |
| **Changelog** | Manual | Auto-generated |
| **Cache** | Registry | GitHub Actions |
| **SBOM** | No | Yes |
| **Provenance** | No | Yes |
| **Hub Description** | Manual | Auto-synced |

---

## Migration Checklist

- [ ] Add `DOCKER_USERNAME` secret
- [ ] Add `DOCKER_TOKEN` secret
- [ ] Add `PORTAINER_WEBHOOK_URL` secret (optional)
- [ ] Create `development` branch
- [ ] Test build on development
- [ ] Test build on main
- [ ] Verify Docker Hub tags
- [ ] Check GitHub Release created
- [ ] Confirm Portainer webhook works
- [ ] Update Portainer to use `:latest` tag

---

## Summary

### What Changed

✅ Token-based authentication (instead of password)
✅ Semantic versioning (v1.2.3)
✅ Multi-platform support (3 architectures)
✅ Automated GitHub releases
✅ Build cache management
✅ SBOM & provenance
✅ Docker Hub description sync
✅ Development branch support

### What You Need To Do

1. **Add 2 required secrets** (DOCKER_USERNAME, DOCKER_TOKEN)
2. **Add 1 optional secret** (PORTAINER_WEBHOOK_URL)
3. **Push to main** with a commit message like: `feat: enable semantic versioning`
4. **Watch the magic happen!** 🎉

---

**Documentation**: This guide
**Workflow File**: [`.github/workflows/docker-build.yml`](../.github/workflows/docker-build.yml)
**Status**: Ready to use after secrets are configured
**Next Steps**: Add secrets and test!
