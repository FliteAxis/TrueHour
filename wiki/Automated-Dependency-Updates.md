# Automated Dependency Updates

## Overview

This document explains how to automate dependency updates for the TrueHour, including options for Dependabot, Renovate Bot, and custom solutions.

---

## The Challenge

We vendor CDN libraries locally (PapaParse, Chart.js, html2pdf.js) which aren't in `package.json`, so standard tools like Dependabot can't automatically detect updates.

**Our vendored libraries:**
- `app/libs/papaparse.min.js`
- `app/libs/chart.umd.min.js`
- `app/libs/html2pdf.bundle.min.js`

---

## Solution Options

### Option 1: Renovate Bot ⭐ (RECOMMENDED)

**What is it?**
Renovate is like Dependabot but more powerful - it can detect and update dependencies in ANY file format using regex patterns.

**Pros:**
- ✅ Can parse `dependencies.json`
- ✅ Creates PRs automatically
- ✅ Checks npm registry for new versions
- ✅ Highly configurable
- ✅ Free for public repos

**Cons:**
- ⚠️ Requires GitHub App installation
- ⚠️ More complex setup than Dependabot

**Status:** ✅ Configured in [`renovate.json`](../renovate.json)

#### How Renovate Works

```
1. Renovate scans dependencies.json
   ↓
2. Extracts version numbers using regex
   ↓
3. Checks npm for newer versions
   ↓
4. Creates PR with updated versions
   ↓
5. GitHub Actions workflow downloads new files
   ↓
6. You review and merge
```

#### Setup Instructions

1. **Install Renovate GitHub App**
   - Go to: https://github.com/apps/renovate
   - Click "Install" or "Configure"
   - Select your repository: `ryakel/flight-budget`
   - Grant permissions

2. **Enable Renovate**
   - Renovate will detect `renovate.json` automatically
   - First run creates an onboarding PR
   - Review and merge the onboarding PR

3. **Configure Schedule**
   - Already set to: Mondays before 3AM UTC
   - Edit `renovate.json` to change

4. **Test It**
   ```bash
   # Manually trigger (if you have renovate CLI)
   npx renovate --dry-run
   ```

#### Expected Behavior

**When new version available:**
```
PR: Update dependency papaparse to 5.4.2

Files changed:
  dependencies.json
    - "version": "5.4.1"
    + "version": "5.4.2"

Merge this PR to update the library.
After merge, GitHub Actions will download the new version.
```

---

### Option 2: Dependabot (LIMITED)

**What is it?**
GitHub's built-in dependency update tool.

**Pros:**
- ✅ Built into GitHub (no setup)
- ✅ Can update GitHub Actions
- ✅ Can update Docker base images
- ✅ Security advisories integration

**Cons:**
- ❌ Cannot parse `dependencies.json`
- ❌ Cannot detect CDN library updates
- ⚠️ Only works with known package managers

**Status:** ✅ Configured in [`.github/dependabot.yml`](.github/dependabot.yml)

**What Dependabot WILL do:**
- ✅ Update GitHub Actions (e.g., `actions/checkout@v4` → `v5`)
- ✅ Update Docker base image (e.g., `nginx:alpine`)
- ✅ Alert on security vulnerabilities in known packages

**What Dependabot WON'T do:**
- ❌ Update PapaParse/Chart.js/html2pdf.js versions
- ❌ Parse `dependencies.json`

#### Current Configuration

```yaml
# .github/dependabot.yml
updates:
  # GitHub Actions
  - package-ecosystem: "github-actions"
    schedule:
      interval: "weekly"

  # Docker
  - package-ecosystem: "docker"
    directory: "/infrastructure"
    schedule:
      interval: "weekly"
```

---

### Option 3: Custom GitHub Action (CURRENT)

**What is it?**
Our custom workflow that reads `dependencies.json` and downloads libraries.

**Pros:**
- ✅ Already implemented
- ✅ Full control over logic
- ✅ No external dependencies
- ✅ Simple to understand

**Cons:**
- ❌ Doesn't detect new versions automatically
- ❌ Requires manual version updates in `dependencies.json`
- ⚠️ Weekly check but no intelligence

**Status:** ✅ Implemented in [`.github/workflows/update-dependencies.yml`](../.github/workflows/update-dependencies.yml)

#### How It Works

