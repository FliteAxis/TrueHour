# GitHub Actions Workflows

## Overview

This repository uses GitHub Actions for automated CI/CD, dependency management, and issue maintenance. All workflows are located in [`.github/workflows/`](../.github/workflows/).

---

## Active Workflows

### 1. Docker Builder (Main)
**File**: [`.github/workflows/docker-build.yml`](../.github/workflows/docker-build.yml)

**Purpose**: Builds and publishes production Docker images with semantic versioning

**Triggers**:
- Push to `main` branch
- Manual tags (e.g., `v1.5.0`)
- Manual workflow dispatch

**Key Features**:
- Multi-platform builds (amd64, arm64)
- Semantic versioning based on commit messages
- Automated GitHub releases
- Docker Hub description sync
- Portainer webhook trigger

**Tags Produced**:
- `main` branch: `latest` + semantic version (e.g., `v1.2.3`)
- Manual tags: Specific version (e.g., `v1.5.0`)

### 2. Docker Builder (Develop)
**File**: [`.github/workflows/docker-build-develop.yml`](../.github/workflows/docker-build-develop.yml)

**Purpose**: Builds and publishes development Docker images for testing

**Triggers**:
- Push to `develop` branch
- Manual workflow dispatch

**Key Features**:
- Multi-platform builds (amd64, arm64)
- No semantic versioning (always overwrites)
- No GitHub releases
- No Portainer webhook

**Tags Produced**:
- `develop` branch: `develop` (always overwrites)

**Required Secrets** (both workflows):
- `DOCKER_USERNAME`: Docker Hub username (ryakel)
- `DOCKER_TOKEN`: Docker Hub access token
- `PORTAINER_WEBHOOK_URL`: Optional Portainer webhook (main only)

**Documentation**: [DOCKER_BUILD_SETUP.md](DOCKER_BUILD_SETUP.md), [BRANCH_STRATEGY.md](BRANCH_STRATEGY.md)

---

### 3. Update CDN Dependencies
**File**: [`.github/workflows/update-dependencies.yml`](../.github/workflows/update-dependencies.yml)

**Purpose**: Downloads and updates vendored JavaScript libraries

**Triggers**:
- Schedule: Weekly on Sunday at 2:00 AM UTC
- Manual workflow dispatch
- Push to `main` (when `dependencies.json` changes)

**Key Features**:
- Reads versions from `dependencies.json`
- Downloads from CDN URLs
- Creates PR if files changed
- Generates version report

**Libraries Managed**:
- PapaParse (CSV parsing)
- Chart.js (data visualization)
- html2pdf.js (PDF generation)

**Documentation**: [DEPENDENCY_MANAGEMENT.md](DEPENDENCY_MANAGEMENT.md)

---

### 4. Close Inactive Issues
**File**: [`.github/workflows/stale.yml`](../.github/workflows/stale.yml)

**Purpose**: Automatically closes stale issues and pull requests

**Triggers**:
- Schedule: Daily at 1:30 AM UTC

**Behavior**:

**Issues**:
- Marked stale after **30 days** of inactivity
- Closed after **5 days** of being stale
- Warning message: "This issue is stale because it has been open 30 days with no activity. Remove stale label or comment or this will be closed in 5 days."

**Pull Requests**:
- Marked stale after **45 days** of inactivity
- Closed after **10 days** of being stale
- Warning message: "This PR is stale because it has been open 45 days with no activity. Remove stale label or comment or this will be closed in 10 days."

**Exempt Labels**:
- `awaiting-approval`: Issues/PRs waiting for review
- `wip`: Work in progress items

**How to Prevent Closure**:
1. Add a comment to the issue/PR
2. Remove the `stale` label
3. Add an exempt label (`awaiting-approval` or `wip`)

---

## Workflow Permissions

All workflows use minimal required permissions following security best practices:

### Docker Builder
```yaml
permissions:
  contents: read
  packages: write
  attestations: write
  id-token: write
```

### Update Dependencies
```yaml
permissions:
  contents: write
  pull-requests: write
```

### Stale Issues
```yaml
permissions:
  contents: write
  issues: write
  pull-requests: write
```

---

## Manual Workflow Triggers

You can manually trigger workflows from the GitHub Actions tab:

### Trigger Docker Build
```
Repository → Actions → Docker Builder → Run workflow
```

**Options**:
- Choose branch: `main`, `development`, or any branch
- Builds and pushes Docker image immediately

### Trigger Dependency Update
```
Repository → Actions → Update CDN Dependencies → Run workflow
```

**Result**:
- Downloads latest versions from `dependencies.json`
- Creates PR if files changed

### Stale Workflow
No manual trigger needed - runs automatically daily.

---

## Monitoring Workflows

### View Workflow Runs
```
Repository → Actions → Select workflow
```

**Information Available**:
- Run status (success/failure)
- Execution time
- Logs for each step
- Artifacts produced