```yaml
on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday 2AM UTC
  workflow_dispatch:       # Manual trigger

steps:
  1. Read dependencies.json
  2. Download libraries with specified versions
  3. Create PR if files changed
```

**Note:** This workflow downloads what's in `dependencies.json` but doesn't check for newer versions.

---

## Comparison Matrix

| Feature | Renovate | Dependabot | Custom Action |
|---------|----------|------------|---------------|
| **Auto-detect updates** | ✅ Yes | ❌ No | ❌ No |
| **Update dependencies.json** | ✅ Yes | ❌ No | ❌ No |
| **Update GitHub Actions** | ✅ Yes | ✅ Yes | ❌ No |
| **Update Docker base** | ✅ Yes | ✅ Yes | ❌ No |
| **Security advisories** | ✅ Yes | ✅ Yes | ⚠️ Partial |
| **Setup complexity** | Medium | Low | Low |
| **Maintenance** | Low | None | Medium |
| **Cost** | Free | Free | Free |

---

## Recommended Setup: Hybrid Approach

Use **all three** together for maximum coverage:

### 1. Renovate Bot
- **Purpose**: Auto-detect and update CDN libraries
- **Monitors**: `dependencies.json`
- **Creates PRs**: When PapaParse/Chart.js/html2pdf.js have new versions
- **Schedule**: Weekly (Mondays)

### 2. Dependabot
- **Purpose**: Update infrastructure
- **Monitors**: GitHub Actions, Dockerfile
- **Creates PRs**: When `actions/checkout`, `nginx:alpine`, etc. update
- **Schedule**: Weekly (Mondays)

### 3. Custom Workflow
- **Purpose**: Download libraries after PR merge
- **Triggers**: After `dependencies.json` changes
- **Downloads**: Latest files from CDN
- **Schedule**: Weekly + manual

### Workflow Diagram

```
New library version released
         ↓
Renovate detects update
         ↓
Renovate creates PR:
  "Update papaparse to 5.4.2"
         ↓
You review & merge PR
         ↓
dependencies.json updated
         ↓
Custom GitHub Action triggered
         ↓
Downloads new library files
         ↓
Commits to repository
         ↓
Docker build triggered
         ↓
Deployed! ✅
```

---

## Setup Instructions

### Step 1: Enable Renovate (Recommended)

1. **Install Renovate App**
   ```
   Visit: https://github.com/apps/renovate
   Click: Install
   Select: ryakel/flight-budget
   Grant: Read & write access
   ```

2. **Merge Onboarding PR**
   - Renovate creates initial PR
   - Review configuration
   - Merge to activate

3. **Test It**
   - Wait for next scheduled run (Monday 3AM UTC)
   - Or manually trigger from Renovate dashboard

### Step 2: Verify Dependabot (Already Active)

1. **Check Configuration**
   ```bash
   cat .github/dependabot.yml
   ```

2. **View PRs**
   - Go to repository → Pull Requests
   - Look for PRs from `dependabot[bot]`

3. **Security Advisories**
   - Repository → Security → Dependabot alerts

### Step 3: Custom Workflow (Already Active)

No setup needed - already running!

**Manual trigger:**
```
GitHub → Actions → Update CDN Dependencies → Run workflow
```

---

## Monitoring Updates

### Check for Pending Updates

**Renovate:**
```
Repository → Settings → Integrations → Renovate
View dashboard → Check pending PRs
```

**Dependabot:**
```
Repository → Insights → Dependency graph → Dependabot
```

**Manual check:**
```bash
# Check npm for new versions
npm view papaparse versions --json
npm view chart.js versions --json
npm view html2pdf.js versions --json

# Compare to dependencies.json
cat dependencies.json | jq '.libraries | map_values(.version)'
```

---

## Handling Update PRs

### Renovate PR Example

```
PR: Update dependency papaparse to 5.4.2

Changes:
  dependencies.json
    - "version": "5.4.1"
    + "version": "5.4.2"

Checks:
  ✅ Renovate configuration valid
  ⏳ GitHub Actions (waiting)

Actions:
  1. Review changelog: https://github.com/mholt/PapaParse/releases
  2. Check breaking changes
  3. Approve if safe
  4. Merge PR
  5. Custom workflow downloads new file
  6. Docker build triggered
  7. Deployed!
```

### Best Practices

1. **Review Changelog**
   - Click library homepage link in `dependencies.json`
   - Read release notes
   - Check for breaking changes

2. **Test Locally**
   ```bash
   # Update dependencies.json locally
   vim dependencies.json

   # Download new version
   VERSION="5.4.2"
   curl -L -o app/libs/papaparse.min.js \
     "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/$VERSION/papaparse.min.js"

   # Test app
   open app/index.html
   ```

3. **Merge Strategy**
   - ✅ Auto-merge patch versions (5.4.1 → 5.4.2)
   - ⚠️ Review minor versions (5.4.0 → 5.5.0)
   - ❌ Manually review major versions (5.0.0 → 6.0.0)

---

## Security Updates

### Vulnerability Scanning

**GitHub Security Advisories:**
- Automatically scans for known vulnerabilities
- Creates Dependabot alerts
- Even for vendored libraries!

**Check advisories:**
```
Repository → Security → Dependabot alerts
```

### Response Process

1. **Alert received**
   - GitHub sends email notification
   - Alert appears in Security tab

2. **Assess severity**
   - Critical: Update immediately
   - High: Update within 24 hours
   - Medium/Low: Update in next release

3. **Update process**
   - Edit `dependencies.json` with fixed version
   - Push changes
   - Custom workflow downloads new file
   - Deploy ASAP

---

## Configuration Files

### renovate.json
```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:base"],
  "schedule": ["before 3am on Monday"],
  "regexManagers": [
    {
      "fileMatch": ["^dependencies\\.json$"],
      "matchStrings": ["...regex patterns..."],
      "datasourceTemplate": "npm"
    }
  ]
}
```

**Location**: `/renovate.json`
**Purpose**: Configure Renovate Bot behavior

### .github/dependabot.yml
```yaml
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "docker"
    directory: "/infrastructure"
    schedule:
      interval: "weekly"
```

**Location**: `/.github/dependabot.yml`
**Purpose**: Configure Dependabot for Actions & Docker

### dependencies.json
```json
{
  "libraries": {
    "papaparse": {
      "version": "5.4.1",
      "url": "https://..."
    }
  }
}
```

**Location**: `/dependencies.json`
**Purpose**: Single source of truth for versions

---

## Troubleshooting

### Renovate Not Creating PRs

**Check:**
1. Is Renovate App installed?
2. Does repository have `renovate.json`?
3. Are there actually updates available?
4. Check Renovate dashboard for errors

**Debug:**
```bash
# Test Renovate config
npx renovate-config-validator

# Check npm for versions
npm view papaparse versions
```

### Dependabot Not Running

**Check:**
1. Is `.github/dependabot.yml` valid?
2. Are there pending updates?
3. Check repository Insights → Dependency graph

**Validate:**
```bash
# Validate YAML syntax
yamllint .github/dependabot.yml
```

### Custom Workflow Failed

**Check:**
1. GitHub Actions logs
2. Network connectivity to CDNs
3. Version exists on CDN

**Manual test:**
```bash
VERSION="5.4.1"
curl -I "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/$VERSION/papaparse.min.js"
```

---

## Cost & Limits

| Tool | Cost | Limits |
|------|------|--------|
| **Renovate** | Free (public repos) | None |
| **Dependabot** | Free (all repos) | None |
| **GitHub Actions** | Free (2000 min/month) | 2000 minutes |

**Our usage:** ~5 minutes/week = 20 min/month (well under limit)

---

## Summary

### Current State ✅
- ✅ `dependencies.json` (single source of truth)
- ✅ Custom workflow (downloads libraries)
- ✅ Dependabot (Actions & Docker)
- ✅ Renovate config (ready to enable)

### Recommended Action

**Enable Renovate Bot** for fully automated dependency updates:

1. Install: https://github.com/apps/renovate
2. Merge onboarding PR
3. Enjoy automatic update PRs! 🎉

### Without Renovate

Current system still works:
- Manual updates to `dependencies.json`
- Custom workflow downloads files
- Works fine, just not automated

---

## Further Reading

- **Renovate Docs**: https://docs.renovatebot.com/
- **Dependabot Docs**: https://docs.github.com/en/code-security/dependabot
- **Our Dependency Guide**: [DEPENDENCY_MANAGEMENT.md](DEPENDENCY_MANAGEMENT.md)

---

**Last Updated**: 2025-11-27
**Status**: Renovate configured, ready to enable
**Recommendation**: Install Renovate App for full automation