### Check Build Status
Badge in README shows current status:
- ✅ Green: All workflows passing
- ❌ Red: One or more workflows failing
- ⚪ Gray: Workflow in progress

### Notifications
GitHub sends email notifications for:
- Workflow failures
- Security alerts
- Dependabot updates

---

## Workflow Dependencies

### External Actions Used

**Docker Builder**:
- `actions/checkout@v4` - Repository checkout
- `docker/login-action@v3` - Docker Hub authentication
- `docker/setup-qemu-action@v3` - Multi-platform emulation
- `docker/setup-buildx-action@v3` - Docker Buildx setup
- `docker/metadata-action@v5` - Docker metadata extraction
- `docker/build-push-action@v6` - Docker build and push
- `mathieudutour/github-tag-action@v6.2` - Semantic versioning
- `ncipollo/release-action@v1.16.0` - GitHub release creation
- `peter-evans/dockerhub-description@v4` - Docker Hub sync
- `MyAlbum/purge-cache@v2` - Build cache purging

**Update Dependencies**:
- `actions/checkout@v4` - Repository checkout
- `peter-evans/create-pull-request@v7` - PR creation

**Stale Issues**:
- `actions/stale@v9` - Stale issue management

---

## Troubleshooting

### Workflow Failed: "Invalid credentials"
**Problem**: Docker Hub authentication failed

**Solution**:
1. Verify `DOCKER_USERNAME` and `DOCKER_TOKEN` secrets exist
2. Regenerate Docker Hub token if needed
3. Ensure token has `Read, Write, Delete` permissions

### Workflow Failed: "Context access might be invalid"
**Problem**: Secret doesn't exist in GitHub

**Solution**:
1. Go to Repository → Settings → Secrets and variables → Actions
2. Add missing secret(s)

### Dependencies Not Updating
**Problem**: `update-dependencies.yml` runs but no PR created

**Possible Causes**:
- No version changes detected
- Files already up to date
- Network issue downloading from CDN

**Solution**:
1. Check workflow logs
2. Manually verify CDN URLs in `dependencies.json`
3. Test download locally:
   ```bash
   curl -I "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js"
   ```

### Stale Workflow Not Running
**Problem**: Issues not being marked stale

**Check**:
1. Workflow enabled? (Repository → Actions → Close inactive issues)
2. Issues have exempt labels? (`awaiting-approval`, `wip`)
3. Recent activity? (Comments reset the stale timer)

---

## Best Practices

### Commit Messages (for semantic versioning)
```bash
# Patch release (v1.2.3 → v1.2.4)
git commit -m "fix: resolve CSV upload bug"
git commit -m "patch: update dependencies"

# Minor release (v1.2.3 → v1.3.0)
git commit -m "minor: add aircraft comparison feature"
git commit -m "feat: implement dark mode"

# Major release (v1.2.3 → v2.0.0)
git commit -m "major: redesign UI"
git commit -m "breaking: remove legacy API"
```

### Workflow Maintenance
- Review and update action versions quarterly
- Monitor workflow execution times
- Clean up old workflow runs (Settings → Actions → General)

### Security
- Use secrets for all sensitive data
- Never commit credentials
- Rotate tokens annually
- Enable secret scanning (Settings → Code security and analysis)

---

## Cost & Usage

### GitHub Actions Minutes
- **Free tier**: 2,000 minutes/month for public repositories
- **Current usage**: ~20 minutes/week (80 min/month)
- **Well under limit**: ✅

### Breakdown by Workflow
| Workflow | Frequency | Duration | Monthly |
|----------|-----------|----------|---------|
| Docker Builder | ~2-3 builds/week | ~5-8 min | ~40 min |
| Update Dependencies | Weekly | ~2 min | ~8 min |
| Stale Issues | Daily | ~30 sec | ~15 min |
| **Total** | | | **~63 min/month** |

---

## Future Enhancements

### Planned Improvements
- [ ] Add test workflow (unit tests, linting)
- [ ] Implement security scanning (Trivy, Snyk)
- [ ] Add performance benchmarking
- [ ] Create release notes automation
- [ ] Implement auto-merge for patch updates

### Considerations
- Add branch protection rules
- Require status checks before merge
- Enable auto-merge for Renovate PRs
- Implement deployment environments (staging/prod)

---

## Related Documentation

- [Docker Build Setup](DOCKER_BUILD_SETUP.md) - Detailed Docker build configuration
- [Dependency Management](DEPENDENCY_MANAGEMENT.md) - Managing library versions
- [Automated Updates](AUTOMATED_DEPENDENCY_UPDATES.md) - Renovate & Dependabot setup
- [Deployment Guide](DEPLOYMENT.md) - Portainer deployment with webhooks

---

**Last Updated**: 2025-11-27
**Active Workflows**: 3
**Status**: All workflows operational
**Required Setup**: Docker Hub secrets (see [DOCKER_BUILD_SETUP.md](DOCKER_BUILD_SETUP.md))
